import { openAIService } from '../openai';
import { createAdminClient } from '../../supabase/admin';
import { z } from 'zod';

export interface OutreachInput {
  campaignId: string;
  workspaceId: string;
  campaignContext: any;
}

const OutreachDraftSchema = z.object({
  subject_line: z.string(),
  opening_line: z.string(),
  message_body: z.string(),
  cta: z.string(),
  follow_up: z.string(),
});

export class OutreachAgent {
  async run(input: OutreachInput) {
    console.log(`[OutreachAgent] Starting for campaign ${input.campaignId}`);
    
    const supabase = createAdminClient();
    
    // 1. Fetch qualified leads
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', input.campaignId)
      .eq('qualification_status', 'qualified');

    if (fetchError) throw fetchError;
    if (!leads || leads.length === 0) {
      return { draftsCreated: 0 };
    }

    let draftsCount = 0;

    for (const lead of leads) {
      const userPrompt = `
        Campaign Context: ${JSON.stringify(input.campaignContext)}
        Lead Data:
        - Name: ${lead.contact_name}
        - Company: ${lead.company_name}
        - Role: ${lead.contact_role}
        
        Generate a highly personalized outreach draft for this lead.
        Tone: ${input.campaignContext.outreach_tone}
        Objective: ${input.campaignContext.objective}
        Offer: ${input.campaignContext.offer_context}
      `;

      try {
        const result = await openAIService.generateStructuredOutput<z.infer<typeof OutreachDraftSchema>>({
          systemPrompt: 'You are an expert sales outreach copywriter. Create personalized, high-converting messages.',
          userPrompt,
          schema: {},
        });

        // 2. Persist draft
        await supabase.from('outreach_drafts').insert({
          campaign_id: input.campaignId,
          workspace_id: input.workspaceId,
          lead_id: lead.id,
          subject_line: result.subject_line,
          opening_line: result.opening_line,
          message_body: result.message_body,
          cta: result.cta,
          follow_up: result.follow_up,
          tone_label: input.campaignContext.outreach_tone,
          generated_by: 'Outreach Agent',
          draft_status: 'pending_review',
        });

        draftsCount++;
      } catch (err) {
        console.error(`Failed to generate draft for lead ${lead.id}:`, err);
      }
    }

    return {
      draftsCreated: draftsCount,
    };
  }
}
