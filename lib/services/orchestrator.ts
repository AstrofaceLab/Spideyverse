import { createAdminClient } from '../supabase/admin';
import { ResearchAgent } from './agents/research';
import { QualificationAgent } from './agents/qualification';
import { OutreachAgent } from './agents/outreach';
import { ReportingAgent } from './agents/reporting';

export class WorkflowOrchestrator {
  private supabase = createAdminClient();
  private researchAgent = new ResearchAgent();
  private qualificationAgent = new QualificationAgent();
  private outreachAgent = new OutreachAgent();
  private reportingAgent = new ReportingAgent();

  async startWorkflow(campaignId: string, workspaceId: string) {
    console.log(`[Orchestrator] Starting production pipeline for campaign ${campaignId}`);
    
    // 0. Initialize Workflow Run
    const { data: run, error: runError } = await this.supabase
      .from('workflow_runs')
      .insert({
        campaign_id: campaignId,
        workspace_id: workspaceId,
        status: 'running',
        current_stage: 'initialization'
      })
      .select()
      .single();

    if (runError) {
      console.error('[Orchestrator] Failed to initialize workflow run:', runError);
      throw runError;
    }
    
    console.log(`[Orchestrator] Run initialized: ${run.id}. Launching agents...`);
    await this.logActivity(workspaceId, campaignId, run.id, 'manager', 'Workflow initialized. Launching Spideyverse Engine...');

    try {
      const { data: campaign } = await this.supabase.from('campaigns').select('*').eq('id', campaignId).single();
      if (!campaign) throw new Error('Campaign context not found.');

      // --- STEP 1: QUERY GENERATION (AI) ---
      await this.updateTask(run.id, campaignId, workspaceId, 'Query Generator', 'query_gen', 'running');
      await this.logActivity(workspaceId, campaignId, run.id, 'research', 'AI is engineering search strings based on ICP...');
      
      const queries = await this.researchAgent.generateQueries({
        campaignId, workspaceId,
        niche: campaign.niche,
        businessType: campaign.business_type,
        targetRegion: campaign.target_region,
        idealLeadProfile: campaign.ideal_lead_profile,
        offerContext: campaign.offer_context
      });

      await this.updateTask(run.id, campaignId, workspaceId, 'Query Generator', 'query_gen', 'completed', { queries });
      await this.logActivity(workspaceId, campaignId, run.id, 'research', `Engineered ${queries.length} high-intent search queries.`);

      // --- STEP 2: SEARCH & DISCOVERY ---
      await this.updateRunStage(run.id, 'searching');

      // 🚀 Stage 2a: Apollo Deep Intelligence
      await this.updateTask(run.id, campaignId, workspaceId, 'Data Intelligence', 'apollo_search', 'running');
      await this.logActivity(workspaceId, campaignId, run.id, 'research', 'Sourcing verified decision makers via Apollo B2B Graph...');
      
      const apolloLeads = await this.researchAgent.discoverViaApollo({
        campaignId, workspaceId,
        niche: campaign.niche,
        businessType: campaign.business_type,
        targetRegion: campaign.target_region,
        idealLeadProfile: campaign.ideal_lead_profile
      });

      await this.updateTask(run.id, campaignId, workspaceId, 'Data Intelligence', 'apollo_search', 'completed', { resultsCount: apolloLeads.length });
      await this.logActivity(workspaceId, campaignId, run.id, 'research', `Apollo found ${apolloLeads.length} high-intent prospects.`);

      // Step 2b: Serper Search
      await this.updateTask(run.id, campaignId, workspaceId, 'Search Agent', 'serper_search', 'running');
      await this.logActivity(workspaceId, campaignId, run.id, 'research', 'Executing web-scale discovery via Serper API...');
      
      const searchResults = await this.researchAgent.executeSearch(queries);

      await this.updateTask(run.id, campaignId, workspaceId, 'Search Agent', 'serper_search', 'completed', { resultsCount: searchResults.length });
      await this.logActivity(workspaceId, campaignId, run.id, 'research', `Discovery complete. Found ${searchResults.length} potential company links.`);

      // --- STEP 3: SCRAPING + EXTRACTION ---
      await this.updateRunStage(run.id, 'extraction');
      await this.updateTask(run.id, campaignId, workspaceId, 'Extraction Agent', 'extraction', 'running');
      await this.logActivity(workspaceId, campaignId, run.id, 'research', 'Deep-scanning company websites... (Stage: OSINT Discovery)');
      
      const extractionResult = await this.researchAgent.extractLeads(searchResults, campaignId, workspaceId);
      const { leads: rawLeads, scannedCount } = extractionResult;
      const extractionRate = scannedCount > 0 ? (rawLeads.length / scannedCount) * 100 : 0;

      await this.updateTask(run.id, campaignId, workspaceId, 'Extraction Agent', 'extraction', 'completed', { 
        rawLeadsCount: rawLeads.length,
        meta: { extractionRate, scannedCount } 
      });
      await this.logActivity(workspaceId, campaignId, run.id, 'research', `Extracted data for ${rawLeads.length} prospects. Quality Match: ${extractionRate.toFixed(1)}%.`);


      // --- STEP 4: NORMALIZATION + DEDUPE ---
      await this.updateRunStage(run.id, 'normalization');
      await this.updateTask(run.id, campaignId, workspaceId, 'Data Architect', 'dedupe', 'running');
      await this.logActivity(workspaceId, campaignId, run.id, 'research', 'Normalizing data and applying global deduplication checks...');
      
      // Combine Apollo leads with Scraped leads
      const combinedLeads = [...apolloLeads, ...rawLeads];
      const persistenceResult = await this.researchAgent.normalizeAndPersist(combinedLeads);

      await this.updateTask(run.id, campaignId, workspaceId, 'Data Architect', 'dedupe', 'completed', persistenceResult);
      await this.logActivity(workspaceId, campaignId, run.id, 'research', `Cleanup complete. Added ${persistenceResult.leadsFound} new unique leads to database.`);

      // --- STEP 5: QUALIFICATION ---
      await this.updateRunStage(run.id, 'qualification');
      await this.updateTask(run.id, campaignId, workspaceId, 'Qualification Agent', 'qualification', 'running');
      await this.logActivity(workspaceId, campaignId, run.id, 'qualification', 'Evaluating ICP fit and scoring prospect quality...');
      
      const qualResult = await this.qualificationAgent.run({ campaignId, workspaceId, campaignContext: campaign });

      await this.updateTask(run.id, campaignId, workspaceId, 'Qualification Agent', 'qualification', 'completed', qualResult);
      await this.logActivity(workspaceId, campaignId, run.id, 'qualification', `Qualified ${qualResult.qualified} leads. Rejected ${qualResult.disqualified} low-fit prospects.`);

      // --- STEP 6: OUTREACH DRAFTS ---
      await this.updateRunStage(run.id, 'outreach');
      await this.updateTask(run.id, campaignId, workspaceId, 'Outreach Agent', 'outreach', 'running');
      await this.logActivity(workspaceId, campaignId, run.id, 'outreach', 'Crafting personalized, 1-on-1 outreach messages...');
      
      const outreachResult = await this.outreachAgent.run({ campaignId, workspaceId, campaignContext: campaign });

      await this.updateTask(run.id, campaignId, workspaceId, 'Outreach Agent', 'outreach', 'completed', outreachResult);
      await this.logActivity(workspaceId, campaignId, run.id, 'outreach', `Drafted ${outreachResult.draftsCreated} messages for review.`);

      // --- STEP 7: REPORTING ---
      await this.updateRunStage(run.id, 'reporting');
      await this.updateTask(run.id, campaignId, workspaceId, 'Reporting Agent', 'reporting', 'running');
      await this.logActivity(workspaceId, campaignId, run.id, 'reporting', 'Generating final campaign insights and performance report...');
      
      const reportResult = await this.reportingAgent.run({ workflowRunId: run.id, campaignId, workspaceId });

      await this.updateTask(run.id, campaignId, workspaceId, 'Reporting Agent', 'reporting', 'completed', reportResult);
      await this.logActivity(workspaceId, campaignId, run.id, 'reporting', `Report generated. Qualification Rate: ${reportResult.metrics.qualificationRate}.`);

      // FINALIZE
      await this.supabase.from('workflow_runs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', run.id);
      await this.supabase.from('campaigns').update({ status: 'needs_review', current_stage: 'outreach' }).eq('id', campaignId);
      await this.logActivity(workspaceId, campaignId, run.id, 'manager', 'Workflow execution successful.', 'success');

    } catch (error: any) {
      console.error('[Orchestrator] Critical Failure:', error);
      try {
        const runId = run?.id;
        if (runId) {
          await this.supabase.from('workflow_runs').update({ 
            status: 'failed', 
            error_message: error.message || 'Unknown orchestrator error',
            failed_at: new Date().toISOString() 
          }).eq('id', runId);
          await this.logActivity(workspaceId, campaignId, runId, 'manager', `Workflow failed: ${error.message}`, 'error');
        }
      } catch (innerError) {
        console.error('[Orchestrator] Secondary failure in error handler:', innerError);
      }
    }
  }

  private async updateRunStage(runId: string, stage: string) {
    await this.supabase.from('workflow_runs').update({ current_stage: stage, updated_at: new Date().toISOString() }).eq('id', runId);
  }

  private async updateTask(runId: string, campaignId: string, workspaceId: string, agent: string, stage: string, status: string, output?: any) {
    const { data: existing } = await this.supabase
      .from('agent_tasks')
      .select('id')
      .eq('workflow_run_id', runId)
      .eq('stage', stage)
      .maybeSingle();

    if (existing) {
      await this.supabase.from('agent_tasks').update({ 
        status, 
        output_json: output, 
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString() 
      }).eq('id', existing.id);
    } else {
      await this.supabase.from('agent_tasks').insert({
        workflow_run_id: runId,
        campaign_id: campaignId,
        workspace_id: workspaceId,
        agent_name: agent,
        task_type: agent,
        stage,
        status,
        started_at: new Date().toISOString(),
        output_json: output,
      });
    }
  }

  private async logActivity(workspaceId: string, campaignId: string, runId: string, type: string, message: string, eventType: string = 'info') {
    try {
      await this.supabase.from('activity_logs').insert({
        workspace_id: workspaceId,
        campaign_id: campaignId,
        workflow_run_id: runId,
        event_type: eventType,
        message,
        metadata_json: { agent_name: type || 'manager' }
      });
    } catch (err) {
      console.error('[Orchestrator] Failed to log activity:', err);
    }
  }
}

export const workflowOrchestrator = new WorkflowOrchestrator();
