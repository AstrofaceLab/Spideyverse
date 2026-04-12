"use client";

import { cn } from "@/lib/utils";
import {
  Target, Users, CheckCircle, Mail, FileText,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  campaigns: <Target className="w-4 h-4" />,
  leads: <Users className="w-4 h-4" />,
  qualified: <CheckCircle className="w-4 h-4" />,
  drafts: <Mail className="w-4 h-4" />,
  reports: <FileText className="w-4 h-4" />,
};

interface KPICardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  iconKey?: string;
  accent?: string;
  className?: string;
}

export function KPICard({
  label,
  value,
  change,
  trend = "neutral",
  iconKey,
  accent = "#3B82F6",
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "sv-card p-5 relative overflow-hidden group transition-all duration-200 hover:border-white/10",
        className
      )}
    >
      {/* Subtle accent glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, ${accent}08 0%, transparent 60%)`,
        }}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-manrope text-[#64748B] mb-1.5 uppercase tracking-wider">
            {label}
          </p>
          <p className="font-poppins text-2xl font-semibold text-[#E5ECF6]">
            {value}
          </p>
          {change && (
            <div className="flex items-center gap-1 mt-1.5">
              {trend === "up" && <TrendingUp className="w-3 h-3 text-[#10B981]" />}
              {trend === "down" && <TrendingDown className="w-3 h-3 text-[#EF4444]" />}
              {trend === "neutral" && <Minus className="w-3 h-3 text-[#64748B]" />}
              <span
                className={cn(
                  "text-xs font-manrope",
                  trend === "up" && "text-[#10B981]",
                  trend === "down" && "text-[#EF4444]",
                  trend === "neutral" && "text-[#64748B]"
                )}
              >
                {change}
              </span>
            </div>
          )}
        </div>

        {iconKey && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] group-hover:text-[#94A3B8] transition-colors"
            style={{ background: `${accent}10`, border: `1px solid ${accent}20` }}
          >
            {iconMap[iconKey] || <Target className="w-4 h-4" />}
          </div>
        )}
      </div>
    </div>
  );
}
