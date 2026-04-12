"use client";

import { ReactNode } from "react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { getWorkspaceDisplayMeta } from "@/lib/workspace-utils";

interface PersonalizedEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function PersonalizedEmptyState({ icon, title, description, action }: PersonalizedEmptyStateProps) {
  const { workspace, user } = useWorkspace();
  const meta = getWorkspaceDisplayMeta(workspace, user);

  // Replace [workspace_name] placeholder in description if it exists
  const personalizedDescription = description.replace("[workspace_name]", meta.workspaceName);

  return (
    <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-white/[0.01] border border-dashed border-white/[0.08] fade-in">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/[0.05] flex items-center justify-center mb-6 text-[#64748B]">
        {icon}
      </div>
      <h3 className="text-base font-poppins font-semibold text-[#E5ECF6] mb-2">{title}</h3>
      <p className="text-sm text-[#64748B] max-w-sm mb-8 font-manrope leading-relaxed">
        {personalizedDescription}
      </p>
      {action}
    </div>
  );
}
