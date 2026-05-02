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

/**
 * Senior Sales Qualifier Agent. 
 * Converts 'new' raw records into high-intent 'qualified' prospects.
 */
export class QualificationAgent {
  async run(input: QualificationInput) {
    console.log(`[QualificationAgent] Processing qualification queue for campaign ${input.campaignId}`);
    
    const supabase = createAdminClient();
    
    // 1. Fetch 'new' leads discovered by the Research stage
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', input.campaignId)
      .eq('qualification_status', 'new')
      .limit(60); 

    if (fetchError) throw fetchError;
    if (!leads || leads.length === 0) {
      console.log('[QualificationAgent] Queue is empty. Nothing to qualify.');
      return { qualified: 0, disqualified: 0 };
    }

    let qualifiedCount = 0;
    let disqualifiedCount = 0;

    const systemPrompt = `You are a Senior B2B Sales Development Architect.
Your task is to perform rigorous ICP (Ideal Customer Profile) matching.

SCORING WEIGHTS:
- Industry Alignment (40%): Does the company niche match the campaign niche?
- Decision Maker Fit (30%): Is the contact role a stakeholder (CEO, Founder, Manager, Head of)?
- Opportunity Context (20%): Does their site content suggest they need the offer?
- Data Integrity (10%): Do we have a verified email and website?

SCORING RUBRIC (0-100):
- 90-100: Platinum Match. Absolute ICP.
- 70-89: Strong Match. Good company, slightly off role.
- 50-69: Potential. Worth a manual look (Pending Review).
- 0-49: Junk. Totally unrelated or low-quality data.

HARD REJECTIONS:
- No email and no contact person.
- Totally unrelated industry.
- Competitors of the client's business.

Output strictly in JSON format.`;

    // 2. Batch process qualification
    for (const lead of leads) {
      const userPrompt = `
        CAMPAIGN CRITERIA:
        - Niche Target: ${input.campaignContext.niche}
        - Regional Target: ${input.campaignContext.target_region}
        - Ideal Prospect: ${input.campaignContext.ideal_lead_profile}
        - Our Offer: ${input.campaignContext.offer_context}
        - Target Business: ${input.campaignContext.business_type}

        LEAD DATA TO EVALUATE:
        - Company: ${lead.company_name}
        - Web: ${lead.company_website}
        - Full Summary: ${lead.summary}
        - Contact: ${lead.contact_name} (${lead.contact_role || 'Unknown Role'})
        - Email: ${lead.email || 'NOT FOUND'}

        Determine if this lead is worth our outreach credits. Be ruthless.`;

      try {
        const result = await openAIService.generateStructuredOutput<z.infer<typeof QualificationSchema>>({
          systemPrompt,
          userPrompt,
          schema: {
            type: "object",
            properties: {
              score: { type: "number", minimum: 0, maximum: 100 },
              status: { type: "string", enum: ["qualified", "disqualified", "pending_review"] },
              reasoning: { type: "string", description: "Bullet point reasoning for the score." },
              tags: { type: "array", items: { type: "string" } }
            },
            required: ["score", "status", "reasoning", "tags"]
          },
        });

        // 3. Apply Automated Thresholds
        let finalStatus = result.status;
        if (result.score >= 70) finalStatus = 'qualified';
        else if (result.score >= 50) finalStatus = 'pending_review';
        else finalStatus = 'disqualified';

        // Additional hard-gate for production: No email = No qualified status
        if (!lead.email && finalStatus === 'qualified') {
          finalStatus = 'pending_review'; // Force review if we don't have a direct contact point
        }

        // 4. Update lead in DB
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
          console.error(`[QualificationAgent] Sync failure for lead ${lead.id}:`, updateError.message);
        } else {
          if (finalStatus === 'qualified') qualifiedCount++;
          else disqualifiedCount++;
        }
      } catch (err: any) {
        console.error(`[QualificationAgent] Execution error for lead ${lead.id}:`, err.message);
      }
    }

    return {
      qualified: qualifiedCount,
      disqualified: disqualifiedCount,
    };
  }
}
