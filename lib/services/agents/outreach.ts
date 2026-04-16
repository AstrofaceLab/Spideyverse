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

    const systemPrompt = `You are an elite Sales Copywriter specialized in ultra-personalized outbound.
Your goal is to write 1-on-1 emails that don't sound like automation.

GUIDELINES:
- Reference their company name or industry naturally.
- Keep the body under 100 words.
- No "Hope you're doing well" fluff.
- Clear, low-friction Call to Action (CTA).
- Focus on the VALUE they get, not your features.

Output strictly in JSON format.`;

    for (const lead of leads) {
      const userPrompt = `
        CAMPAIGN CONTEXT:
        Objective: ${input.campaignContext.objective}
        Offer: ${input.campaignContext.offer_context}
        Value Prop: ${input.campaignContext.value_proposition}
        Tone: ${input.campaignContext.outreach_tone}

        LEAD DATA:
        Name: ${lead.contact_name || 'there'}
        Company: ${lead.company_name}
        Role: ${lead.contact_role}
        Summary: ${lead.summary}
        
        Write a sharp outreach message for this person.`;

      try {
        const result = await openAIService.generateStructuredOutput<z.infer<typeof OutreachDraftSchema>>({
          systemPrompt,
          userPrompt,
          schema: {
            type: "object",
            properties: {
              subject_line: { type: "string" },
              opening_line: { type: "string" },
              message_body: { type: "string" },
              cta: { type: "string" }
            },
            required: ["subject_line", "opening_line", "message_body", "cta"]
          },
        });

        // 2. Persist draft
        const { error: draftError } = await supabase.from('outreach_drafts').insert({
          campaign_id: input.campaignId,
          workspace_id: input.workspaceId,
          lead_id: lead.id,
          subject_line: result.subject_line,
          opening_line: result.opening_line,
          message_body: result.message_body,
          cta: result.cta,
          tone_label: input.campaignContext.outreach_tone,
          generated_by: 'Outreach Agent',
          draft_status: 'pending_review',
        });

        if (draftError) {
          console.error(`[OutreachAgent] Error saving draft for lead ${lead.id}:`, draftError);
          continue;
        }

        // Update lead status to reflect draft created
        const { error: leadError } = await supabase.from('leads').update({ qualification_status: 'pending_review' }).eq('id', lead.id);
        
        if (leadError) {
          console.error(`[OutreachAgent] Error updating lead status ${lead.id}:`, leadError);
        }

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

