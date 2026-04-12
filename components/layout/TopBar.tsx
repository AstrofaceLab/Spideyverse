"use client";

import { cn } from "@/lib/utils";
import { Bell, Search, ChevronRight } from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { getWorkspaceDisplayMeta } from "@/lib/workspace-utils";

interface TopBarProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string[];
  actions?: React.ReactNode;
  search?: boolean;
}

export function TopBar({ title, subtitle, breadcrumb, actions, search = false }: TopBarProps) {
  const { user, workspace } = useWorkspace();
  const meta = getWorkspaceDisplayMeta(workspace, user);

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/[0.05] bg-[#0D1525]/80 backdrop-blur-sm">
      {/* Left: Title / Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1.5">
            {breadcrumb.map((crumb, i) => (
              <span key={crumb} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3 h-3 text-[#4B5563] shrink-0" />}
                <span className={cn(
                  "text-sm font-manrope",
                  i === breadcrumb.length - 1 ? "text-[#E5ECF6] font-medium" : "text-[#64748B]"
                )}>
                  {crumb}
                </span>
              </span>
            ))}
          </div>
        )}
        {!breadcrumb && (
          <div>
            <h1 className="font-poppins text-sm font-semibold text-[#E5ECF6]">{title}</h1>
            {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-2">
        {search && (
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              className="sv-input pl-8 pr-3 py-1.5 w-48 text-xs"
            />
          </div>
        )}

        {/* Notification bell */}
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.04] transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
        </button>

        {/* Actions */}
        {actions}

        {/* Avatar */}
        <button className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white text-[10px] font-poppins font-semibold">
          {meta.initials}
        </button>
      </div>
    </header>
  );
}
