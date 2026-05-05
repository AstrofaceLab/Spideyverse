'use server';

import { workflowOrchestrator } from '@/lib/services/orchestrator';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { resendService } from '@/lib/services/resend';
import { OutreachAgent } from '@/lib/services/agents/outreach';

export async function regenerateDraft(draftId: string) {
  const supabase = createClient();
  
  // 1. Fetch the draft to get lead_id and campaign_id
  const { data: draft, error: draftError } = await supabase
    .from('outreach_drafts')
    .select('lead_id, campaign_id, workspace_id')
    .eq('id', draftId)
    .single();

  if (draftError || !draft) throw new Error("Draft not found");

  // 2. Fetch the campaign context
  const { data: campaign, error: campError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', draft.campaign_id)
    .single();

  if (campError || !campaign) throw new Error("Campaign not found");

  // 3. Fetch the lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', draft.lead_id)
    .single();

  if (leadError || !lead) throw new Error("Lead not found");

  // 4. Run the OutreachAgent for this single lead
  const agent = new OutreachAgent();
  await agent.generateDraftForLead(lead, campaign, draft.workspace_id);

  revalidatePath('/app/outreach');
  return { success: true };
}

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
    // Note: We don't await the full result, but we do trigger the async process.
    // In a serverless env like Vercel, it's safer to await the trigger if it returns a promise.
    void workflowOrchestrator.startWorkflow(campaignId, workspaceId);

    revalidatePath(`/app/campaigns/${campaignId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Launch Error:', error);
    return { success: false, error: error.message };
  }
}

export async function approveDraft(draftId: string) {
  const supabase = createClient();
  
  // 1. Fetch the draft to get lead_id
  const { data: draft } = await supabase
    .from('outreach_drafts')
    .select('lead_id')
    .eq('id', draftId)
    .single();

  if (draft) {
    // 2. Update Draft Status
    await supabase
      .from('outreach_drafts')
      .update({ draft_status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', draftId);

    // 3. Update Lead Status to 'ready_for_outreach'
    await supabase
      .from('leads')
      .update({ qualification_status: 'ready_for_outreach', updated_at: new Date().toISOString() })
      .eq('id', draft.lead_id);
  }
  
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

export async function batchApproveDrafts(campaignId: string) {
  if (!campaignId || campaignId === 'all') throw new Error("Please select a specific campaign.");
  const supabase = createClient();
  
  // 1. Get all pending drafts for this campaign
  const { data: drafts } = await supabase
    .from('outreach_drafts')
    .select('id, lead_id')
    .eq('campaign_id', campaignId)
    .eq('draft_status', 'pending_review');

  if (!drafts || drafts.length === 0) return { success: true, count: 0 };

  const draftIds = drafts.map((d: any) => d.id);
  const leadIds = drafts.map((d: any) => d.lead_id);

  // 2. Batch update drafts
  await supabase
    .from('outreach_drafts')
    .update({ draft_status: 'approved', updated_at: new Date().toISOString() })
    .in('id', draftIds);

  // 3. Batch update leads
  await supabase
    .from('leads')
    .update({ qualification_status: 'ready_for_outreach', updated_at: new Date().toISOString() })
    .in('id', leadIds);

  revalidatePath('/app/outreach');
  return { success: true, count: drafts.length };
}

export async function sendApprovedOutreach(campaignId: string) {
  if (!campaignId || campaignId === 'all') throw new Error("Please select a specific campaign.");
  const supabase = createClient();

  // 1. Fetch all approved but not yet sent drafts
  const { data: drafts } = await supabase
    .from('outreach_drafts')
    .select(`
      *,
      leads (
        email,
        contact_name
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('draft_status', 'approved');

  if (!drafts || drafts.length === 0) return { success: true, sentCount: 0, failedCount: 0 };

  let sentCount = 0;
  let failedCount = 0;

  // 🚀 Step 10: Process in batches to avoid timeouts and improve speed
  const CHUNK_SIZE = 5;
  for (let i = 0; i < drafts.length; i += CHUNK_SIZE) {
    const chunk = drafts.slice(i, i + CHUNK_SIZE);
    
    await Promise.allSettled(chunk.map(async (draft: any) => {
      const email = draft.leads?.email;
      if (!email) {
        console.warn(`[Action] Skipping draft ${draft.id} - No email found for lead.`);
        failedCount++;
        return;
      }

      try {
        // 2. Execute Sending
        await resendService.sendEmail({
          to: email,
          subject: draft.subject_line,
          text: `${draft.opening_line}\n\n${draft.message_body}\n\n${draft.cta}`,
        });

        // 3. Update Draft Status
        await supabase
          .from('outreach_drafts')
          .update({ draft_status: 'sent', updated_at: new Date().toISOString() })
          .eq('id', draft.id);

        // 4. Update Lead Status
        await supabase
          .from('leads')
          .update({ qualification_status: 'outreach_sent', updated_at: new Date().toISOString() })
          .eq('id', draft.lead_id);

        sentCount++;
      } catch (err) {
        console.error(`[Action] Failed to send to ${email}:`, err);
        failedCount++;
      }
    }));
  }

  revalidatePath('/app/outreach');
  revalidatePath(`/app/campaigns/${campaignId}`);
  
  return { 
    success: true, 
    sentCount, 
    failedCount 
  };
}

export async function updateOutreachDraft(draftId: string, updates: { subject_line: string; message_body: string }) {
  const supabase = createClient();
  const { error } = await supabase
    .from('outreach_drafts')
    .update({
      subject_line: updates.subject_line,
      message_body: updates.message_body,
      updated_at: new Date().toISOString()
    })
    .eq('id', draftId);

  if (error) throw error;
  
  revalidatePath('/app/outreach');
  return { success: true };
}

export async function approveLead(leadId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('leads')
    .update({ qualification_status: 'qualified', updated_at: new Date().toISOString() })
    .eq('id', leadId);
  
  if (error) throw error;
  revalidatePath('/app/leads');
  return { success: true };
}

export async function ignoreLead(leadId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('leads')
    .update({ qualification_status: 'disqualified', updated_at: new Date().toISOString() })
    .eq('id', leadId);
  
  if (error) throw error;
  revalidatePath('/app/leads');
  return { success: true };
}
