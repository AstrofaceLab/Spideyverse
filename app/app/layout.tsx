import { redirect } from "next/navigation";
import { getWorkspaceData } from "@/lib/supabase/queries";
import { Sidebar } from "@/components/layout/Sidebar";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace } = await getWorkspaceData();

  if (!user) {
    return redirect("/auth/sign-in");
  }

  if (!workspace || !workspace.onboarding_completed) {
    return redirect("/auth/onboarding");
  }

  return (
    <WorkspaceProvider user={user} workspace={workspace}>
      <div className="flex h-screen bg-[#0A0F1C] text-[#E5ECF6] overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-[#0A0F1C]">
          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#3B82F60A_0%,_transparent_50%)]" />
            {children}
          </div>
        </main>
      </div>
    </WorkspaceProvider>
  );
}
