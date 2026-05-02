"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { formatDate, cn } from "@/lib/utils";
import type { Report } from "@/lib/types";
import { BarChart3, TrendingUp, AlertTriangle, Lightbulb, X, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

function ReportDetailView({ report, onClose }: { report: Report; onClose: () => void }) {
  const qualRate = report.leadsFound > 0 ? ((report.qualifiedLeads / report.leadsFound) * 100).toFixed(0) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-start justify-between p-5 border-b border-white/[0.05]">
        <div>
          <h3 className="font-poppins text-sm font-semibold text-[#E5ECF6]">{report.campaignName}</h3>
          <p className="text-xs text-[#64748B] mt-0.5">Generated {formatDate(report.generatedAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="sv-btn-outline text-xs flex items-center gap-1.5 opacity-50 cursor-not-allowed">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.05] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Leads Found", value: report.leadsFound, color: "#3B82F6" },
            { label: "Qualified Leads", value: report.qualifiedLeads, color: "#10B981" },
            { label: "Qual. Rate", value: `${qualRate}%`, color: "#10B981" },
            { label: "Drafts Generated", value: report.draftsGenerated, color: "#8B5CF6" },
            { label: "Pending Approvals", value: report.pendingApprovals || 0, color: "#F59E0B" },
            { label: "Workflow Time", value: report.workflowTime || 'N/A', color: "#06B6D4" },
          ].map(m => (
            <div key={m.label} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="font-poppins text-xl font-semibold" style={{ color: m.color }}>{m.value}</p>
              <p className="text-xs text-[#64748B] mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#3B82F6]" />
            <p className="text-xs font-manrope font-semibold text-[#94A3B8] uppercase tracking-wider">Campaign Summary</p>
          </div>
          <p className="text-sm text-[#94A3B8] leading-relaxed">{report.summary}</p>
        </div>

        {/* Bottlenecks */}
        {report.bottlenecks && report.bottlenecks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
              <p className="text-xs font-manrope font-semibold text-[#F59E0B] uppercase tracking-wider">Bottlenecks</p>
            </div>
            <div className="space-y-2">
              {report.bottlenecks.map((b, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F59E0B]/5 border border-[#F59E0B]/15">
                  <span className="w-5 h-5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] text-xs flex items-center justify-center shrink-0 font-poppins font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{b}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations && report.recommendations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-3.5 h-3.5 text-[#10B981]" />
              <p className="text-xs font-manrope font-semibold text-[#10B981] uppercase tracking-wider">Recommendations</p>
            </div>
            <div className="space-y-2">
              {report.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-[#10B981]/5 border border-[#10B981]/15">
                  <span className="w-5 h-5 rounded-full bg-[#10B981]/20 text-[#10B981] text-xs flex items-center justify-center shrink-0 font-poppins font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { PageErrorBoundary } from "@/components/app/PageErrorBoundary";

export default function ReportsPage() {
  return (
    <PageErrorBoundary>
      <ReportsContent />
    </PageErrorBoundary>
  );
}

function ReportsContent() {
  const searchParams = useSearchParams();
  const campaignIdParam = searchParams.get("campaign");

  const [reports, setReports] = useState<Report[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [campaignFilter, setCampaignFilter] = useState(campaignIdParam || "all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reportsRes, campaignsRes] = await Promise.all([
        fetch(`/api/reports?campaign=${campaignFilter}`),
        fetch('/api/campaigns')
      ]);

      const [reportsData, campaignsData] = await Promise.all([
        reportsRes.json(),
        campaignsRes.json()
      ]);

      if (reportsData.error) throw new Error(reportsData.error);
      if (campaignsData.error) throw new Error(campaignsData.error);

      setReports(reportsData);
      setCampaigns(campaignsData);

      // Handle initial selection
      if (campaignIdParam) {
        const report = reportsData.find((r: Report) => r.campaignId === campaignIdParam);
        if (report) setSelectedReport(report);
      } else if (reportsData.length > 0 && !selectedReport) {
        setSelectedReport(reportsData[0]);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load report data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [campaignFilter]);

  const filteredReports = reports; // Already filtered by API

  return (
    <div className="flex h-full overflow-hidden">
      {/* Report List */}
      <div className={cn("flex flex-col overflow-hidden border-r border-white/[0.05]", selectedReport ? "w-80 shrink-0" : "flex-1")}>
        <TopBar title="Reports" subtitle="Campaign performance reports from Agent-Net" />

        <div className="px-4 py-3 border-b border-white/[0.05]">
          <div className="relative">
            <select 
              value={campaignFilter} 
              onChange={e => setCampaignFilter(e.target.value)}
              className="sv-input w-full py-1.5 pl-3 pr-8 text-[11px] appearance-none bg-white/[0.02] border-white/[0.05] text-[#64748B]"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.campaign_name}</option>
              ))}
            </select>
            <BarChart3 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#64748B] pointer-events-none" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#3B82F6]/30" /></div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <BarChart3 className="w-8 h-8 text-[#4B5563] mb-3" />
              <p className="text-sm font-manrope text-[#64748B]">No reports yet</p>
              <p className="text-xs text-[#4B5563] mt-1">Reports are generated automatically when campaigns complete.</p>
            </div>
          ) : (
            filteredReports.map(report => {
              const qualRate = report.leadsFound > 0 ? ((report.qualifiedLeads / report.leadsFound) * 100).toFixed(0) : 0;
              return (
                <button key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    selectedReport?.id === report.id
                      ? "bg-[#3B82F6]/5 border-[#3B82F6]/20"
                      : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.08]"
                  )}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-manrope font-semibold text-[#E5ECF6] leading-tight">{report.campaignName}</p>
                    <BarChart3 className="w-3.5 h-3.5 text-[#64748B] shrink-0 mt-0.5" />
                  </div>
                  <p className="text-xs text-[#64748B] mb-3">{formatDate(report.generatedAt)}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="font-poppins text-sm font-semibold text-[#3B82F6]">{report.leadsFound}</p>
                      <p className="text-xs text-[#64748B]">Leads</p>
                    </div>
                    <div className="text-center">
                      <p className="font-poppins text-sm font-semibold text-[#10B981]">{qualRate}%</p>
                      <p className="text-xs text-[#64748B]">Qual Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="font-poppins text-sm font-semibold text-[#8B5CF6]">{report.draftsGenerated}</p>
                      <p className="text-xs text-[#64748B]">Drafts</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Report Detail */}
      {selectedReport && (
        <div className="flex-1 bg-[#0D1525] overflow-hidden">
          <ReportDetailView report={selectedReport} onClose={() => setSelectedReport(null)} />
        </div>
      )}
    </div>
  );
}
