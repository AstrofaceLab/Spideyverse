import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CampaignStatus, AgentStatus, DraftStatus, LeadStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 2) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export function getCampaignStatusConfig(status: CampaignStatus) {
  const configs = {
    draft: { label: "Draft", color: "text-[#8B5CF6]", bg: "bg-[#8B5CF6]/10", border: "border-[#8B5CF6]/20", dot: "bg-[#8B5CF6]" },
    running: { label: "Running", color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10", border: "border-[#3B82F6]/20", dot: "bg-[#3B82F6]" },
    needs_review: { label: "Needs Review", color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10", border: "border-[#F59E0B]/20", dot: "bg-[#F59E0B]" },
    completed: { label: "Completed", color: "text-[#10B981]", bg: "bg-[#10B981]/10", border: "border-[#10B981]/20", dot: "bg-[#10B981]" },
    failed: { label: "Failed", color: "text-[#EF4444]", bg: "bg-[#EF4444]/10", border: "border-[#EF4444]/20", dot: "bg-[#EF4444]" },
  };
  return configs[status];
}

export function getAgentStatusConfig(status: AgentStatus | string) {
  const configs: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
    idle: { label: "Idle", color: "text-[#64748B]", bg: "bg-[#64748B]/10", border: "border-[#64748B]/20", dot: "bg-[#64748B]" },
    running: { label: "Running", color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10", border: "border-[#3B82F6]/20", dot: "bg-[#3B82F6]" },
    completed: { label: "Completed", color: "text-[#10B981]", bg: "bg-[#10B981]/10", border: "border-[#10B981]/20", dot: "bg-[#10B981]" },
    failed: { label: "Failed", color: "text-[#EF4444]", bg: "bg-[#EF4444]/10", border: "border-[#EF4444]/20", dot: "bg-[#EF4444]" },
    waiting: { label: "Waiting", color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10", border: "border-[#F59E0B]/20", dot: "bg-[#F59E0B]" },
    needs_review: { label: "Needs Review", color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10", border: "border-[#F59E0B]/20", dot: "bg-[#F59E0B]" },
  };
  return configs[status] || configs.idle;
}

export function getDraftStatusConfig(status: DraftStatus) {
  const configs = {
    pending_review: { label: "Pending Review", color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10", border: "border-[#F59E0B]/20" },
    approved: { label: "Approved", color: "text-[#10B981]", bg: "bg-[#10B981]/10", border: "border-[#10B981]/20" },
    rejected: { label: "Rejected", color: "text-[#EF4444]", bg: "bg-[#EF4444]/10", border: "border-[#EF4444]/20" },
    edited: { label: "Edited", color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10", border: "border-[#3B82F6]/20" },
    regenerating: { label: "Regenerating", color: "text-[#8B5CF6]", bg: "bg-[#8B5CF6]/10", border: "border-[#8B5CF6]/20" },
  };
  return configs[status] || configs.pending_review;
}

export function getLeadStatusConfig(status: LeadStatus) {
  const configs = {
    new: { label: "New", color: "text-[#94A3B8]", bg: "bg-white/5", border: "border-white/10" },
    qualified: { label: "Qualified", color: "text-[#10B981]", bg: "bg-[#10B981]/10", border: "border-[#10B981]/20" },
    disqualified: { label: "Disqualified", color: "text-[#EF4444]", bg: "bg-[#EF4444]/10", border: "border-[#EF4444]/20" },
    pending_review: { label: "Pending Review", color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10", border: "border-[#F59E0B]/20" },
    contacted: { label: "Contacted", color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10", border: "border-[#3B82F6]/20" },
    converted: { label: "Converted", color: "text-[#8B5CF6]", bg: "bg-[#8B5CF6]/10", border: "border-[#8B5CF6]/20" },
  };
  return configs[status] || configs.new;
}

export function getScoreColor(score: number): string {
  if (score >= 85) return "text-[#10B981]";
  if (score >= 70) return "text-[#F59E0B]";
  return "text-[#EF4444]";
}

export function getAgentIcon(type: string): string {
  const icons: Record<string, string> = {
    research: "🔍",
    qualification: "⚡",
    outreach: "✉️",
    reporting: "📊",
    manager: "🕸️",
  };
  return icons[type] || "🤖";
}
