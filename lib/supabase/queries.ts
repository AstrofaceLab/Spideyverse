import { createClient } from "./server";
import { Workspace } from "../workspace-utils";

export async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getWorkspace(userId: string) {
  const supabase = createClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", userId)
    .single();
  return workspace as Workspace | null;
}

export async function getWorkspaceData() {
  const user = await getUser();
  if (!user) return { user: null, workspace: null };
  const workspace = await getWorkspace(user.id);
  return { user, workspace };
}
