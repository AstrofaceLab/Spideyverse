'use server';

import { workflowOrchestrator } from '@/lib/services/orchestrator';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function launchCampaignWorkflow(campaignId: string, workspaceId: string) {
  try {
    // 1. Mark campaign as running in DB immediately
    const supabase = createClient();
    await supabase
      .from('campaigns')
      .update({ status: 'running', updated_at: new Date().toISOString() })
      .eq('id', campaignId);

    console.log(`[Action] Launching workflow for campaign: ${campaignId}`);
    
    // 2. Start the orchestrator 
    // We await the FIRST step (Research) to ensure the execution pipe is established
    await workflowOrchestrator.startWorkflow(campaignId, workspaceId);

    revalidatePath(`/app/campaigns/${campaignId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Launch Error:', error);
    return { success: false, error: error.message };
  }
}

export async function approveDraft(draftId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('outreach_drafts')
    .update({ draft_status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', draftId);
  
  if (error) throw error;
  revalidatePath('/app/outreach');
  return { success: true };
}

export async function rejectDraft(draftId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('outreach_drafts')
    .update({ draft_status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', draftId);
  
  if (error) throw error;
  revalidatePath('/app/outreach');
  return { success: true };
}
