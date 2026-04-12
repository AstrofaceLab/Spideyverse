"use client";

import { cn } from "@/lib/utils";
import { Check, Loader2, AlertTriangle, X, Clock } from "lucide-react";
import type { WorkflowStage, AgentStatus } from "@/lib/types";

const stages: { key: WorkflowStage; label: string }[] = [
  { key: "research", label: "Research" },
  { key: "qualification", label: "Qualification" },
  { key: "outreach", label: "Outreach" },
  { key: "reporting", label: "Reporting" },
];

type StageStatus = AgentStatus | "needs_review";

interface WorkflowStepperProps {
  stageStatuses: Record<WorkflowStage, StageStatus>;
  currentStage: WorkflowStage;
  compact?: boolean;
}

function StageIcon({ status }: { status: StageStatus }) {
  if (status === "completed") return <Check className="w-3.5 h-3.5" />;
  if (status === "running") return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
  if (status === "failed") return <X className="w-3.5 h-3.5" />;
  if (status === "needs_review") return <AlertTriangle className="w-3.5 h-3.5" />;
  return <Clock className="w-3 h-3" />;
}

function getStageConfig(status: StageStatus) {
  if (status === "completed") return {
    circle: "bg-[#10B981] border-[#10B981] text-white",
    line: "bg-[#10B981]",
    label: "text-[#10B981]",
  };
  if (status === "running") return {
    circle: "bg-[#3B82F6]/20 border-[#3B82F6] text-[#3B82F6]",
    line: "bg-white/10",
    label: "text-[#3B82F6]",
  };
  if (status === "failed") return {
    circle: "bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444]",
    line: "bg-white/10",
    label: "text-[#EF4444]",
  };
  if (status === "needs_review") return {
    circle: "bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B]",
    line: "bg-white/10",
    label: "text-[#F59E0B]",
  };
  return {
    circle: "bg-white/5 border-white/10 text-[#64748B]",
    line: "bg-white/5",
    label: "text-[#64748B]",
  };
}

export function WorkflowStepper({ stageStatuses, compact = false }: WorkflowStepperProps) {
  return (
    <div className={cn("flex items-center", compact ? "gap-0" : "gap-0 w-full")}>
      {stages.map((stage, index) => {
        const status = stageStatuses[stage.key] || "idle";
        const cfg = getStageConfig(status);
        const isLast = index === stages.length - 1;

        return (
          <div key={stage.key} className={cn("flex items-center", !isLast && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "rounded-full border flex items-center justify-center transition-all",
                  compact ? "w-6 h-6" : "w-8 h-8",
                  cfg.circle
                )}
              >
                <StageIcon status={status} />
              </div>
              {!compact && (
                <span className={cn("text-xs font-manrope font-medium whitespace-nowrap", cfg.label)}>
                  {stage.label}
                </span>
              )}
            </div>
            {!isLast && (
              <div className={cn("flex-1 h-px mx-2 transition-all", cfg.line)} />
            )}
          </div>
        );
      })}
    </div>
  );
}
