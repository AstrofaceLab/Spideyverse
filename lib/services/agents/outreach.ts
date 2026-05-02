import { openAIService } from '../openai';
import { createAdminClient } from '../../supabase/admin';
import { z } from 'zod';

export interface OutreachInput {
  campaignId: string;
  workspaceId: string;
  campaignContext: any;
}

export const OutreachDraftSchema = z.object({
  subject_line: z.string(),
  opening_line: z.string(),
  message_body: z.string(),
  cta: z.string(),
});

/**
 * Elite Conversion Copywriter Agent.
 * Crafts 1-on-1, non-automated outreach drafts for qualified prospects.
 */
export class OutreachAgent {
  async run(input: OutreachInput) {
    console.log(`[OutreachAgent] Drafting personalized outreach for campaign ${input.campaignId}`);

    const supabase = createAdminClient();

    // 1. Fetch only 'qualified' leads for outreach
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', input.campaignId)
      .eq('qualification_status', 'qualified');

    if (fetchError) throw fetchError;
    if (!leads || leads.length === 0) {
      console.log('[OutreachAgent] No qualified leads found. Skipping draft generation.');
      return { draftsCreated: 0 };
    }

    let draftsCount = 0;

    // 2. Iterate through leads to craft individual drafts
    for (const lead of leads) {
      try {
        await this.generateDraftForLead(lead, input.campaignContext, input.workspaceId);
        draftsCount++;
      } catch (err: any) {
        console.error(`[OutreachAgent] Draft generation failed for ${lead.id}:`, err.message);
      }
    }

    return {
      draftsCreated: draftsCount,
    };
  }

  async generateDraftForLead(lead: any, campaignContext: any, workspaceId: string) {
    const supabase = createAdminClient();

    const systemPrompt = `You are an Elite B2B Direct-Response Copywriter.
Your task is to write high-conversion, ultra-short outreach emails that feel like they were written by a peer, not a bot.

CONSTRAINTS:
- Word Count: Max 80 words.
- Tone: ${campaignContext.outreach_tone || 'Professional yet casual'}.
- No "Hope you're well" or "My name is...".
- No formal sign-offs (use simple "Cheers" or just a name).
- Use the "Bridge" method: Observe their current state → Bridge to the value → Low-friction question.

DRAFT STRUCTURE:
- Subject Line: Short (3-5 words), curiosity-driven or specific.
- Opening: 1 sentence maximum. Reference their specific work/industry.
- Body: 2-3 short sentences on how the offer solves a problem they likely have.
- CTA: A "low-friction" question (e.g., "Open to a quick chat next week?" or "Should I send over a 2-min breakdown?").

Output strictly in JSON format.`;

    const userPrompt = `
      MY CAMPAIGN CONTEXT:
      - Offer: ${campaignContext.offer_context}
      - Value Prop: ${campaignContext.value_proposition}
      - Success Story (if any): ${campaignContext.objective}

      PROSPECT DATA:
      - Name: ${lead.contact_name || 'there'}
      - Role: ${lead.contact_role || 'stakeholder'}
      - Company: ${lead.company_name}
      - Company Mission/Context: ${lead.summary}
      
      Write a sharp, high-intent outreach draft.`;

    const result = await openAIService.generateStructuredOutput<z.infer<typeof OutreachDraftSchema>>({
      systemPrompt,
      userPrompt,
      schema: {
        type: "object",
        properties: {
          subject_line: { type: "string", description: "Catchy, non-spammy subject line." },
          opening_line: { type: "string", description: "Personalized observation line." },
          message_body: { type: "string", description: "The core value proposition and bridge." },
          cta: { type: "string", description: "The low-friction closing question." }
        },
        required: ["subject_line", "opening_line", "message_body", "cta"]
      },
    });

    // 3. Persist/Upsert the AI-generated draft
    // We use upsert if a draft already exists for this lead/campaign
    const { error: draftError } = await supabase.from('outreach_drafts').upsert({
      campaign_id: lead.campaign_id,
      workspace_id: workspaceId,
      lead_id: lead.id,
      subject_line: result.subject_line,
      opening_line: result.opening_line,
      message_body: result.message_body,
      cta: result.cta,
      tone_label: campaignContext.outreach_tone,
      generated_by: 'Outreach Agent (Regen)',
      draft_status: 'pending_review',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'lead_id' }); // Assuming lead_id is unique per campaign in outreach_drafts

    if (draftError) throw draftError;

    // 4. Update lead status to 'pending_review'
    const { error: leadError } = await supabase
      .from('leads')
      .update({ qualification_status: 'pending_review' })
      .eq('id', lead.id);

    if (leadError) throw leadError;

    return result;
  }
}


