"use client";

import { useState } from "react";
import { 
  Megaphone, 
  Search, 
  Target, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Globe,
  Briefcase,
  Users,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/providers/workspace-provider";
import type { CampaignStatus, WorkflowStage } from "@/lib/types";

const steps = [
  { id: 1, title: "Basics", icon: Megaphone },
  { id: 2, title: "Target", icon: Users },
  { id: 3, title: "Offer", icon: Zap },
  { id: 4, title: "Outreach", icon: MessageSquare },
  { id: 5, title: "Launch", icon: CheckCircle2 },
];

export function CampaignForm() {
  const router = useRouter();
  const supabase = createClient();
  const { workspace } = useWorkspace();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    campaign_name: "",
    objective: "Lead Generation",
    niche: "",
    business_type: "B2B SaaS",
    target_region: "",
    ideal_lead_profile: "",
    offer_context: "",
    value_proposition: "",
    outreach_tone: "Professional, Strategic",
    outreach_channel: "Cold Email",
    target_lead_count: 100,
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (status: CampaignStatus = 'running') => {
    if (!workspace) return;
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          workspace_id: workspace.id,
          ...form,
          status: status,
          current_stage: 'research' as WorkflowStage,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        if (status === 'running') {
          try {
            const { launchCampaignWorkflow } = await import('@/lib/actions/workflow');
            await launchCampaignWorkflow(data.id, workspace.id);
          } catch (err) {
            console.error("Failed to trigger workflow from form:", err);
          }
        }
        router.push(`/app/campaigns/${data.id}`);
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-12 px-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center group">
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300",
                currentStep === step.id 
                  ? "bg-[#3B82F6]/10 border-[#3B82F6] text-[#3B82F6] shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                  : currentStep > step.id
                  ? "bg-[#10B981]/10 border-[#10B981] text-[#10B981]"
                  : "bg-white/[0.03] border-white/[0.05] text-[#64748B]"
              )}>
                {currentStep > step.id ? <CheckCircle2 className="w-6 h-6" /> : <step.icon className="w-5 h-5" />}
              </div>
              <span className={cn(
                "text-[10px] font-manrope font-bold uppercase tracking-widest",
                currentStep === step.id ? "text-[#E5ECF6]" : "text-[#64748B]"
              )}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "w-20 lg:w-32 h-[2px] mx-4 -mt-6 transition-all duration-500",
                currentStep > step.id ? "bg-gradient-to-r from-[#10B981] to-[#10B981]/50" : "bg-white/[0.05]"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="sv-card p-10 min-h-[500px] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
          <Sparkles className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col">
          {currentStep === 1 && (
            <div className="space-y-8 fade-in">
              <div>
                <h3 className="text-2xl font-poppins font-bold text-[#E5ECF6] mb-2">Campaign Basics</h3>
                <p className="text-[#64748B] text-sm">Set the foundational identity for this Agent-Net workflow.</p>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-manrope font-bold text-[#94A3B8] uppercase tracking-wider">Campaign Name</label>
                  <input 
                    name="campaign_name"
                    value={form.campaign_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Q4 Growth Acceleration"
                    className="sv-input w-full py-4 px-5 text-base"
                  />
                  <p className="text-[11px] text-[#475569]">A descriptive name to help you identify this workflow later.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-manrope font-bold text-[#94A3B8] uppercase tracking-wider">Objective</label>
                  <select 
                    name="objective"
                    value={form.objective}
                    onChange={handleInputChange}
                    className="sv-input w-full py-4 px-5 appearance-none text-base"
                  >
                    <option>Lead Generation</option>
                    <option>Event Promotion</option>
                    <option>Beta User Sourcing</option>
                    <option>Market Research</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 fade-in">
              <div>
                <h3 className="text-2xl font-poppins font-bold text-[#E5ECF6] mb-2">Target Audience</h3>
                <p className="text-[#64748B] text-sm">Define who the Agents should look for and where.</p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-manrope font-bold text-[#94A3B8] uppercase tracking-wider">Niche / Industry</label>
                  <input 
                    name="niche"
                    value={form.niche}
                    onChange={handleInputChange}
                    placeholder="e.g. FinTech, B2B SaaS"
                    className="sv-input w-full py-3.5 px-5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-manrope font-bold text-[#94A3B8] uppercase tracking-wider">Business Type</label>
                  <input 
                    name="business_type"
                    value={form.business_type}
                    onChange={handleInputChange}
                    placeholder="e.g. Agency, Startup"
                    className="sv-input w-full py-3.5 px-5"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-manrope font-bold text-[#94A3B8] uppercase tracking-wider">Target Region</label>
                  <input 
                    name="target_region"
                    value={form.target_region}
                    onChange={handleInputChange}
                    placeholder="e.g. North America, DACH Region, Global"
                    className="sv-input w-full py-3.5 px-5"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-manrope font-bold text-[#94A3B8] uppercase tracking-wider">Ideal Lead Profile (Keywords)</label>
                  <textarea 
                    name="ideal_lead_profile"
                    value={form.ideal_lead_profile}
                    onChange={handleInputChange}
                    placeholder="e.g. Founders, CTOs, VP Marketing at Series A companies..."
                    rows={4}
                    className="sv-input w-full py-4 px-5 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 fade-in">
              <div>
                <h3 className="text-2xl font-poppins font-bold text-[#E5ECF6] mb-2">Offer Context</h3>
                <p className="text-[#64748B] text-sm">What are you offering and why does it matter?</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-manrope font-bold text-[#94A3B8] uppercase tracking-wider">Service / Product Context</label>
                  <textarea 
                    name="offer_context"
                    value={form.offer_context}
                    onChange={handleInputChange}
                    placeholder="Briefly describe what you are offering..."
                    rows={3}
                    className="sv-input w-full py-4 px-5 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-manrope font-bold text-[#94A3B8] uppercase tracking-wider">Value Proposition</label>
                  <textarea 
                    name="value_proposition"
                    value={form.value_proposition}
                    onChange={handleInputChange}
                    placeholder="What is the unique hook or benefit?"
                    rows={3}
                    className="sv-input w-full py-4 px-5 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-8 fade-in">
              <div>
                <h3 className="text-2xl font-poppins font-bold text-[#E5ECF6] mb-2">Outreach Setup</h3>
                <p className="text-[#64748B] text-sm">Configure how the agents will represent you.</p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-manrope font-bold text-[#94A3B8] uppercase tracking-wider">Outreach Tone</label>
                  <select 
                    name="outreach_tone"
                    value={form.outreach_tone}
                    onChange={handleInputChange}
                    className="sv-input w-full py-3.5 px-5 appearance-none"
                  >
                    <option>Professional, Strategic</option>
                    <option>Curious, Casual</option>
                    <option>Direct, ROI-focused</option>
                    <option>Academic, Research-driven</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-manrope font-bold text-[#94A3B8] uppercase tracking-wider">Outreach Channel</label>
                  <select 
                    name="outreach_channel"
                    value={form.outreach_channel}
                    onChange={handleInputChange}
                    className="sv-input w-full py-3.5 px-5 appearance-none"
                  >
                    <option>Cold Email</option>
                    <option>LinkedIn Manual</option>
                    <option>Multi-Channel (Email + LI)</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-manrope font-bold text-[#94A3B8] uppercase tracking-wider">Target Lead Count</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range"
                      name="target_lead_count"
                      min="10"
                      max="1000"
                      step="10"
                      value={form.target_lead_count}
                      onChange={handleInputChange}
                      className="flex-1 h-1.5 bg-white/[0.05] rounded-lg appearance-none cursor-pointer accent-[#3B82F6]"
                    />
                    <span className="w-16 text-center py-1 bg-white/[0.05] rounded border border-white/[0.1] text-sm font-manrope font-bold text-[#3B82F6]">
                      {form.target_lead_count}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-8 fade-in">
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-3xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center mx-auto mb-6 text-[#10B981] shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-poppins font-bold text-[#E5ECF6] mb-2">Ready for Orchestration</h3>
                <p className="text-[#64748B] text-sm max-w-sm mx-auto">Review your campaign strategy before activating the Agent-Net.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-white/[0.01] border border-white/[0.05] rounded-2xl p-6">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-[10px] font-manrope font-bold text-[#64748B] uppercase tracking-widest mb-1">Campaign</p>
                  <p className="text-[#E5ECF6] font-medium truncate">{form.campaign_name || "Untitled Campaign"}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-[10px] font-manrope font-bold text-[#64748B] uppercase tracking-widest mb-1">Target</p>
                  <p className="text-[#E5ECF6] font-medium truncate">{form.niche} in {form.target_region || "Global"}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-[10px] font-manrope font-bold text-[#64748B] uppercase tracking-widest mb-1">Strategy</p>
                  <p className="text-[#E5ECF6] font-medium truncate">{form.outreach_tone} via {form.outreach_channel}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-[10px] font-manrope font-bold text-[#64748B] uppercase tracking-widest mb-1">Target Depth</p>
                  <p className="text-[#E5ECF6] font-medium">{form.target_lead_count} Leads</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#3B82F6]/5 border border-[#3B82F6]/10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6]">
                  <Globe className="w-5 h-5" />
                </div>
                <p className="text-xs text-[#94A3B8] flex-1 leading-relaxed">
                  Upon launch, our <span className="text-[#E5ECF6] font-semibold">Research Agents</span> will begin crawling for leads immediately based on your profile.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-auto pt-8 flex items-center justify-between border-t border-white/[0.05]">
            <button 
              onClick={prevStep}
              disabled={currentStep === 1 || isSubmitting}
              className={cn(
                "flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-manrope font-bold transition-all",
                currentStep === 1 ? "opacity-0 pointer-events-none" : "text-[#64748B] hover:text-[#E5ECF6] hover:bg-white/[0.05]"
              )}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex items-center gap-3">
              {currentStep < 5 && (
                <button 
                  onClick={() => handleSubmit('draft')}
                  disabled={!form.campaign_name || isSubmitting}
                  className="px-6 py-3 rounded-xl text-xs font-manrope font-bold text-[#64748B] hover:text-[#E5ECF6] hover:bg-white/[0.05] transition-all"
                >
                  Save Draft
                </button>
              )}
              
              {currentStep < 5 ? (
                <button 
                  onClick={nextStep}
                  disabled={currentStep === 1 && !form.campaign_name}
                  className="sv-btn-primary px-8 py-3.5 flex items-center gap-2.5 text-xs group"
                >
                  Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <button 
                  onClick={() => handleSubmit('running')}
                  disabled={isSubmitting}
                  className="sv-btn-primary px-12 py-4 flex items-center justify-center gap-2.5 text-xs bg-[#10B981] hover:bg-[#059669] border-[#059669] shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Initializing Agent-Net...
                    </>
                  ) : (
                    <>
                      Launch Campaign <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
