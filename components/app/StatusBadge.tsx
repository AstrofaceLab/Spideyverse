"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  dot?: string;
  showDot?: boolean;
  size?: "sm" | "md";
  animate?: boolean;
}

export function StatusBadge({
  label,
  color,
  bg,
  border,
  dot,
  showDot = true,
  size = "sm",
  animate = false,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-manrope font-medium",
        bg,
        border,
        color,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      )}
    >
      {showDot && dot && (
        <span
          className={cn(
            "rounded-full",
            dot,
            size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2",
            animate && "animate-pulse"
          )}
        />
      )}
      {label}
    </span>
  );
}

// Convenience wrappers
import {
  getCampaignStatusConfig,
  getAgentStatusConfig,
  getDraftStatusConfig,
  getLeadStatusConfig,
} from "@/lib/utils";
import type { CampaignStatus, AgentStatus, DraftStatus, LeadStatus } from "@/lib/types";

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const cfg = getCampaignStatusConfig(status);
  return (
    <StatusBadge
      status={status}
      {...cfg}
      animate={status === "running"}
    />
  );
}

export function AgentStatusBadge({ status }: { status: AgentStatus | string }) {
  const cfg = getAgentStatusConfig(status);
  return (
    <StatusBadge
      status={status}
      {...cfg}
      animate={status === "running"}
    />
  );
}

export function DraftStatusBadge({ status }: { status: DraftStatus }) {
  const cfg = getDraftStatusConfig(status);
  return <StatusBadge status={status} {...cfg} showDot={false} />;
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const cfg = getLeadStatusConfig(status);
  return <StatusBadge status={status} {...cfg} showDot={false} />;
}

export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20" :
                score >= 70 ? "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20" :
                "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20";
  
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-xs font-bold font-poppins border", color)}>
      {score}
    </span>
  );
}

