import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaign');
  const status = searchParams.get('status');

  const supabase = createClient();
  let query = supabase
    .from('outreach_drafts')
    .select(`
      *,
      leads (
        contact_name,
        company_name
      ),
      campaigns (
        campaign_name
      )
    `)
    .order('created_at', { ascending: false });

  if (campaignId && campaignId !== 'all') {
    query = query.eq('campaign_id', campaignId);
  }

  if (status && status !== 'all') {
    query = query.eq('draft_status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Normalize to Frontend type
  const normalized = data.map((d: any) => ({
    id: d.id,
    leadId: d.lead_id,
    leadName: d.leads?.contact_name || 'Prospect',
    companyName: d.leads?.company_name || 'Unknown',
    campaignId: d.campaign_id,
    campaignName: d.campaigns?.campaign_name || 'Campaign',
    subject: d.subject_line,
    openingLine: d.opening_line,
    body: d.message_body,
    cta: d.cta,
    followUp: d.follow_up,
    tone: d.tone_label,
    status: d.draft_status,
    generatedAt: d.created_at,
    generatedBy: d.generated_by,
  }));

  return NextResponse.json(normalized);
}
