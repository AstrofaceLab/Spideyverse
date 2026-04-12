"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { CampaignStatusBadge } from "@/components/app/StatusBadge";
import { WorkflowStepper } from "@/components/app/WorkflowStepper";
import { AgentCard } from "@/components/app/AgentCard";
import { ActivityTimeline } from "@/components/app/ActivityTimeline";
import { getCampaignOrchestration } from "@/lib/campaign-utils";
import { formatDate, cn } from "@/lib/utils";
import {
  Pause,
  RotateCcw,
  Edit,
  AlertCircle,
  ArrowRight,
  LayoutDashboard,
  Users,
  Mail,
  BarChart3,
  Loader2,
  Trash2,
  Rocket,
  CheckCircle2,
  Search,
  Zap
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Campaign } from "@/lib/types";

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchCampaign() {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', params.id)
        .single();

      if (data) setCampaign(data);
      setIsLoading(false);
    }
    fetchCampaign();
  }, [params.id]);

  const handleDelete = async () => {
    if (!campaign || !confirm("Are you sure you want to delete this campaign?")) return;
    setIsDeleting(true);
    const { error } = await supabase.from('campaigns').delete().eq('id', campaign.id);
    if (!error) router.push('/app/campaigns');
    else setIsDeleting(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-[#0A0F1C]">
        <TopBar title="Loading Campaign..." />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] opacity-30" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col h-full bg-[#0A0F1C]">
        <TopBar title="Campaign Not Found" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center text-[#EF4444] mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-poppins font-bold text-[#E5ECF6] mb-2">Campaign Not Found</h2>
          <p className="text-[#64748B] max-w-xs mb-6">The campaign you are looking for does not exist or has been removed.</p>
          <Link href="/app/campaigns" className="sv-btn-primary px-6 py-2">
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const orch = getCampaignOrchestration(campaign);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0A0F1C] custom-scrollbar">
      <TopBar
        title={campaign.campaign_name}
        breadcrumb={["Campaigns", campaign.campaign_name]}
        actions={
          <div className="flex items-center gap-2">
            <button className="sv-btn-outline flex items-center gap-1.5 text-[10px] py-1.5 h-auto">
              <Edit className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="sv-btn-outline flex items-center gap-1.5 text-[10px] py-1.5 h-auto text-[#EF4444] hover:border-[#EF4444]/30 hover:bg-[#EF4444]/5"
            >
              <Trash2 className="w-3 h-3" /> {isDeleting ? "Deleting..." : "Delete"}
            </button>
            {campaign.status === "running" && (
              <button className="sv-btn-primary flex items-center gap-1.5 text-[10px] py-1.5 h-auto">
                <Pause className="w-3 h-3" /> Pause
              </button>
            )}
            {campaign.status === 'draft' && (
              <button className="sv-btn-primary flex items-center gap-1.5 text-[10px] py-1.5 h-auto bg-[#10B981] border-[#10B981]">
                <Rocket className="w-3 h-3" /> Launch
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Main Orchestration Header */}
        <div className="sv-card overflow-hidden">
          <div className="p-6 bg-gradient-to-br from-white/[0.03] to-transparent">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-poppins font-bold text-[#E5ECF6]">{campaign.campaign_name}</h2>
                  <CampaignStatusBadge status={campaign.status} />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                  <div className="flex items-center gap-1.5 bg-white/[0.03] rounded-full px-3 py-1 border border-white/[0.05]">
                    <Users className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span className="text-[#E5ECF6] font-medium">{campaign.niche}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/[0.03] rounded-full px-3 py-1 border border-white/[0.05]">
                    <Mail className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span className="text-[#E5ECF6] font-medium">{campaign.outreach_channel}</span>
                  </div>
                  <div className="text-[11px] font-manrope">
                    Created {formatDate(campaign.created_at)}
                  </div>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                {[
                  { label: "Leads Sourced", value: orch.leadsFound, icon: Search, color: "text-[#3B82F6]" },
                  { label: "Qualified", value: orch.qualifiedLeads, icon: AlertCircle, color: "text-[#10B981]" },
                  { label: "Drafts Created", value: orch.draftsCreated, icon: Mail, color: "text-[#8B5CF6]" },
                  { label: "Approvals", value: orch.approvalsCount, icon: CheckCircle2, color: "text-[#06B6D4]" },
                ].map((kpi) => (
                  <div key={kpi.label} className="flex flex-col items-center lg:items-end">
                    <p className="text-[10px] font-manrope font-bold text-[#64748B] uppercase tracking-widest mb-1">{kpi.label}</p>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xl font-poppins font-bold text-[#E5ECF6]")}>{kpi.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stepper Integration */}
          <div className="px-6 py-6 border-t border-white/[0.05] bg-white/[0.01]">
            <WorkflowStepper stageStatuses={orch.stageStatuses as any} currentStage={campaign.current_stage} />
          </div>
        </div>

        {/* Operational Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Timeline */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="sv-card p-6 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-poppins font-bold text-[#E5ECF6] uppercase tracking-widest flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-[#3B82F6]" />
                  Activity
                </h3>
                <span className="text-[10px] font-manrope font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded uppercase">Live Feed</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                <ActivityTimeline events={orch.activity} />
              </div>
            </div>

            {/* Strategy Card */}
            <div className="sv-card p-6">
              <h3 className="text-sm font-poppins font-bold text-[#E5ECF6] uppercase tracking-widest mb-4">Orchestration Parameters</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-[#64748B] font-manrope font-bold uppercase mb-1">Objective</p>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">{campaign.objective}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#64748B] font-manrope font-bold uppercase mb-1">Ideal Lead Profile</p>
                  <p className="text-sm text-[#94A3B8] leading-relaxed italic">"{campaign.ideal_lead_profile || "Generalized niche targeting"}"</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#64748B] font-manrope font-bold uppercase mb-1">Value Proposition</p>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">{campaign.value_proposition || "No specific value prop set"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Net View */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-poppins font-bold text-[#E5ECF6] uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#F59E0B]" />
                Agent-Net Orchestration
              </h3>
              <Link href="/app/agents" className="text-[10px] text-[#64748B] hover:text-[#3B82F6] transition-colors font-bold uppercase tracking-widest">
                Manage Fleet &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orch.agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} compact />
              ))}
            </div>

            {/* Quick Actions / Integration Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "View Leads", href: `/app/leads?campaign=${campaign.id}`, icon: Users, desc: "Browse sourced data" },
                { label: "Outreach Review", href: `/app/outreach?campaign=${campaign.id}`, icon: Mail, desc: "Approve draft batches", count: orch.draftsCreated > orch.approvalsCount ? orch.draftsCreated - orch.approvalsCount : 0 },
                { label: "Campaign Report", href: `/app/reports?campaign=${campaign.id}`, icon: BarChart3, desc: "Export metrics" },
              ].map((action) => (
                <Link key={action.label} href={action.href}>
                  <div className="sv-card p-5 hover:border-[#3B82F6]/30 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center text-[#64748B] group-hover:text-[#3B82F6] group-hover:bg-[#3B82F6]/5 transition-all">
                        <action.icon className="w-4 h-4" />
                      </div>
                      {action.count ? (
                        <span className="text-[10px] bg-[#EF4444] text-white font-bold px-2 py-0.5 rounded-full">{action.count}</span>
                      ) : null}
                    </div>
                    <p className="text-sm font-poppins font-bold text-[#E5ECF6] mb-1">{action.label}</p>
                    <p className="text-[10px] text-[#64748B] leading-tight">{action.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
