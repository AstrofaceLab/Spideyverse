"use client";

import { cn, getAgentStatusConfig, timeAgo } from "@/lib/utils";
import { AgentStatusBadge } from "./StatusBadge";
import type { Agent } from "@/lib/types";
import { Loader2, Zap, Search, Mail, FileText, Network } from "lucide-react";

const agentIcons: Record<string, React.ReactNode> = {
  research: <Search className="w-4 h-4" />,
  qualification: <Zap className="w-4 h-4" />,
  outreach: <Mail className="w-4 h-4" />,
  reporting: <FileText className="w-4 h-4" />,
  manager: <Network className="w-4 h-4" />,
};

const agentAccents: Record<string, string> = {
  research: "#3B82F6",
  qualification: "#F59E0B",
  outreach: "#10B981",
  reporting: "#8B5CF6",
  manager: "#06B6D4",
};

interface AgentCardProps {
  agent: Agent;
  compact?: boolean;
}

export function AgentCard({ agent, compact = false }: AgentCardProps) {
  const accent = agentAccents[agent.type] || "#3B82F6";

  return (
    <div className={cn("sv-card overflow-hidden group hover:border-white/10 transition-all duration-200")}>
      {/* Accent top bar */}
      <div className="h-0.5 w-full" style={{ background: `${accent}60` }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: `${accent}15`, border: `1px solid ${accent}30`, color: accent }}
            >
              {agentIcons[agent.type]}
            </div>
            <div>
              <p className="font-poppins text-sm font-semibold text-[#E5ECF6]">
                {agent.name}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">
                Last active {timeAgo(agent.lastActive)}
              </p>
            </div>
          </div>
          <AgentStatusBadge status={agent.status} />
        </div>

        {/* Role */}
        {!compact && (
          <p className="text-xs text-[#64748B] leading-relaxed mb-4">
            {agent.role}
          </p>
        )}

        {/* Current task */}
        {agent.currentTask && (
          <div className="flex items-start gap-2 mb-4 p-2.5 rounded-lg bg-[#3B82F6]/5 border border-[#3B82F6]/10">
            <Loader2 className="w-3 h-3 text-[#3B82F6] mt-0.5 animate-spin shrink-0" />
            <p className="text-xs text-[#94A3B8] leading-relaxed">{agent.currentTask}</p>
          </div>
        )}

        {/* Metrics */}
        <div className={cn("grid gap-3", compact ? "grid-cols-2" : "grid-cols-3")}>
          {agent.metrics.slice(0, compact ? 2 : 3).map((m) => (
            <div key={m.label} className="text-center">
              <p className="font-poppins text-base font-semibold text-[#E5ECF6]">
                {m.value}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
