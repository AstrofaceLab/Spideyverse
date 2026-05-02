import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Normalize to Frontend type
  const normalized = {
    id: workspace.id,
    name: workspace.workspace_name,
    businessDescription: workspace.ideal_customer_profile,
    businessType: workspace.business_type,
    defaultOffer: workspace.offer,
    defaultRegion: workspace.target_region,
    outreachTone: workspace.outreach_tone,
    plan: workspace.plan,
  };

  return NextResponse.json(normalized);
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const updates = await request.json();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: workspace, error: wsFetchError } = await supabase
    .from('workspaces')
    .select('id')
    .single();

  if (wsFetchError) return NextResponse.json({ error: wsFetchError.message }, { status: 404 });

  const { error } = await supabase
    .from('workspaces')
    .update({
      workspace_name: updates.workspaceName,
      ideal_customer_profile: updates.businessDescription,
      business_type: updates.businessType,
      offer: updates.defaultOffer,
      target_region: updates.defaultRegion,
      outreach_tone: updates.outreachTone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workspace.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
