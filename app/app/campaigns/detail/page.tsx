"use client";

import { TopBar } from "@/components/layout/TopBar";
import { CampaignStatusBadge, AgentStatusBadge } from "@/components/app/StatusBadge";
import { WorkflowStepper } from "@/components/app/WorkflowStepper";
import { AgentCard } from "@/components/app/AgentCard";
import { ActivityTimeline } from "@/components/app/ActivityTimeline";
import { mockCampaigns, mockActivity, mockAgents } from "@/lib/mock-data";
import { formatDate, cn } from "@/lib/utils";
import { Pause, RotateCcw, Edit, AlertCircle, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const campaign = mockCampaigns.find(c => c.id === params.id) || mockCampaigns[0];
  const campaignActivity = mockActivity.filter(e => e.campaignId === campaign.id);

  const pendingActions = [
    campaign.status === "running" && {
      id: "pa_01",
      title: "Review 23 outreach drafts",
      detail: "Outreach Agent has generated drafts for batch 3. Your review is required before sending.",
      urgency: "high",
      href: "/app/outreach",
    },
  ].filter(Boolean) as { id: string; title: string; detail: string; urgency: string; href: string }[];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title={campaign.name}
        breadcrumb={["Campaigns", campaign.name]}
        actions={
          <div className="flex items-center gap-2">
            <button className="sv-btn-outline flex items-center gap-1.5 text-xs">
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            <button className="sv-btn-outline flex items-center gap-1.5 text-xs">
              <RotateCcw className="w-3.5 h-3.5" /> Rerun
            </button>
            {campaign.status === "running" && (
              <button className="sv-btn-outline flex items-center gap-1.5 text-xs border-[#F59E0B]/30 text-[#F59E0B] hover:border-[#F59E0B]/50">
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Header */}
        <div className="sv-card p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <h2 className="font-poppins text-lg font-semibold text-[#E5ECF6]">{campaign.name}</h2>
                <CampaignStatusBadge status={campaign.status} />
              </div>
              <p className="text-sm text-[#64748B]">{campaign.objective}</p>
              <p className="text-xs text-[#4B5563] mt-1">Created {formatDate(campaign.createdAt)} · Updated {formatDate(campaign.updatedAt)}</p>
            </div>
            <div className="shrink-0 hidden md:flex items-center gap-4 text-right">
              <div>
                <p className="font-poppins text-2xl font-semibold text-[#3B82F6]">{campaign.leadsFound}</p>
                <p className="text-xs text-[#64748B]">Leads Found</p>
              </div>
              <div>
                <p className="font-poppins text-2xl font-semibold text-[#10B981]">{campaign.qualifiedLeads}</p>
                <p className="text-xs text-[#64748B]">Qualified</p>
              </div>
              <div>
                <p className="font-poppins text-2xl font-semibold text-[#8B5CF6]">{campaign.draftsCreated}</p>
                <p className="text-xs text-[#64748B]">Drafts</p>
              </div>
            </div>
          </div>

          {/* Workflow Stepper */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <p className="text-xs font-manrope text-[#64748B] mb-4">Workflow Progress</p>
            <WorkflowStepper stageStatuses={campaign.stageStatuses} currentStage={campaign.currentStage} />
          </div>

          {/* Meta strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/[0.05]">
            {[
              { label: "Target Niche", value: campaign.niche },
              { label: "Region", value: campaign.targetRegion },
              { label: "Channel", value: campaign.outreachChannel },
              { label: "Lead Target", value: `${campaign.leadTargetCount} leads` },
            ].map(m => (
              <div key={m.label}>
                <p className="text-xs text-[#64748B]">{m.label}</p>
                <p className="text-sm text-[#94A3B8] font-manrope font-medium mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        {pendingActions.length > 0 && (
          <div className="sv-card p-5 border-[#F59E0B]/15">
            <p className="sv-section-title text-[#F59E0B]">Needs Your Action</p>
            <div className="space-y-2">
              {pendingActions.map(a => (
                <Link key={a.id} href={a.href}>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F59E0B]/5 border border-[#F59E0B]/15 hover:border-[#F59E0B]/30 transition-all cursor-pointer group">
                    <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-manrope font-medium text-[#E5ECF6]">{a.title}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{a.detail}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#F59E0B] group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Agent Cards */}
        <div>
          <p className="sv-section-title mb-3">Agent Status</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mockAgents.map(agent => (
              <AgentCard key={agent.id} agent={agent} compact />
            ))}
          </div>
        </div>

        {/* Campaign detail metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="sv-card p-5">
            <p className="sv-section-title">Campaign Configuration</p>
            <dl className="space-y-3">
              {[
                { label: "Business Type", value: campaign.businessType },
                { label: "Ideal Lead Profile", value: campaign.idealLeadProfile },
                { label: "Offered Service", value: campaign.offeredService },
                { label: "Value Proposition", value: campaign.valueProp },
                { label: "Outreach Tone", value: campaign.outreachTone },
              ].map(f => (
                <div key={f.label}>
                  <dt className="text-xs text-[#64748B] mb-0.5">{f.label}</dt>
                  <dd className="text-sm text-[#94A3B8] font-manrope">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="sv-card p-5">
            <p className="sv-section-title">Recent Activity</p>
            {campaignActivity.length > 0 ? (
              <ActivityTimeline events={campaignActivity} />
            ) : (
              <p className="text-xs text-[#64748B]">No activity recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
