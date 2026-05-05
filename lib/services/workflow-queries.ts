import { createAdminClient } from '../supabase/admin';
import { Campaign, WorkflowStage, Agent, ActivityEvent, AgentType } from '../types';

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
    .in('qualification_status', ['qualified', 'pending_review']);

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

  // Sub-stage to Main-stage mapping
  const stageMap: Record<string, string> = {
    'query_gen': 'research',
    'serper_search': 'research',
    'extraction': 'research',
    'dedupe': 'research',
    'qualification': 'qualification',
    'outreach': 'outreach',
    'reporting': 'reporting'
  };

  if (tasks) {
    tasks.forEach(t => {
      const mainStage = stageMap[t.stage] || t.stage;
      
      // If any sub-task is running, the main stage is running
      // If already 'running', don't overwrite if this one is 'completed'
      if (t.status === 'running') {
        stageStatuses[mainStage] = 'running';
      } else if (t.status === 'completed' && stageStatuses[mainStage] !== 'running') {
        stageStatuses[mainStage] = 'completed';
      } else if (t.status === 'failed') {
        stageStatuses[mainStage] = 'failed';
      }
    });
  }

  // Map agents
  const agents: Agent[] = [
    { id: '1', type: 'research', name: 'Research Agent', role: 'Data Sourcing', status: (stageStatuses.research as any) || 'idle', tasksCompleted: leadsFound || 0, lastActive: new Date().toISOString(), metrics: [
      { label: 'Sourced', value: leadsFound || 0 }
    ] },
    { id: '2', type: 'qualification', name: 'Qualification Agent', role: 'ICP Matching', status: (stageStatuses.qualification as any) || 'idle', tasksCompleted: qualifiedLeads || 0, lastActive: new Date().toISOString(), metrics: [
      { label: 'Qualified', value: qualifiedLeads || 0 }
    ] },
    { id: '3', type: 'outreach', name: 'Outreach Agent', role: 'Draft Generation', status: (stageStatuses.outreach as any) || 'idle', tasksCompleted: draftsCreated || 0, lastActive: new Date().toISOString(), metrics: [
      { label: 'Drafts', value: draftsCreated || 0 }
    ] },
    { id: '4', type: 'reporting', name: 'Reporting Agent', role: 'Insights', status: (stageStatuses.reporting as any) || 'idle', tasksCompleted: (run?.status === 'completed' ? 1 : 0), lastActive: new Date().toISOString(), metrics: [
      { label: 'Reports', value: (run?.status === 'completed' ? 1 : 0) }
    ] },
  ];

  // Map activity
  const activity: ActivityEvent[] = (logs || []).map(l => {
    const meta = (l.metadata_json as any) || {};
    const agentName = meta.agent_name || 'manager';
    const msg = l.message || '';
    
    let type: AgentType = 'manager';
    if (agentName === 'research' || msg.toLowerCase().includes('research') || msg.toLowerCase().includes('search') || msg.toLowerCase().includes('lead')) type = 'research';
    if (agentName === 'qualification' || msg.toLowerCase().includes('qualif')) type = 'qualification';
    if (agentName === 'outreach' || msg.toLowerCase().includes('outreach') || msg.toLowerCase().includes('draft')) type = 'outreach';
    if (agentName === 'reporting' || msg.toLowerCase().includes('report')) type = 'reporting';

    return {
      id: l.id,
      agentType: type,
      agentName: agentName === 'manager' ? 'Orchestrator' : (agentName.charAt(0).toUpperCase() + agentName.slice(1) + ' Agent'),
      event: l.event_type || 'info',
      detail: l.message,
      timestamp: l.created_at,
      type: l.event_type === 'error' ? 'error' : l.event_type === 'success' ? 'success' : 'info'
    };
  });


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
