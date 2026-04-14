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
    
    // 1. Gather metrics
    const { count: leadsFound } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', input.campaignId);

    const { count: qualifiedLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', input.campaignId)
      .eq('qualification_status', 'qualified');

    const { count: draftsGenerated } = await supabase
      .from('outreach_drafts')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', input.campaignId);

    // 2. Generate summary using AI
    const userPrompt = `
      Campaign Reporting Data:
      - Leads Found: ${leadsFound}
      - Qualified Leads: ${qualifiedLeads}
      - Outreach Drafts Generated: ${draftsGenerated}
      
      Provide a campaign report with a title, summary, bottlenecks observed, and recommendations for improvement.
    `;

    const result = await openAIService.generateStructuredOutput<z.infer<typeof ReportSummarySchema>>({
      systemPrompt: 'You are a campaign performance analyst. Provide insights based on the workflow metrics.',
      userPrompt,
      schema: {},
    });

    // 3. Persist report
    const { data: report, error } = await supabase.from('reports').insert({
      campaign_id: input.campaignId,
      workspace_id: input.workspaceId,
      title: result.title,
      summary: result.summary,
      leads_found: leadsFound || 0,
      qualified_leads: qualifiedLeads || 0,
      drafts_generated: draftsGenerated || 0,
      bottlenecks: result.bottlenecks,
      recommendations: result.recommendations,
    }).select().single();

    if (error) throw error;

    return {
      reportId: report.id,
      title: result.title,
    };
  }
}
