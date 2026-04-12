"use client";

import { cn, timeAgo } from "@/lib/utils";
import type { ActivityEvent } from "@/lib/types";
import { CheckCircle, AlertTriangle, Info, XCircle, Search, Zap, Mail, FileText, Network } from "lucide-react";

const typeConfig = {
  success: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-[#10B981]", bg: "bg-[#10B981]/10", border: "border-[#10B981]/20" },
  warning: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10", border: "border-[#F59E0B]/20" },
  info: { icon: <Info className="w-3.5 h-3.5" />, color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10", border: "border-[#3B82F6]/20" },
  error: { icon: <XCircle className="w-3.5 h-3.5" />, color: "text-[#EF4444]", bg: "bg-[#EF4444]/10", border: "border-[#EF4444]/20" },
};

const agentIconMap: Record<string, React.ReactNode> = {
  research: <Search className="w-3 h-3" />,
  qualification: <Zap className="w-3 h-3" />,
  outreach: <Mail className="w-3 h-3" />,
  reporting: <FileText className="w-3 h-3" />,
  manager: <Network className="w-3 h-3" />,
};

interface ActivityTimelineProps {
  events: ActivityEvent[];
  compact?: boolean;
}

export function ActivityTimeline({ events, compact = false }: ActivityTimelineProps) {
  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const cfg = typeConfig[event.type];
        const isLast = index === events.length - 1;

        return (
          <div key={event.id} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={cn("w-7 h-7 rounded-full border flex items-center justify-center shrink-0", cfg.color, cfg.bg, cfg.border)}>
                {cfg.icon}
              </div>
              {!isLast && <div className="w-px flex-1 bg-white/[0.04] mt-1 mb-1" />}
            </div>

            {/* Content */}
            <div className={cn("pb-4 min-w-0", isLast && "pb-0")}>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className={cn("text-xs font-manrope font-semibold", cfg.color)}>
                  {event.event}
                </span>
                <span className="flex items-center gap-1 text-xs text-[#64748B]">
                  {agentIconMap[event.agentType]}
                  {event.agentName}
                </span>
                {event.campaignName && (
                  <span className="text-xs text-[#64748B] truncate">
                    · {event.campaignName}
                  </span>
                )}
              </div>
              {!compact && (
                <p className="text-xs text-[#64748B] leading-relaxed mb-1">
                  {event.detail}
                </p>
              )}
              <p className="text-xs text-[#4B5563]">{timeAgo(event.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
