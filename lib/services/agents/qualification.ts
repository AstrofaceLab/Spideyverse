import { openAIService } from '../openai';
import { createAdminClient } from '../../supabase/admin';
import { z } from 'zod';

export interface QualificationInput {
  campaignId: string;
  workspaceId: string;
  campaignContext: any;
}

const QualificationSchema = z.object({
  score: z.number().min(0).max(100),
  status: z.enum(['qualified', 'disqualified', 'pending_review']),
  reasoning: z.string(),
  tags: z.array(z.string()),
});

export class QualificationAgent {
  async run(input: QualificationInput) {
    console.log(`[QualificationAgent] Starting for campaign ${input.campaignId}`);
    
    const supabase = createAdminClient();
    
    // 1. Fetch leads for this campaign that are 'new'
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', input.campaignId)
      .eq('qualification_status', 'new');

    if (fetchError) throw fetchError;
    if (!leads || leads.length === 0) {
      return { qualified: 0, disqualified: 0 };
    }

    let qualifiedCount = 0;
    let disqualifiedCount = 0;

    // 2. Process each lead (in batches or one by one for better context)
    // For Phase 4, we'll do them in a loop, but in production, we might batch them.
    for (const lead of leads) {
      const userPrompt = `
        Campaign Context: ${JSON.stringify(input.campaignContext)}
        Lead Data:
        - Company: ${lead.company_name}
        - Role: ${lead.contact_role}
        - Summary: ${lead.summary}
        
        Evaluate if this lead is a good match for the campaign.
        Provide a score (0-100), status, reasoning, and tags.
      `;

      try {
        const result = await openAIService.generateStructuredOutput<z.infer<typeof QualificationSchema>>({
          systemPrompt: 'You are a professional lead qualification agent. Analyze the lead against the campaign objectives.',
          userPrompt,
          schema: {}, // Schema is enforced by types here
        });

        // 3. Update lead in DB
        await supabase
          .from('leads')
          .update({
            score: result.score,
            qualification_status: result.status,
            reasoning: result.reasoning,
            tags: result.tags,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id);

        if (result.status === 'qualified') qualifiedCount++;
        else disqualifiedCount++;
      } catch (err) {
        console.error(`Failed to qualify lead ${lead.id}:`, err);
      }
    }

    return {
      qualified: qualifiedCount,
      disqualified: disqualifiedCount,
    };
  }
}
