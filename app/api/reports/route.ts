import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaign');

  const supabase = createClient();
  
  // Get the user session to filter by workspace (security)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // First, get the workspace for the user
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('id')
    .single(); // Assuming one workspace per user for now, or use a better filter

  if (wsError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  let query = supabase
    .from('reports')
    .select(`
      *,
      campaigns (
        campaign_name
      )
    `)
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false });

  if (campaignId && campaignId !== 'all') {
    query = query.eq('campaign_id', campaignId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Normalize to Frontend type
  const normalized = data.map((r: any) => ({
    id: r.id,
    campaignId: r.campaign_id,
    campaignName: r.campaigns?.campaign_name || 'Campaign',
    generatedAt: r.created_at,
    leadsFound: r.leads_found,
    qualifiedLeads: r.qualified_leads,
    qualificationRate: r.leads_found > 0 ? (r.qualified_leads / r.leads_found) * 100 : 0,
    draftsGenerated: r.drafts_generated,
    pendingApprovals: 0, // This would need another query or field
    workflowTime: '2m 15s', // Placeholder or calculate from agent_tasks
    bottlenecks: r.bottlenecks || [],
    recommendations: r.recommendations || [],
    summary: r.summary,
  }));

  return NextResponse.json(normalized);
}
