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

/**
 * Senior Strategic Growth Analyst Agent.
 * Aggregates campaign data into actionable intelligence.
 */
export class ReportingAgent {
  async run(input: ReportingInput) {
    console.log(`[ReportingAgent] Analyzing campaign performance for ${input.campaignId}`);
    
    const supabase = createAdminClient();
    
    // 1. Gather deep metrics from DB
    const { data: leads } = await supabase
      .from('leads')
      .select('qualification_status, email, score, source')
      .eq('campaign_id', input.campaignId);

    // 2. Fetch run details to see query success
    const { data: tasks } = await supabase
      .from('agent_tasks')
      .select('stage, output_json')
      .eq('workflow_run_id', input.workflowRunId)
      .in('stage', ['serper_search', 'extraction', 'dedupe']);

    const leadsFound = leads?.length || 0;
    const qualifiedLeads = leads?.filter(l => l.qualification_status === 'qualified').length || 0;
    const leadsInReview = leads?.filter(l => l.qualification_status === 'pending_review').length || 0;
    const leadsWithEmail = leads?.filter(l => !!l.email).length || 0;
    const avgScore = leads?.length ? leads.reduce((acc, l) => acc + (l.score || 0), 0) / leads.length : 0;

    const { count: draftsGenerated } = await supabase
      .from('outreach_drafts')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', input.campaignId);

    // 3. Advanced Metric Calculations
    const emailCoverage = leadsFound > 0 ? (leadsWithEmail / leadsFound) * 100 : 0;
    const qualificationRate = leadsFound > 0 ? (qualifiedLeads / leadsFound) * 100 : 0;
    const reviewRate = leadsFound > 0 ? (leadsInReview / leadsFound) * 100 : 0;
    
    // Research Performance
    const extractionTask = tasks?.find(t => t.stage === 'extraction');
    const extractionRate = extractionTask?.output_json?.meta?.extractionRate || 0;
    const searchTask = tasks?.find(t => t.stage === 'serper_search');
    const searchSuccess = searchTask?.output_json?.resultsCount > 0 ? 100 : 0;

    // 4. Generate Strategic Insights via AI
    const userPrompt = `
      PERFORMANCE METRICS:
      - Total Prospects Discovered (Serper): ${leadsFound}
      - Source Provider: ${leads?.[0]?.source || 'Mixed'}
      - Extraction Success Rate (Data Density): ${extractionRate.toFixed(1)}%
      - Email Coverage (% with direct contact): ${emailCoverage.toFixed(1)}%
      - ICP Qualification Rate (Strict Qualified): ${qualificationRate.toFixed(1)}%
      - High-Potential Review Rate (Uncertain): ${reviewRate.toFixed(1)}%
      - Average Prospect Quality Score: ${avgScore.toFixed(1)}/100
      - Campaign Outreach Ready (Drafts): ${draftsGenerated}
      
      ANALYTICS GOAL:
      Provide a strategic report. 
      Identify if the niche was too broad, if the search queries worked, 
      and how to increase the qualification rate.`;

    const result = await openAIService.generateStructuredOutput<z.infer<typeof ReportSummarySchema>>({
      systemPrompt: 'You are a Senior Strategic Growth Analyst at a Top-tier VC firm. Provide a critical, data-driven report based on these campaign metrics.',
      userPrompt,
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string", description: "Strategic overview of campaign health." },
          bottlenecks: { type: "array", items: { type: "string" }, description: "Current constraints in the pipeline." },
          recommendations: { type: "array", items: { type: "string" }, description: "Specific steps to optimize the next run." }
        },
        required: ["title", "summary", "bottlenecks", "recommendations"]
      },
    });

    // 5. Build and Persist the Final Report
    const { data: report, error } = await supabase.from('reports').insert({
      campaign_id: input.campaignId,
      workspace_id: input.workspaceId,
      title: result.title,
      summary: result.summary,
      leads_found: leadsFound,
      qualified_leads: qualifiedLeads, // Count 'qualified' only for primary stat
      drafts_generated: draftsGenerated || 0,
      bottlenecks: result.bottlenecks,
      recommendations: result.recommendations,
      created_at: new Date().toISOString()
    }).select().single();

    if (error) {
      console.error('[ReportingAgent] Persistence Error:', error.message);
    }

    return {
      reportId: report?.id,
      metrics: {
        leadsFound,
        emailCoverage: `${emailCoverage.toFixed(1)}%`,
        qualificationRate: `${qualificationRate.toFixed(1)}%`,
        extractionRate: `${extractionRate.toFixed(1)}%`,
        avgScore: avgScore.toFixed(1)
      }
    };
  }
}

