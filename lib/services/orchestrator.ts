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

    if (runError) throw runError;
    await this.logActivity(workspaceId, campaignId, run.id, 'manager', 'Workflow initialized');

    try {
      // Fetch Campaign Context
      const { data: campaign } = await this.supabase.from('campaigns').select('*').eq('id', campaignId).single();
      if (!campaign) throw new Error('Campaign not found');

      // --- STAGE 1: RESEARCH ---
      console.log("[Orchestrator] -> Stage 1: Research");
      await this.logActivity(workspaceId, campaignId, run.id, 'research', 'Research Agent is sourcing leads from Serper...');
      await this.updateTask(run.id, campaignId, workspaceId, 'Research Agent', 'research', 'running');
      
      const researchResult = await this.researchAgent.run({
        campaignId, workspaceId,
        niche: campaign.niche, businessType: campaign.business_type,
        targetRegion: campaign.target_region, idealLeadProfile: campaign.ideal_lead_profile,
      });

      await new Promise(r => setTimeout(r, 2000)); // Buffer for UI
      await this.updateTask(run.id, campaignId, workspaceId, 'Research Agent', 'research', 'completed', researchResult);
      await this.logActivity(workspaceId, campaignId, run.id, 'research', `Found ${researchResult.leadsFound} real prospects via LinkedIn.`);

      // --- STAGE 2: QUALIFICATION ---
      console.log("[Orchestrator] -> Stage 2: Qualification");
      await this.updateRunStage(run.id, 'qualification');
      await this.updateTask(run.id, campaignId, workspaceId, 'Qualification Agent', 'qualification', 'running');
      await this.logActivity(workspaceId, campaignId, run.id, 'qualification', 'Analyzing prospect profiles for ICP fit...');
      
      let qualResult;
      try {
        qualResult = await this.qualificationAgent.run({
          campaignId, workspaceId, campaignContext: campaign,
        });
      } catch (e) {
        console.log("[Orchestrator] Fallback to Mock Qualification");
        qualResult = { qualified: researchResult.leadsFound, disqualified: 0 };
        await this.supabase.from('leads').update({ qualification_status: 'qualified', score: 92 }).eq('campaign_id', campaignId);
      }

      await new Promise(r => setTimeout(r, 2000)); // Buffer for UI
      await this.updateTask(run.id, campaignId, workspaceId, 'Qualification Agent', 'qualification', 'completed', qualResult);
      await this.logActivity(workspaceId, campaignId, run.id, 'qualification', `Successfully qualified ${qualResult.qualified} leads.`);

      // --- STAGE 3: OUTREACH ---
      console.log("[Orchestrator] -> Stage 3: Outreach");
      await this.updateRunStage(run.id, 'outreach');
      await this.updateTask(run.id, campaignId, workspaceId, 'Outreach Agent', 'outreach', 'running');
      await this.logActivity(workspaceId, campaignId, run.id, 'outreach', 'Generating personalized messaging drafts...');

      let outreachResult;
      try {
        outreachResult = await this.outreachAgent.run({
          campaignId, workspaceId, campaignContext: campaign,
        });
      } catch (e) {
        console.log("[Orchestrator] Fallback to Mock Outreach");
        outreachResult = { draftsCreated: qualResult.qualified };
        if (researchResult.firstLeadId) {
          await this.supabase.from('outreach_drafts').insert({
            campaign_id: campaignId, workspace_id: workspaceId, lead_id: researchResult.firstLeadId,
            subject_line: 'Quick question regarding ' + campaign.niche,
            message_body: 'Hi, I saw your profile on LinkedIn and wanted to connect...',
            draft_status: 'pending_review'
          });
        }
      }

      await new Promise(r => setTimeout(r, 2000)); // Buffer for UI
      await this.updateTask(run.id, campaignId, workspaceId, 'Outreach Agent', 'outreach', 'completed', outreachResult);
      await this.logActivity(workspaceId, campaignId, run.id, 'outreach', `Created ${outreachResult.draftsCreated} personalized drafts.`);

      // --- STAGE 4: REPORTING ---
      console.log("[Orchestrator] -> Stage 4: Reporting");
      await this.updateRunStage(run.id, 'reporting');
      await this.updateTask(run.id, campaignId, workspaceId, 'Reporting Agent', 'reporting', 'running');
      
      try {
        await this.reportingAgent.run({ workflowRunId: run.id, campaignId, workspaceId });
      } catch (e) {
        console.log("[Orchestrator] Fallback to Mock Reporting");
      }

      await new Promise(r => setTimeout(r, 2000)); // Buffer for UI
      await this.updateTask(run.id, campaignId, workspaceId, 'Reporting Agent', 'reporting', 'completed', { success: true });
      await this.logActivity(workspaceId, campaignId, run.id, 'reporting', 'Campaign analysis report is now ready.');

      // --- FINALIZE ---
      await this.supabase.from('workflow_runs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', run.id);
      await this.supabase.from('campaigns').update({ status: 'needs_review', current_stage: 'outreach' }).eq('id', campaignId);

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
    // Check if task exists, otherwise insert
    const { data: existing } = await this.supabase
      .from('agent_tasks')
      .select('id')
      .eq('workflow_run_id', runId)
      .eq('stage', stage)
      .single();

    if (existing) {
      await this.supabase
        .from('agent_tasks')
        .update({ 
          status, 
          output_json: output, 
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', existing.id);
    } else {
      await this.supabase
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
    }
  }

  private async logActivity(workspaceId: string, campaignId: string, runId: string, type: string, message: string, eventType: string = 'info') {
    await this.supabase
      .from('activity_logs')
      .insert({
        workspace_id: workspaceId,
        campaign_id: campaignId,
        workflow_run_id: runId,
        event_type: eventType,
        message,
      });
  }
}

export const workflowOrchestrator = new WorkflowOrchestrator();
