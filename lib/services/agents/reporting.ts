import { openAIService } from '../openai';
import { createAdminClient } from '../../supabase/admin';
import { z } from 'zod';

export interface ReportingInput {
  workflowRunId: string;
  campaignId: string;
  workspaceId: string;
}

const ReportSummarySchema = z.object({
  title: z.string(),
  summary: z.string(),
  bottlenecks: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export class ReportingAgent {
  async run(input: ReportingInput) {
    console.log(`[ReportingAgent] Starting for campaign ${input.campaignId}`);
    
    const supabase = createAdminClient();
    
    // 1. Gather deep metrics
    const { data: leads } = await supabase
      .from('leads')
      .select('qualification_status, email, score')
      .eq('campaign_id', input.campaignId);

    const leadsFound = leads?.length || 0;
    const qualifiedLeads = leads?.filter(l => l.qualification_status === 'qualified' || l.qualification_status === 'pending_review').length || 0;
    const leadsWithEmail = leads?.filter(l => !!l.email).length || 0;
    const avgScore = leads?.length ? leads.reduce((acc, l) => acc + (l.score || 0), 0) / leads.length : 0;

    const { count: draftsGenerated } = await supabase
      .from('outreach_drafts')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', input.campaignId);

    const emailCoverage = leadsFound > 0 ? (leadsWithEmail / leadsFound) * 100 : 0;
    const qualificationRate = leadsFound > 0 ? (qualifiedLeads / leadsFound) * 100 : 0;

    // 2. Generate summary using AI
    const userPrompt = `
      Campaign Performance Data:
      - Total Leads Sourced via Serper: ${leadsFound}
      - Extraction Success (Emails Found): ${leadsWithEmail} (${emailCoverage.toFixed(1)}%)
      - Qualified Leads (ICP Match): ${qualifiedLeads} (${qualificationRate.toFixed(1)}%)
      - Average Lead Quality Score: ${avgScore.toFixed(1)}/100
      - Personalized Drafts Created: ${draftsGenerated}
      
      Provide a strategic report summary. Identify if the search queries were effective or if the ICP needs refining.`;

    const result = await openAIService.generateStructuredOutput<z.infer<typeof ReportSummarySchema>>({
      systemPrompt: 'You are a Senior Strategic Growth Analyst. Provide a critical and actionable report.',
      userPrompt,
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          bottlenecks: { type: "array", items: { type: "string" } },
          recommendations: { type: "array", items: { type: "string" } }
        },
        required: ["title", "summary", "bottlenecks", "recommendations"]
      },
    });

    // 3. Persist report with expanded metrics
    const { data: report, error } = await supabase.from('reports').insert({
      campaign_id: input.campaignId,
      workspace_id: input.workspaceId,
      title: result.title,
      summary: result.summary,
      leads_found: leadsFound,
      qualified_leads: qualifiedLeads,
      drafts_generated: draftsGenerated || 0,
      bottlenecks: result.bottlenecks,
      recommendations: result.recommendations,
      // We assume the schema supports extra JSON or we'll just put it in the summary if not
    }).select().single();

    if (error) {
      console.error('Report Insertion Error:', error);
    }

    return {
      reportId: report?.id,
      metrics: {
        leadsFound,
        emailCoverage: `${emailCoverage.toFixed(1)}%`,
        qualificationRate: `${qualificationRate.toFixed(1)}%`,
        avgScore: avgScore.toFixed(1)
      }
    };
  }
}
