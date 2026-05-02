"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { TopBar } from "@/components/layout/TopBar";
import { 
  Building, 
  Megaphone, 
  Plus, 
  Zap, 
  Bot, 
  ShieldCheck, 
  CheckCircle,
  Activity,
  ArrowRight,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { getWorkspaceDisplayMeta } from "@/lib/workspace-utils";
import { createClient } from "@/lib/supabase/client";
import { CampaignStatusBadge } from "@/components/app/StatusBadge";
import type { Campaign } from "@/lib/types";
import { PageErrorBoundary } from "@/components/app/PageErrorBoundary";
import { SkeletonCard } from "@/components/app/Skeletons";

export default function DashboardPage() {
  return (
    <PageErrorBoundary>
      <DashboardContent />
    </PageErrorBoundary>
  );
}

function DashboardContent() {
  const { workspace, user } = useWorkspace();
  const supabase = createClient();
  const meta = getWorkspaceDisplayMeta(workspace, user);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!workspace) return;

    async function fetchRecentCampaigns() {
      if (!workspace) return;
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (data) setCampaigns(data);
      setIsLoading(false);
    }

    fetchRecentCampaigns();

    // 🚀 Stage 1: Real-time Campaign Updates for Dashboard
    const channel = supabase
      .channel(`dashboard-updates-${workspace.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaigns', filter: `workspace_id=eq.${workspace.id}` },
        () => {
          console.log('[Realtime] Campaigns updated in dashboard');
          fetchRecentCampaigns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0A0F1C] custom-scrollbar">
      <TopBar
        title="Dashboard"
        subtitle={`Overview for ${meta.workspaceName}`}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 fade-in">
          <div>
            <h2 className="font-poppins text-2xl font-bold text-[#E5ECF6] tracking-tight">
              {meta.greeting}
            </h2>
            <p className="text-sm text-[#64748B] mt-1 font-manrope">
              Your Agent-Net workspace is ready for workflow orchestration.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0D1525] bg-gradient-to-br from-[#3B82F6]/20 to-[#8B5CF6]/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#3B82F6]" />
                </div>
              ))}
            </div>
            <span className="text-xs font-manrope font-medium text-[#94A3B8]">
              3 Agents Active
            </span>
          </div>
        </div>

        {/* Global Stats or Empty State Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Workspace Context Card */}
            <div className="sv-card p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center">
                    <Building className="w-4 h-4 text-[#3B82F6]" />
                  </div>
                  <h3 className="font-poppins text-sm font-semibold text-[#E5ECF6]">Workspace Strategy</h3>
                </div>

                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                  <div>
                    <p className="text-[10px] font-manrope font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Business Type</p>
                    <p className="text-sm text-[#94A3B8] font-medium font-manrope">{meta.businessTypeLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-manrope font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Primary Goal</p>
                    <p className="text-sm text-[#94A3B8] font-medium font-manrope">{meta.primaryGoalLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-manrope font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Target Region</p>
                    <p className="text-sm text-[#94A3B8] font-medium font-manrope">{meta.targetRegionLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-manrope font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Outreach Tone</p>
                    <p className="text-sm text-[#94A3B8] font-medium font-manrope capitalize">{meta.outreachToneLabel}</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/[0.05] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-[11px] font-manrope text-[#64748B]">Growth Stack synchronized</span>
                  </div>
                  <Link href="/app/settings" className="text-[11px] font-manrope text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
                    Edit Configuration →
                  </Link>
                </div>
              </div>
            </div>

            {/* Campaign Area */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-poppins text-sm font-semibold text-[#E5ECF6]">Recent Activity</h3>
                {campaigns.length > 0 && (
                  <Link href="/app/campaigns">
                    <button className="text-[11px] font-manrope text-[#3B82F6] hover:text-[#60A5FA] transition-colors font-bold uppercase tracking-widest">
                      View All
                    </button>
                  </Link>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : campaigns.length === 0 ? (
                <div className="sv-card border-dashed bg-white/[0.01] flex flex-col items-center justify-center p-12 text-center group hover:bg-white/[0.02] transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-4 text-[#64748B] group-hover:scale-110 transition-transform">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-poppins font-semibold text-[#E5ECF6] mb-2">No campaigns launched yet</h4>
                  <p className="text-xs text-[#64748B] max-w-sm mb-6 font-manrope leading-relaxed">
                    You haven’t launched any outbound workflows for <span className="text-[#94A3B8] font-medium">{meta.workspaceName}</span> yet. Start your first Agent-Net campaign to find decision makers in <b>{meta.targetRegionLabel}</b>.
                  </p>
                  <Link href="/app/campaigns/create">
                    <button className="sv-btn-primary px-6 py-2 flex items-center gap-2 text-xs">
                      <Plus className="w-3.5 h-3.5" /> Start First Campaign
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map(camp => (
                    <Link key={camp.id} href={`/app/campaigns/${camp.id}`} className="block">
                      <div className="sv-card p-4 flex items-center gap-4 group hover:border-[#3B82F6]/30 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-[#64748B] group-hover:text-[#3B82F6] transition-all">
                          <Megaphone className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-poppins font-semibold text-[#E5ECF6] truncate group-hover:text-white transition-colors">{camp.campaign_name}</h4>
                          <p className="text-[10px] text-[#64748B] font-manrope uppercase tracking-tight mt-0.5">
                            {camp.current_stage} · {formatDate(camp.created_at)}
                          </p>
                        </div>
                        <CampaignStatusBadge status={camp.status} />
                        <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#E5ECF6] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Readiness Card */}
            <div className="sv-card p-5 bg-gradient-to-br from-[#3B82F6]/5 to-transparent border-[#3B82F6]/20">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[#F59E0B]" />
                <h3 className="font-poppins text-sm font-semibold text-[#E5ECF6]">Next Steps</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#10B981]/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3 h-3 text-[#10B981]" />
                  </div>
                  <div>
                    <p className="text-xs font-manrope font-semibold text-[#E5ECF6]">Workspace Setup Complete</p>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Your business profile is configured and sync'd.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", campaigns.length > 0 ? "bg-[#10B981]/20" : "bg-[#3B82F6]/20 animate-pulse")}>
                    {campaigns.length > 0 ? <CheckCircle className="w-3 h-3 text-[#10B981]" /> : <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />}
                  </div>
                  <div>
                    <p className={cn("text-xs font-manrope font-semibold", campaigns.length > 0 ? "text-[#E5ECF6]" : "text-[#3B82F6]")}>Launch First Campaign</p>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Configure your first Agent-Net search criteria.</p>
                  </div>
                </div>
              </div>

              {!campaigns.length && (
                <Link href="/app/campaigns/create" className="block mt-6">
                  <button className="sv-btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs">
                    Get Started <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              )}
            </div>

            {/* System Status */}
            <div className="sv-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-[#3B82F6]" />
                <h3 className="font-poppins text-sm font-semibold text-[#E5ECF6]">Agent Health</h3>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: "Researcher", status: "Running" },
                  { name: "Qualifier", status: "Idle" },
                  { name: "Copywriter", status: "Idle" }
                ].map((agent) => (
                  <div key={agent.name} className="flex items-center justify-between py-1 border-b border-white/[0.03] last:border-0">
                    <span className="text-xs font-manrope text-[#94A3B8]">{agent.name}</span>
                    <div className="flex items-center gap-1.5">
                      <div className={cn("w-1.5 h-1.5 rounded-full", agent.status === "Running" ? "bg-[#10B981]" : "bg-[#64748B]")} />
                      <span className="text-[10px] font-manrope text-[#64748B]">{agent.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
