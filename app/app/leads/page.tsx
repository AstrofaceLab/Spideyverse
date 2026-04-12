"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { LeadStatusBadge, DraftStatusBadge } from "@/components/app/StatusBadge";
import { mockLeads, mockCampaigns } from "@/lib/mock-data";
import { getScoreColor, formatDate, cn } from "@/lib/utils";
import type { Lead } from "@/lib/types";
import {
  Search, Filter, X, ExternalLink, CheckCircle,
  XCircle, RotateCcw, Mail, Users, ChevronRight,
  Download,
} from "lucide-react";
import Link from "next/link";

function ScoreBadge({ score }: { score: number }) {
  const color = getScoreColor(score);
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-poppins font-bold",
        score >= 85 ? "bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981]" :
        score >= 70 ? "bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B]" :
        "bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]"
      )}>
        {score}
      </div>
    </div>
  );
}

function LeadDetailPanel({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  return (
    <div className="w-96 shrink-0 border-l border-white/[0.05] bg-[#0D1525] flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-white/[0.05]">
        <div>
          <h3 className="font-poppins text-sm font-semibold text-[#E5ECF6]">{lead.companyName}</h3>
          <a href={`https://${lead.website}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-xs text-[#3B82F6] hover:text-[#60A5FA] mt-0.5 transition-colors">
            {lead.website} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.05] transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Score + status */}
        <div className="p-5 border-b border-white/[0.05]">
          <div className="flex items-center gap-3 mb-3">
            <ScoreBadge score={lead.score} />
            <div>
              <p className="text-xs text-[#64748B]">Qualification Score</p>
              <div className="flex items-center gap-2 mt-0.5">
                <LeadStatusBadge status={lead.status} />
              </div>
            </div>
          </div>
          <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", lead.score >= 85 ? "bg-[#10B981]" : lead.score >= 70 ? "bg-[#F59E0B]" : "bg-[#EF4444]")}
              style={{ width: `${lead.score}%` }}
            />
          </div>
        </div>

        {/* Contact */}
        <div className="p-5 border-b border-white/[0.05]">
          <p className="sv-section-title">Contact</p>
          <div className="space-y-2.5">
            {lead.contactName && (
              <div>
                <p className="text-xs text-[#64748B]">Name</p>
                <p className="text-sm text-[#94A3B8] font-manrope">{lead.contactName}</p>
              </div>
            )}
            {lead.contactTitle && (
              <div>
                <p className="text-xs text-[#64748B]">Title</p>
                <p className="text-sm text-[#94A3B8] font-manrope">{lead.contactTitle}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-[#64748B]">Email</p>
              <p className="text-sm text-[#94A3B8] font-manrope">{lead.email}</p>
            </div>
            {lead.linkedIn && (
              <div>
                <p className="text-xs text-[#64748B]">LinkedIn</p>
                <a href={`https://${lead.linkedIn}`} target="_blank" rel="noreferrer"
                  className="text-sm text-[#3B82F6] hover:text-[#60A5FA] font-manrope transition-colors">
                  View profile
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="p-5 border-b border-white/[0.05]">
          <p className="sv-section-title">Lead Summary</p>
          <p className="text-xs text-[#94A3B8] leading-relaxed">{lead.summary}</p>
          <p className="text-xs text-[#64748B] mt-2">Source: {lead.source}</p>
        </div>

        {/* Qualification Reasoning */}
        <div className="p-5 border-b border-white/[0.05]">
          <p className="sv-section-title">Qualification Reasoning</p>
          <p className="text-xs text-[#94A3B8] leading-relaxed">{lead.qualificationReasoning}</p>
        </div>

        {/* Tags */}
        <div className="p-5 border-b border-white/[0.05]">
          <p className="sv-section-title">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {lead.tags.map(tag => (
              <span key={tag} className="text-xs font-manrope px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#94A3B8]">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Outreach Draft */}
        <div className="p-5">
          <p className="sv-section-title">Outreach Draft</p>
          <div className="flex items-center gap-2">
            <DraftStatusBadge status={lead.draftStatus} />
            {lead.draftStatus === "approved" && (
              <Link href={`/app/outreach?campaign=${lead.campaignId}`} className="text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors flex items-center gap-1">
                View draft <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-white/[0.05] space-y-2">
        <button className="w-full sv-btn-primary text-xs flex items-center justify-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" /> Approve Lead
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="sv-btn-outline text-xs flex items-center justify-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Requali.
          </button>
          <button className="sv-btn-outline text-xs flex items-center justify-center gap-1.5 border-[#EF4444]/20 text-[#EF4444]/70 hover:text-[#EF4444]">
            <XCircle className="w-3.5 h-3.5" /> Ignore
          </button>
        </div>
        <Link href={`/app/outreach?campaign=${lead.campaignId}`} className="block w-full">
          <button className="w-full sv-btn-outline text-xs flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Open Outreach Draft
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const searchParams = useSearchParams();
  const campaignIdParam = searchParams.get("campaign");
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState(campaignIdParam || "all");

  const filtered = useMemo(() => {
    return mockLeads.filter(l => {
      const matchStatus = statusFilter === "all" || l.status === statusFilter;
      const matchCampaign = campaignFilter === "all" || l.campaignId === campaignFilter;
      const matchSearch = l.companyName.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase()) ||
        (l.contactName || "").toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchCampaign && matchSearch;
    });
  }, [statusFilter, campaignFilter, search]);

  const campaignName = useMemo(() => {
    if (campaignFilter === "all") return "all campaigns";
    return mockCampaigns.find(c => c.id === campaignFilter)?.campaign_name || "selected campaign";
  }, [campaignFilter]);

  return (
    <div className="flex h-full overflow-hidden">
      <div className={cn("flex flex-col flex-1 overflow-hidden", selectedLead && "border-r border-white/[0.05]")}>
        <TopBar
          title="Leads"
          subtitle={`${filtered.length} leads tied to ${campaignName}`}
          actions={
            <button className="sv-btn-outline text-xs flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          }
        />

        <div className="flex-1 overflow-y-auto p-6">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="relative flex-1 min-w-48 max-w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] pointer-events-none" />
              <input type="text" placeholder="Search leads..." value={search}
                onChange={e => setSearch(e.target.value)} className="sv-input pl-8 w-full text-xs" />
            </div>

            {/* Campaign Filter Dropdown */}
            <div className="relative">
              <select 
                value={campaignFilter} 
                onChange={e => setCampaignFilter(e.target.value)}
                className="sv-input py-1.5 pl-3 pr-8 text-xs appearance-none bg-white/[0.03] border-white/[0.06] text-[#94A3B8]"
              >
                <option value="all">All Campaigns</option>
                {mockCampaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.campaign_name}</option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#64748B] pointer-events-none" />
            </div>
            {["all", "new", "qualified", "disqualified", "pending_review", "contacted"].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-manrope font-medium capitalize transition-all",
                  statusFilter === f
                    ? "bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30"
                    : "bg-white/[0.03] text-[#64748B] border border-white/[0.06] hover:text-[#94A3B8] hover:bg-white/[0.05]"
                )}>
                {f === "all" ? "All Leads" : f.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="sv-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {["Company", "Contact", "Email", "Score", "Status", "Campaign", "Draft", "Added"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-manrope font-semibold text-[#64748B] uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={cn(
                      "border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer",
                      selectedLead?.id === lead.id && "bg-[#3B82F6]/5 border-l-2 border-l-[#3B82F6]"
                    )}>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-manrope font-medium text-[#E5ECF6]">{lead.companyName}</p>
                      <p className="text-xs text-[#64748B]">{lead.website}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-[#94A3B8] font-manrope">{lead.contactName || "—"}</p>
                      <p className="text-xs text-[#64748B]">{lead.contactTitle || ""}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-[#94A3B8] font-manrope">{lead.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <ScoreBadge score={lead.score} />
                    </td>
                    <td className="px-4 py-3.5">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-[#94A3B8] truncate max-w-32 font-manrope">{lead.campaignName}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <DraftStatusBadge status={lead.draftStatus} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-[#64748B] whitespace-nowrap font-manrope">{formatDate(lead.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedLead && (
        <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}
