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
      .eq('qualification_status', 'new')
      .limit(50); // Hard limit for safety

    if (fetchError) throw fetchError;
    if (!leads || leads.length === 0) {
      return { qualified: 0, disqualified: 0 };
    }

    let qualifiedCount = 0;
    let disqualifiedCount = 0;

    // Scoring Rubric defined in system prompt
    const systemPrompt = `You are a strict B2B Sales Development Representative (SDR). 
Your task is to qualify leads based on a specific campaign context.

SCORING RUBRIC (0-100):
- 80-100: Perfect match. Company industry, size, and contact role align perfectly with ICP.
- 50-79: Moderate match. Might be the right company but wrong role, or slightly off-niche.
- 0-49: Poor match. Reject these.

REJECTION CRITERIA:
- Missing critical info (no company name or website).
- Totally unrelated industry.
- Generic consumer emails if B2B is targeted.

Output strictly in JSON format.`;

    // 2. Process each lead
    for (const lead of leads) {
      const userPrompt = `
        CAMPAIGN CONTEXT:
        Niche: ${input.campaignContext.niche}
        Target Region: ${input.campaignContext.target_region}
        Ideal Lead Profile: ${input.campaignContext.ideal_lead_profile}
        Business Type: ${input.campaignContext.business_type}

        LEAD DATA:
        Company: ${lead.company_name}
        Website: ${lead.company_website}
        Role: ${lead.contact_role}
        Contact Name: ${lead.contact_name}
        Summary: ${lead.summary}
        
        Evaluate this lead. Be critical.`;

      try {
        const result = await openAIService.generateStructuredOutput<z.infer<typeof QualificationSchema>>({
          systemPrompt,
          userPrompt,
          schema: {
            type: "object",
            properties: {
              score: { type: "number", minimum: 0, maximum: 100 },
              status: { type: "string", enum: ["qualified", "disqualified", "pending_review"] },
              reasoning: { type: "string" },
              tags: { type: "array", items: { type: "string" } }
            },
            required: ["score", "status", "reasoning", "tags"]
          },
        });

        // Forced rejection if score is too low
        let finalStatus = result.status;
        if (result.score < 50) finalStatus = 'disqualified';

        // 3. Update lead in DB
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            score: result.score,
            qualification_status: finalStatus,
            reasoning: result.reasoning,
            tags: result.tags,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id);

        if (updateError) {
          console.error(`[QualificationAgent] Error updating lead ${lead.id}:`, updateError);
        } else {
          if (finalStatus === 'qualified') qualifiedCount++;
          else disqualifiedCount++;
        }
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

