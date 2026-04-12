"use client";

import { TopBar } from "@/components/layout/TopBar";
import { mockAdminStats, mockAdminUsers } from "@/lib/mock-data";
import { cn, formatDate } from "@/lib/utils";
import {
  Users, Building, Megaphone, Activity, AlertTriangle,
  FileText, TrendingUp, CheckCircle, XCircle, Clock,
  ShieldCheck, RefreshCw,
} from "lucide-react";

const statCards = [
  { label: "Total Users", value: mockAdminStats.totalUsers, icon: Users, color: "#3B82F6" },
  { label: "Workspaces", value: mockAdminStats.totalWorkspaces, icon: Building, color: "#8B5CF6" },
  { label: "Total Campaigns", value: mockAdminStats.totalCampaigns, icon: Megaphone, color: "#06B6D4" },
  { label: "Active Runs", value: mockAdminStats.activeRuns, icon: Activity, color: "#10B981" },
  { label: "Failed Runs", value: mockAdminStats.failedRuns, icon: AlertTriangle, color: "#EF4444" },
  { label: "Total Drafts", value: mockAdminStats.totalDrafts.toLocaleString(), icon: FileText, color: "#F59E0B" },
];

const systemLogs = [
  { id: "log_01", event: "Campaign launched", detail: "SaaS Founders – Q4 Push · Meridian Growth Co.", time: "2m ago", type: "success" },
  { id: "log_02", event: "Research Agent failed", detail: "FinTech Risk Officers · Bluerock Solutions", time: "8m ago", type: "error" },
  { id: "log_03", event: "New user registered", detail: "marcus@bluerock.io · Bluerock Solutions", time: "2h ago", type: "info" },
  { id: "log_04", event: "Report generated", detail: "Legal Tech Decision-Makers · Meridian Growth Co.", time: "3h ago", type: "success" },
  { id: "log_05", event: "Qualification queue review needed", detail: "E-commerce Ops Leaders · Meridian Growth Co.", time: "5h ago", type: "warning" },
];

const agentHealth = [
  { name: "Research Agent", uptime: "99.2%", tasksToday: 47, errors: 1, status: "healthy" },
  { name: "Qualification Agent", uptime: "99.8%", tasksToday: 38, errors: 0, status: "healthy" },
  { name: "Outreach Agent", uptime: "98.4%", tasksToday: 156, errors: 2, status: "degraded" },
  { name: "Reporting Agent", uptime: "100%", tasksToday: 3, errors: 0, status: "healthy" },
  { name: "Manager Agent", uptime: "99.9%", tasksToday: 244, errors: 0, status: "healthy" },
];

export default function AdminPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Admin"
        subtitle="Internal control center"
        search
        actions={
          <div className="flex items-center gap-2">
            <button className="sv-btn-outline text-xs flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <span className="text-xs bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 px-2.5 py-1 rounded-full font-manrope font-medium">
              Admin
            </span>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((stat) => (
            <div key={stat.label} className="sv-card p-4 text-center">
              <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
                style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}25`, color: stat.color }}>
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="font-poppins text-xl font-semibold text-[#E5ECF6]">{stat.value}</p>
              <p className="text-xs text-[#64748B] mt-0.5 font-manrope">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Users table */}
          <div className="lg:col-span-2 sv-card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.05]">
              <p className="font-poppins text-sm font-semibold text-[#E5ECF6]">Users</p>
              <button className="sv-btn-outline text-xs">View All</button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {["Name", "Workspace", "Plan", "Campaigns", "Status"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-manrope font-semibold text-[#64748B] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockAdminUsers.map(user => (
                  <tr key={user.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-poppins font-bold shrink-0">
                          {user.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-xs font-manrope font-medium text-[#E5ECF6]">{user.name}</p>
                          <p className="text-xs text-[#64748B]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-[#94A3B8] font-manrope">{user.workspace}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full border font-manrope",
                        user.plan === "Enterprise" ? "bg-[#8B5CF6]/10 border-[#8B5CF6]/20 text-[#8B5CF6]" :
                          user.plan === "Growth" ? "bg-[#3B82F6]/10 border-[#3B82F6]/20 text-[#3B82F6]" :
                            "bg-white/[0.04] border-white/[0.08] text-[#64748B]"
                      )}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[#94A3B8] font-manrope">{user.campaignCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "flex items-center gap-1.5 text-xs font-manrope",
                        user.status === "active" ? "text-[#10B981]" : "text-[#64748B]"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", user.status === "active" ? "bg-[#10B981]" : "bg-[#374151]")} />
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Agent Health */}
            <div className="sv-card p-5">
              <p className="font-poppins text-sm font-semibold text-[#E5ECF6] mb-4">Agent Health</p>
              <div className="space-y-3">
                {agentHealth.map(a => (
                  <div key={a.name} className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      a.status === "healthy" ? "bg-[#10B981]" :
                        a.status === "degraded" ? "bg-[#F59E0B]" : "bg-[#EF4444]"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-manrope text-[#94A3B8] truncate">{a.name}</p>
                    </div>
                    <span className="text-xs text-[#64748B] font-manrope">{a.uptime}</span>
                    {a.errors > 0 && (
                      <span className="text-xs text-[#EF4444] font-manrope">{a.errors} err</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* System Logs */}
            <div className="sv-card p-5">
              <p className="font-poppins text-sm font-semibold text-[#E5ECF6] mb-4">System Activity</p>
              <div className="space-y-3">
                {systemLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2.5">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      log.type === "success" ? "bg-[#10B981]/10 text-[#10B981]" :
                        log.type === "error" ? "bg-[#EF4444]/10 text-[#EF4444]" :
                          log.type === "warning" ? "bg-[#F59E0B]/10 text-[#F59E0B]" :
                            "bg-[#3B82F6]/10 text-[#3B82F6]"
                    )}>
                      {log.type === "success" ? <CheckCircle className="w-3 h-3" /> :
                        log.type === "error" ? <XCircle className="w-3 h-3" /> :
                          log.type === "warning" ? <AlertTriangle className="w-3 h-3" /> :
                            <Activity className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-manrope font-medium text-[#E5ECF6]">{log.event}</p>
                      <p className="text-xs text-[#64748B] truncate">{log.detail}</p>
                      <p className="text-xs text-[#4B5563] mt-0.5">{log.time}</p>
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
