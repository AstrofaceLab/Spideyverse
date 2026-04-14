import { createAdminClient } from '../supabase/admin';
import { Campaign, WorkflowStage, Agent, ActivityEvent } from '../types';

/**
 * Fetches real orchestration state for a campaign from the database.
 */
export async function getRealCampaignOrchestration(campaignId: string) {
  const supabase = createAdminClient();

  // 1. Fetch Workflow Run
  const { data: run } = await supabase
    .from('workflow_runs')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // 2. Fetch Tasks
  const { data: tasks } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('campaign_id', campaignId);

  // 3. Fetch Activity Logs
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });

  // 4. Fetch Metrics
  const { count: leadsFound } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);

  const { count: qualifiedLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('qualification_status', 'qualified');

  const { count: draftsCreated } = await supabase
    .from('outreach_drafts')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);

  const { count: approvalsCount } = await supabase
    .from('outreach_drafts')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('draft_status', 'approved');

  // Map stage statuses
  const stageStatuses: Record<string, string> = {
    research: 'idle',
    qualification: 'idle',
    outreach: 'idle',
    reporting: 'idle',
  };

  if (tasks) {
    tasks.forEach(t => {
      stageStatuses[t.stage] = t.status;
    });
  }

  // Map agents
  const agents: Agent[] = [
    { id: '1', type: 'research', name: 'Research Agent', role: 'Data Sourcing', status: (stageStatuses.research as any) || 'idle', tasksCompleted: leadsFound || 0, lastActive: new Date().toISOString(), metrics: [] },
    { id: '2', type: 'qualification', name: 'Qualification Agent', role: 'ICP Matching', status: (stageStatuses.qualification as any) || 'idle', tasksCompleted: qualifiedLeads || 0, lastActive: new Date().toISOString(), metrics: [] },
    { id: '3', type: 'outreach', name: 'Outreach Agent', role: 'Draft Generation', status: (stageStatuses.outreach as any) || 'idle', tasksCompleted: draftsCreated || 0, lastActive: new Date().toISOString(), metrics: [] },
    { id: '4', type: 'reporting', name: 'Reporting Agent', role: 'Insights', status: (stageStatuses.reporting as any) || 'idle', tasksCompleted: 0, lastActive: new Date().toISOString(), metrics: [] },
  ];

  // Map activity
  const activity: ActivityEvent[] = (logs || []).map(l => ({
    id: l.id,
    agentType: (l.metadata_json?.agent_type as any) || 'manager',
    agentName: l.metadata_json?.agent_name || 'System',
    event: l.event_type,
    detail: l.message,
    timestamp: l.created_at,
    type: l.event_type === 'error' ? 'error' : l.event_type === 'success' ? 'success' : 'info'
  }));

  return {
    stageStatuses,
    leadsFound: leadsFound || 0,
    qualifiedLeads: qualifiedLeads || 0,
    draftsCreated: draftsCreated || 0,
    approvalsCount: approvalsCount || 0,
    agents,
    activity
  };
}
