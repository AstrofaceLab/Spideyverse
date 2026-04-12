import { User } from "@supabase/supabase-js";

export interface Workspace {
  id: string;
  user_id: string;
  workspace_name: string;
  business_type: string;
  offer: string;
  ideal_customer_profile: string;
  target_region: string;
  outreach_tone: string;
  primary_goal: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceDisplayMeta {
  workspaceName: string;
  greeting: string;
  businessTypeLabel: string;
  primaryGoalLabel: string;
  targetRegionLabel: string;
  outreachToneLabel: string;
  offerLabel: string;
  initials: string;
  userEmail: string;
  userName: string;
}

export function getWorkspaceDisplayMeta(
  workspace: Workspace | null,
  user: User | null
): WorkspaceDisplayMeta {
  const userMetadata = user?.user_metadata || {};
  const email = user?.email || "";
  const fullName = userMetadata.full_name || "";
  const firstName = fullName ? fullName.split(" ")[0] : "";
  
  // Greeting Logic
  const greeting = firstName ? `Welcome back, ${firstName}` : "Welcome back";
  
  // Workspace Name Logic
  const workspaceName = workspace?.workspace_name || "New Workspace";
  
  // initials
  const initials = fullName 
    ? fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : email ? email.substring(0, 2).toUpperCase() : "SV";

  return {
    workspaceName,
    greeting,
    userName: fullName || email.split('@')[0] || "User",
    userEmail: email,
    initials,
    businessTypeLabel: workspace?.business_type || "Growth Stack",
    primaryGoalLabel: workspace?.primary_goal || "Not configured yet",
    targetRegionLabel: workspace?.target_region || "No region selected",
    outreachToneLabel: workspace?.outreach_tone || "No tone selected",
    offerLabel: workspace?.offer || "Your primary offer",
  };
}
