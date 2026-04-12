"use client";

import { cn } from "@/lib/utils";
import { Network } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[#64748B] mb-4">
        {icon || <Network className="w-5 h-5" />}
      </div>
      <h3 className="font-poppins text-sm font-semibold text-[#94A3B8] mb-1.5">{title}</h3>
      <p className="text-xs text-[#64748B] max-w-xs leading-relaxed mb-4">{description}</p>
      {action}
    </div>
  );
}
