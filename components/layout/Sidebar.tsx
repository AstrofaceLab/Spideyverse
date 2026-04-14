"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Network,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Plus,
  Bell,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { getWorkspaceDisplayMeta } from "@/lib/workspace-utils";
import { signOut } from "@/app/auth/actions";

const navItems = [
  { href: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/app/campaigns", icon: Megaphone, label: "Campaigns" },
  { href: "/app/leads", icon: Users, label: "Leads" },
  { href: "/app/agents", icon: Network, label: "Agents" },
  { href: "/app/outreach", icon: Bell, label: "Outreach" },
  { href: "/app/reports", icon: BarChart3, label: "Reports" },
];

const bottomItems = [
  { href: "/app/settings", icon: Settings, label: "Settings" },
  { href: "/app/admin", icon: ShieldCheck, label: "Admin" },
];

// Spiderweb SVG mark
function SpideyMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="10" stroke="#3B82F6" strokeWidth="1.2" strokeOpacity="0.6"/>
      <circle cx="11" cy="11" r="6" stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.4"/>
      <circle cx="11" cy="11" r="2.5" fill="#3B82F6" fillOpacity="0.9"/>
      {/* Web lines */}
      <line x1="11" y1="1" x2="11" y2="21" stroke="#3B82F6" strokeWidth="0.8" strokeOpacity="0.25"/>
      <line x1="1" y1="11" x2="21" y2="11" stroke="#3B82F6" strokeWidth="0.8" strokeOpacity="0.25"/>
      <line x1="3.34" y1="3.34" x2="18.66" y2="18.66" stroke="#3B82F6" strokeWidth="0.8" strokeOpacity="0.2"/>
      <line x1="18.66" y1="3.34" x2="3.34" y2="18.66" stroke="#3B82F6" strokeWidth="0.8" strokeOpacity="0.2"/>
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, workspace } = useWorkspace();
  const meta = getWorkspaceDisplayMeta(workspace, user);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="w-[220px] shrink-0 h-screen flex flex-col border-r border-white/[0.05] bg-[#0D1525]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.05]">
        <SpideyMark />
        <span className="font-poppins text-sm font-semibold text-[#E5ECF6] tracking-wide">
          SPIDEYVERSE
        </span>
      </div>

      {/* Workspace */}
      <div className="px-3 pt-4 pb-2">
        <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-all group overflow-hidden">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col items-start">
            <span className="text-xs font-manrope font-semibold text-[#E5ECF6] truncate w-full text-left">
              {meta.workspaceName}
            </span>
            <span className="text-[10px] font-manrope text-[#64748B] truncate w-full text-left">
              {meta.businessTypeLabel}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-[#64748B] shrink-0" />
        </button>
      </div>

      {/* Create campaign CTA */}
      <div className="px-3 pb-3">
        <Link href="/app/campaigns/create">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#3B82F6] hover:bg-[#3B82F6]/15 hover:border-[#3B82F6]/30 transition-all text-xs font-manrope font-medium text-left">
            <Plus className="w-3.5 h-3.5" />
            New Campaign
          </button>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="sv-section-title px-3 pt-1">Workspace</p>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(active ? "sidebar-item-active" : "sidebar-item")}>
                <item.icon className={cn("w-4 h-4 shrink-0", active ? "text-[#3B82F6]" : "")} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}

        <p className="sv-section-title px-3 pt-4">System</p>
        {bottomItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(active ? "sidebar-item-active" : "sidebar-item")}>
                <item.icon className={cn("w-4 h-4 shrink-0", active ? "text-[#3B82F6]" : "")} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 py-4 border-t border-white/[0.05]">
        <div
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-all cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white text-[10px] font-poppins font-semibold shrink-0">
            {meta.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-manrope font-medium text-[#E5ECF6] truncate">
              {meta.userName}
            </p>
            <p className="text-[10px] text-[#64748B] truncate leading-tight">{meta.userEmail}</p>
          </div>
          <LogOut className="w-3.5 h-3.5 text-[#4B5563] group-hover:text-[#64748B] transition-colors shrink-0" />
        </div>
      </div>
    </aside>
  );
}
