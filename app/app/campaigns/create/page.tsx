"use client";

import { TopBar } from "@/components/layout/TopBar";
import { CampaignForm } from "@/components/app/CampaignForm";

export default function CreateCampaignPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0A0F1C]">
      <TopBar 
        title="New Agent-Net Workflow" 
        subtitle="Configure your autonomous growth orchestration"
        breadcrumb={["Campaigns", "Create"]}
      />

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <CampaignForm />
      </div>
    </div>
  );
}
