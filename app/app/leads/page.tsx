"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { LeadStatusBadge, DraftStatusBadge, ScoreBadge } from "@/components/app/StatusBadge";
import { getScoreColor, formatDate, cn } from "@/lib/utils";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { createClient } from "@/lib/supabase/client";
import type { Lead } from "@/lib/types";
import { approveLead, ignoreLead } from "@/lib/actions/workflow";
import { toast } from "sonner";
import { 
  Search, Filter, X, ExternalLink, CheckCircle, 
  XCircle, RotateCcw, Mail, Users, ChevronRight, 
  Download, Loader2 
} from "lucide-react";
import Link from "next/link";
import { SkeletonTable } from "@/components/app/Skeletons";

function LeadDetailPanel({ 
  lead, 
  onClose,
  onStatusChange 
}: { 
  lead: Lead; 
  onClose: () => void;
  onStatusChange: (id: string, status: any) => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    onStatusChange(lead.id, 'qualified');
    try {
      await approveLead(lead.id);
      toast.success(`Lead ${lead.companyName} approved.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve lead.");
      // Re-sync happens via fetchData if we wanted, but for now we trust the user re-loading or the revalidatePath
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIgnore = async () => {
    setIsProcessing(true);
    onStatusChange(lead.id, 'disqualified');
    try {
      await ignoreLead(lead.id);
      toast.info(`Lead ${lead.companyName} ignored.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to ignore lead.");
    } finally {
      setIsProcessing(false);
    }
  };

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
        <button 
          onClick={handleApprove}
          disabled={isProcessing || lead.status === 'qualified'}
          className="w-full sv-btn-primary text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} 
          {lead.status === 'qualified' ? 'Approved' : 'Approve Lead'}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="sv-btn-outline text-xs flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed">
            <RotateCcw className="w-3.5 h-3.5" /> Requali.
          </button>
          <button 
            onClick={handleIgnore}
            disabled={isProcessing || lead.status === 'disqualified'}
            className="sv-btn-outline text-xs flex items-center justify-center gap-1.5 border-[#EF4444]/20 text-[#EF4444]/70 hover:text-[#EF4444] disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Ignore
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

import { PageErrorBoundary } from "@/components/app/PageErrorBoundary";

export default function LeadsPage() {
  return (
    <PageErrorBoundary>
      <LeadsContent />
    </PageErrorBoundary>
  );
}

function LeadsContent() {
  const { workspace } = useWorkspace();
  const searchParams = useSearchParams();
  const campaignIdParam = searchParams.get("campaign");
  const supabase = createClient();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState(campaignIdParam || "all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => {
    async function fetchData() {
      if (!workspace) return;
      
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('id, campaign_name')
        .eq('workspace_id', workspace.id);
      
      if (campaignData) setCampaigns(campaignData);

      // 🚀 Step 11: Server-side pagination
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('leads')
        .select('*, outreach_drafts(draft_status)', { count: 'exact' })
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data: leadsData } = await query;
      
      if (leadsData) {
        setLeads(leadsData.map(l => {
          const draft = (l.outreach_drafts as any[])?.[0];
          return {
            id: l.id,
            companyName: l.company_name,
            website: l.company_website,
            contactName: l.contact_name,
            contactTitle: l.contact_role,
            email: l.email,
            linkedIn: l.linkedin_url,
            source: l.source,
            summary: l.summary,
            score: l.score || 0,
            status: l.qualification_status,
            campaignId: l.campaign_id,
            campaignName: campaignData?.find(c => c.id === l.campaign_id)?.campaign_name || 'Unknown',
            draftStatus: draft?.draft_status || 'not_started',
            createdAt: l.created_at,
            tags: l.tags || [],
            qualificationReasoning: l.reasoning || '',
            region: l.region || '',
            niche: l.niche || '',
          };
        }));
      }
      setIsLoading(false);
    }
    fetchData();
  }, [workspace, page]);

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const matchStatus = statusFilter === "all" || l.status === statusFilter;
      const matchCampaign = campaignFilter === "all" || l.campaignId === campaignFilter;
      const matchSearch = l.companyName.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase()) ||
        (l.contactName || "").toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchCampaign && matchSearch;
    });
  }, [leads, statusFilter, campaignFilter, search]);

  const handleOptimisticStatus = (id: string, status: any) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    if (selectedLead?.id === id) {
      setSelectedLead(prev => prev ? { ...prev, status } : null);
    }
  };

  const campaignName = useMemo(() => {
    if (campaignFilter === "all") return "all campaigns";
    return campaigns.find(c => c.id === campaignFilter)?.campaign_name || "selected campaign";
  }, [campaignFilter, campaigns]);

  const handleExport = () => {
    if (leads.length === 0) return;
    
    const headers = ["Company", "Website", "Contact", "Title", "Email", "Score", "Status", "Campaign", "Added"];
    const rows = filtered.map(l => [
      l.companyName,
      l.website,
      l.contactName,
      l.contactTitle,
      l.email,
      l.score,
      l.status,
      l.campaignName,
      l.createdAt
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `spideyverse-leads-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Leads exported to CSV.");
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className={cn("flex flex-col flex-1 overflow-hidden", selectedLead && "border-r border-white/[0.05]")}>
        <TopBar
          title="Leads"
          subtitle={`${filtered.length} leads tied to ${campaignName}`}
          actions={
            <button 
              onClick={handleExport}
              className="sv-btn-outline text-xs flex items-center gap-1.5"
            >
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
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.campaign_name}</option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#64748B] pointer-events-none" />
            </div>

            {/* Pagination */}
            <div className="flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-lg border border-white/[0.05] ml-auto">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md hover:bg-white/[0.05] disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              </button>
              <span className="text-[10px] font-manrope font-semibold text-[#64748B] px-2 whitespace-nowrap">Page {page}</span>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={leads.length < PAGE_SIZE}
                className="p-1.5 rounded-md hover:bg-white/[0.05] disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
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
          {isLoading ? (
            <SkeletonTable rows={10} columns={8} />
          ) : (
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
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-[#64748B] text-xs">
                        No leads found.
                      </td>
                    </tr>
                  ) : filtered.map(lead => (
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
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedLead && (
        <LeadDetailPanel 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          onStatusChange={handleOptimisticStatus}
        />
      )}
    </div>
  );
}
