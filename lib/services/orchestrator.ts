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
    console.log(`[Orchestrator] Starting workflow for campaign ${campaignId}`);
    
    // 1. Initialize Run
    const { data: run, error: runError } = await this.supabase
      .from('workflow_runs')
      .insert({
        campaign_id: campaignId,
        workspace_id: workspaceId,
        status: 'running',
        current_stage: 'research'
      })
      .select()
      .single();

    if (runError) {
      console.error('[Orchestrator] Failed to initialize run:', runError);
      throw runError;
    }
    await this.logActivity(workspaceId, campaignId, run.id, 'manager', 'Workflow initialized. Starting AI-powered lead discovery...');

    try {
      // Fetch Campaign Context
      const { data: campaign } = await this.supabase.from('campaigns').select('*').eq('id', campaignId).single();
      if (!campaign) throw new Error('Campaign not found');

      // --- STAGE 1: RESEARCH ---
      console.log("[Orchestrator] -> Stage 1: Research (Serper + AI Extraction)");
      await this.logActivity(workspaceId, campaignId, run.id, 'research', 'Generating search queries and scanning the web for prospects...');
      await this.updateTask(run.id, campaignId, workspaceId, 'Research Agent', 'research', 'running');
      
      const researchResult = await this.researchAgent.run({
        campaignId, 
        workspaceId,
        niche: campaign.niche, 
        businessType: campaign.business_type,
        targetRegion: campaign.target_region, 
        idealLeadProfile: campaign.ideal_lead_profile,
        offerContext: campaign.offer_context
      });

      await this.updateTask(run.id, campaignId, workspaceId, 'Research Agent', 'research', 'completed', researchResult);
      await this.logActivity(workspaceId, campaignId, run.id, 'research', `Discovery complete. Found ${researchResult.leadsFound} leads. Extraction rate: ${researchResult.extractionSuccessRate.toFixed(1)}%.`);

      // --- STAGE 2: QUALIFICATION ---
      console.log("[Orchestrator] -> Stage 2: Qualification");
      await this.updateRunStage(run.id, 'qualification');
      await this.updateTask(run.id, campaignId, workspaceId, 'Qualification Agent', 'qualification', 'running');
      await this.logActivity(workspaceId, campaignId, run.id, 'qualification', 'Applying strict ICP scoring rubrics to filtered leads...');
      
      const qualResult = await this.qualificationAgent.run({
        campaignId, workspaceId, campaignContext: campaign,
      });

      await this.updateTask(run.id, campaignId, workspaceId, 'Qualification Agent', 'qualification', 'completed', qualResult);
      await this.logActivity(workspaceId, campaignId, run.id, 'qualification', `Qualified ${qualResult.qualified} leads. ${qualResult.disqualified} filtered out.`);

      // --- STAGE 3: OUTREACH ---
      console.log("[Orchestrator] -> Stage 3: Outreach");
      await this.updateRunStage(run.id, 'outreach');
      await this.updateTask(run.id, campaignId, workspaceId, 'Outreach Agent', 'outreach', 'running');
      await this.logActivity(workspaceId, campaignId, run.id, 'outreach', 'Writing personalized, high-intent messages for qualified leads...');

      const outreachResult = await this.outreachAgent.run({
        campaignId, workspaceId, campaignContext: campaign,
      });

      await this.updateTask(run.id, campaignId, workspaceId, 'Outreach Agent', 'outreach', 'completed', outreachResult);
      await this.logActivity(workspaceId, campaignId, run.id, 'outreach', `Generated ${outreachResult.draftsCreated} personalized drafts ready for review.`);

      // --- STAGE 4: REPORTING ---
      console.log("[Orchestrator] -> Stage 4: Reporting");
      await this.updateRunStage(run.id, 'reporting');
      await this.updateTask(run.id, campaignId, workspaceId, 'Reporting Agent', 'reporting', 'running');
      
      const reportResult = await this.reportingAgent.run({ workflowRunId: run.id, campaignId, workspaceId });

      await this.updateTask(run.id, campaignId, workspaceId, 'Reporting Agent', 'reporting', 'completed', reportResult);
      await this.logActivity(workspaceId, campaignId, run.id, 'reporting', `Campaign report generated. Lead Quality: ${reportResult.metrics.avgScore}/100.`);

      // --- FINALIZE ---
      await this.supabase.from('workflow_runs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', run.id);
      await this.supabase.from('campaigns').update({ status: 'needs_review', current_stage: 'outreach' }).eq('id', campaignId);
      await this.logActivity(workspaceId, campaignId, run.id, 'manager', 'Workflow completed successfully.', 'success');

    } catch (error: any) {
      console.error('Workflow Execution Error:', error);
      await this.supabase
        .from('workflow_runs')
        .update({ 
          status: 'failed', 
          error_message: error.message,
          failed_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', run.id);
      
      await this.logActivity(workspaceId, campaignId, run.id, 'manager', `Workflow failed: ${error.message}`, 'error');
    }
  }

  private async updateRunStage(runId: string, stage: string) {
    await this.supabase
      .from('workflow_runs')
      .update({ current_stage: stage, updated_at: new Date().toISOString() })
      .eq('id', runId);
  }

  private async updateTask(runId: string, campaignId: string, workspaceId: string, agent: string, stage: string, status: string, output?: any) {
    const { data: existing } = await this.supabase
      .from('agent_tasks')
      .select('id')
      .eq('workflow_run_id', runId)
      .eq('stage', stage)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await this.supabase
        .from('agent_tasks')
        .update({ 
          status, 
          output_json: output, 
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', existing.id);
        
      if (updateError) console.error(`[Orchestrator] Error updating task ${stage}:`, updateError);
    } else {
      const { error: insertError } = await this.supabase
        .from('agent_tasks')
        .insert({
          workflow_run_id: runId,
          campaign_id: campaignId,
          workspace_id: workspaceId,
          agent_name: agent,
          task_type: agent,
          stage,
          status,
          started_at: status === 'running' ? new Date().toISOString() : null,
          output_json: output,
        });

      if (insertError) console.error(`[Orchestrator] Error inserting task ${stage}:`, insertError);
    }
  }

  private async logActivity(workspaceId: string, campaignId: string, runId: string, type: string, message: string, eventType: string = 'info') {
    const { error } = await this.supabase
      .from('activity_logs')
      .insert({
        workspace_id: workspaceId,
        campaign_id: campaignId,
        workflow_run_id: runId,
        event_type: eventType,
        message,
      });
      
    if (error) console.error('[Orchestrator] Error logging activity:', error);
  }
}

export const workflowOrchestrator = new WorkflowOrchestrator();

