"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { PersonalizedEmptyState } from "@/components/app/PersonalizedEmptyState";
import { CampaignStatusBadge } from "@/components/app/StatusBadge";
import { 
  Plus, 
  Megaphone, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ArrowRight,
  Eye,
  Rocket,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { cn } from "@/lib/utils";

export default function CampaignsPage() {
  const { workspace } = useWorkspace();
  const supabase = createClient();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      if (!workspace) return;
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

      if (data) setCampaigns(data);
      setIsLoading(false);
    }
    fetchCampaigns();
  }, [workspace]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0A0F1C]">
      <TopBar 
        title="Campaigns" 
        subtitle="Manage your outbound Agent-Net workflows"
        actions={
          <Link href="/app/campaigns/create">
            <button className="sv-btn-primary flex items-center gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              New Campaign
            </button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#64748B]">
            <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-20" />
            <p className="text-sm font-manrope">Synchronizing Agent-Net...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <PersonalizedEmptyState 
            icon={<Megaphone className="w-8 h-8" />}
            title="No campaigns found"
            description="You haven’t launched any Agent-Net workflows for [workspace_name] yet. Start your first campaign to begin finding qualified leads."
            action={
              <Link href="/app/campaigns/create">
                <button className="sv-btn-primary px-8 py-2.5">
                  Launch First Campaign
                </button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {/* List View */}
            <div className="grid grid-cols-1 gap-3">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="sv-card p-5 flex items-center gap-4 group hover:border-[#3B82F6]/30 transition-all cursor-pointer" onClick={() => router.push(`/app/campaigns/${campaign.id}`)}>
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-[#64748B] group-hover:text-[#3B82F6] group-hover:bg-[#3B82F6]/5 transition-all">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-poppins font-semibold text-[#E5ECF6] group-hover:text-white transition-colors">{campaign.campaign_name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-[#64748B] truncate">{campaign.niche || campaign.objective}</p>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <p className="text-[10px] text-[#475569] font-manrope uppercase tracking-tight">{campaign.target_region || "Global"}</p>
                    </div>
                  </div>
                  
                  <div className="hidden md:block px-4">
                    <CampaignStatusBadge status={campaign.status} />
                  </div>

                  <div className="hidden lg:flex items-center gap-10 px-10 border-x border-white/[0.05]">
                    <div className="text-center">
                      <p className="text-[10px] font-manrope font-bold text-[#64748B] uppercase tracking-widest mb-0.5">Leads</p>
                      <p className="text-sm text-[#E5ECF6] font-semibold font-manrope">{campaign.leads_found || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-manrope font-bold text-[#64748B] uppercase tracking-widest mb-0.5">Stage</p>
                      <p className="text-[11px] text-[#3B82F6] font-bold font-manrope uppercase">{campaign.current_stage}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/app/campaigns/${campaign.id}`}>
                      <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#E5ECF6] hover:bg-white/[0.05] transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
