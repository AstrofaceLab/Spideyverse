"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { mockWorkspace } from "@/lib/mock-data";
import { Save, User, Building, Zap, Bell, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "workspace", label: "Workspace", icon: Building },
  { id: "account", label: "Account", icon: User },
  { id: "agent", label: "Agent Defaults", icon: Zap },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="sv-card p-6 mb-4">
      <div className="mb-5">
        <h3 className="font-poppins text-sm font-semibold text-[#E5ECF6]">{title}</h3>
        {description && <p className="text-xs text-[#64748B] mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-manrope font-medium text-[#94A3B8] mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-[#64748B] mt-1">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("workspace");
  const [form, setForm] = useState({
    workspaceName: mockWorkspace.name,
    businessDescription: mockWorkspace.businessDescription,
    businessType: mockWorkspace.businessType,
    defaultOffer: mockWorkspace.defaultOffer,
    defaultRegion: mockWorkspace.defaultRegion,
    outreachTone: mockWorkspace.outreachTone,
    name: "Jordan Pierce",
    email: "jordan@meridian.co",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Settings" subtitle="Workspace, account, and agent configuration" />

      <div className="flex flex-1 overflow-hidden">
        {/* Tab sidebar */}
        <div className="w-48 shrink-0 border-r border-white/[0.05] pt-5 px-3">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-manrope transition-all",
                activeTab === tab.id
                  ? "bg-white/[0.06] text-[#E5ECF6] border border-white/[0.06]"
                  : "text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.03]"
              )}>
              <tab.icon className={cn("w-3.5 h-3.5 shrink-0", activeTab === tab.id ? "text-[#3B82F6]" : "")} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "workspace" && (
            <div>
              <SectionCard title="Workspace Identity" description="Basic information about your workspace.">
                <Field label="Workspace Name">
                  <input value={form.workspaceName} onChange={set("workspaceName")} className="sv-input w-full" />
                </Field>
                <Field label="Business Type">
                  <select value={form.businessType} onChange={set("businessType")} className="sv-input w-full appearance-none">
                    {["Agency", "Startup", "SMB", "Enterprise", "Freelancer"].map(o => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Business Description" hint="Used by agents to understand your business context.">
                  <textarea value={form.businessDescription} onChange={set("businessDescription")} rows={3}
                    className="sv-input w-full resize-none" />
                </Field>
              </SectionCard>

              <SectionCard title="Campaign Defaults" description="Default values applied to new campaigns.">
                <Field label="Default Offer / Service">
                  <input value={form.defaultOffer} onChange={set("defaultOffer")} className="sv-input w-full" />
                </Field>
                <Field label="Default Target Region">
                  <input value={form.defaultRegion} onChange={set("defaultRegion")} className="sv-input w-full" />
                </Field>
                <Field label="Default Outreach Tone">
                  <select value={form.outreachTone} onChange={set("outreachTone")} className="sv-input w-full appearance-none">
                    {["Professional & Direct", "Consultative", "Founder-to-Founder", "Executive-Level", "Data-Driven", "Empathetic", "Formal"].map(o => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </Field>
              </SectionCard>

              <div className="flex justify-end">
                <button className="sv-btn-primary text-xs flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div>
              <SectionCard title="Personal Information">
                <Field label="Full Name">
                  <input value={form.name} onChange={set("name")} className="sv-input w-full" />
                </Field>
                <Field label="Email Address">
                  <input type="email" value={form.email} onChange={set("email")} className="sv-input w-full" />
                </Field>
              </SectionCard>

              <SectionCard title="Current Plan">
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#3B82F6]/5 border border-[#3B82F6]/15">
                  <div>
                    <p className="font-poppins text-sm font-semibold text-[#E5ECF6]">Growth Plan</p>
                    <p className="text-xs text-[#64748B] mt-0.5">Up to 10 campaigns · Unlimited leads · Priority support</p>
                  </div>
                  <button className="sv-btn-outline text-xs">Upgrade</button>
                </div>
              </SectionCard>

              <div className="flex justify-end">
                <button className="sv-btn-primary text-xs flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === "agent" && (
            <div>
              <SectionCard title="Agent Behavior Defaults" description="Configure how agents behave across campaigns.">
                <Field label="Auto-qualify threshold" hint="Leads scoring above this threshold are automatically marked as qualified.">
                  <div className="flex items-center gap-3">
                    <input type="range" min="50" max="95" defaultValue="80" className="flex-1 accent-[#3B82F6]" />
                    <span className="text-sm font-manrope font-medium text-[#E5ECF6] w-8">80</span>
                  </div>
                </Field>
                <Field label="Require human approval for outreach" hint="If enabled, all drafts must be manually approved before sending.">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-5 rounded-full bg-[#3B82F6] relative cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5 shadow" />
                    </div>
                    <span className="text-xs text-[#94A3B8] font-manrope">Enabled</span>
                  </div>
                </Field>
                <Field label="Max leads per campaign" hint="Caps the number of leads the Research Agent will source per campaign.">
                  <input type="number" defaultValue={200} className="sv-input w-32" />
                </Field>
              </SectionCard>

              <div className="flex justify-end">
                <button className="sv-btn-primary text-xs flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5" /> Save Defaults
                </button>
              </div>
            </div>
          )}

          {(activeTab === "notifications" || activeTab === "security") && (
            <div className="flex items-center justify-center h-64 text-[#64748B]">
              <p className="text-sm font-manrope">Coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
