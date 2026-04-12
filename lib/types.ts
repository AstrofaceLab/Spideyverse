// ─── Core Status Types ─────────────────────────────────────────────────────
export type CampaignStatus = "draft" | "running" | "needs_review" | "completed" | "failed";
export type AgentStatus = "idle" | "running" | "completed" | "failed" | "waiting";
export type LeadStatus = "new" | "qualified" | "disqualified" | "pending_review" | "contacted" | "converted";
export type DraftStatus = "pending_review" | "approved" | "rejected" | "edited" | "regenerating";
export type WorkflowStage = "research" | "qualification" | "outreach" | "reporting";

// ─── Campaign ──────────────────────────────────────────────────────────────
export interface Campaign {
  id: string;
  workspace_id: string;
  campaign_name: string;
  objective: string;
  niche: string;
  business_type: string;
  target_region: string;
  ideal_lead_profile: string;
  offer_context: string;
  value_proposition: string;
  outreach_tone: string;
  outreach_channel: string;
  target_lead_count: number;
  status: CampaignStatus;
  current_stage: WorkflowStage;
  created_at: string;
  updated_at: string;
  
  // Computed or joined fields for UI
  leads_found?: number;
  qualified_leads?: number;
  drafts_created?: number;
  approvals_count?: number;
}

// ─── Lead ──────────────────────────────────────────────────────────────────
export interface Lead {
  id: string;
  companyName: string;
  website: string;
  email: string;
  contactName?: string;
  contactTitle?: string;
  phone?: string;
  linkedIn?: string;
  score: number;
  status: LeadStatus;
  qualificationReasoning: string;
  tags: string[];
  campaignId: string;
  campaignName: string;
  draftStatus: DraftStatus;
  region: string;
  niche: string;
  summary: string;
  source: string;
  createdAt: string;
}

// ─── Agent ─────────────────────────────────────────────────────────────────
export type AgentType = "research" | "qualification" | "outreach" | "reporting" | "manager";

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  role: string;
  status: AgentStatus;
  tasksCompleted: number;
  lastActive: string;
  currentTask?: string;
  metrics: {
    label: string;
    value: string | number;
  }[];
}

// ─── Outreach Draft ────────────────────────────────────────────────────────
export interface OutreachDraft {
  id: string;
  leadId: string;
  leadName: string;
  companyName: string;
  campaignId: string;
  campaignName: string;
  subject: string;
  openingLine: string;
  body: string;
  cta: string;
  followUp?: string;
  tone: string;
  status: DraftStatus;
  generatedAt: string;
  generatedBy: string;
}

// ─── Activity Event ────────────────────────────────────────────────────────
export interface ActivityEvent {
  id: string;
  agentType: AgentType;
  agentName: string;
  event: string;
  detail: string;
  timestamp: string;
  campaignId?: string;
  campaignName?: string;
  type: "info" | "success" | "warning" | "error";
}

// ─── Report ────────────────────────────────────────────────────────────────
export interface Report {
  id: string;
  campaignId: string;
  campaignName: string;
  generatedAt: string;
  leadsFound: number;
  qualifiedLeads: number;
  qualificationRate: number;
  draftsGenerated: number;
  pendingApprovals: number;
  workflowTime: string;
  bottlenecks: string[];
  recommendations: string[];
  summary: string;
}

// ─── Admin ─────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  workspace: string;
  plan: string;
  status: "active" | "inactive" | "suspended";
  joinedAt: string;
  campaignCount: number;
}

export interface AdminStats {
  totalUsers: number;
  totalWorkspaces: number;
  totalCampaigns: number;
  activeRuns: number;
  failedRuns: number;
  totalDrafts: number;
}

// ─── KPI ───────────────────────────────────────────────────────────────────
export interface KPICard {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: string;
}

// ─── Workspace ─────────────────────────────────────────────────────────────
export interface Workspace {
  id: string;
  name: string;
  businessDescription: string;
  businessType: string;
  defaultOffer: string;
  defaultRegion: string;
  outreachTone: string;
  plan: string;
}
