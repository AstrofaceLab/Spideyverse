"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, CheckCircle, Sparkles, AlertCircle } from "lucide-react";
import { updateOnboarding } from "../actions";

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get("error");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
    }
  }, [errorMsg]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    try {
      await updateOnboarding(formData);
      setLoading(false);
      setDone(true);
      setTimeout(() => { window.location.href = "/app/dashboard"; }, 1500);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="w-full max-w-sm flex flex-col items-center text-center fade-in-up">
        <div className="w-14 h-14 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center mb-5">
          <CheckCircle className="w-6 h-6 text-[#10B981]" />
        </div>
        <h2 className="font-poppins text-xl font-semibold text-[#E5ECF6] mb-2">Workspace ready</h2>
        <p className="text-sm text-[#64748B]">Agent-Net is being initialized. Taking you to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg fade-in-up">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-[#3B82F6]" />
        <p className="text-xs font-manrope text-[#3B82F6] font-medium uppercase tracking-wider">Workspace Setup</p>
      </div>
      <h1 className="font-poppins text-2xl font-semibold text-[#E5ECF6] mb-1.5">Tell us about your business</h1>
      <p className="text-sm text-[#64748B] mb-8">
        This context powers your Agent-Net. The more specific, the better the results.
      </p>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="sv-card p-5 space-y-4">
          <p className="text-xs font-manrope font-semibold text-[#94A3B8] uppercase tracking-wider">Workspace Identity</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-manrope font-medium text-[#94A3B8] mb-1.5">Workspace / Business Name <span className="text-[#EF4444]">*</span></label>
              <input name="workspaceName" type="text" placeholder="Meridian Growth Co." className="sv-input w-full" required disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-manrope font-medium text-[#94A3B8] mb-1.5">Business Type <span className="text-[#EF4444]">*</span></label>
              <select name="businessType" className="sv-input w-full appearance-none" required disabled={loading}>
                <option value="">Select...</option>
                {["Agency", "Startup", "SMB", "Enterprise", "Freelancer"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-manrope font-medium text-[#94A3B8] mb-1.5">What do you offer / sell? <span className="text-[#EF4444]">*</span></label>
            <input name="offer" type="text" placeholder="e.g. Done-for-you outbound systems for B2B SaaS" className="sv-input w-full" required disabled={loading} />
          </div>
        </div>

        <div className="sv-card p-5 space-y-4">
          <p className="text-xs font-manrope font-semibold text-[#94A3B8] uppercase tracking-wider">Target Market</p>

          <div>
            <label className="block text-xs font-manrope font-medium text-[#94A3B8] mb-1.5">Ideal Customer Profile <span className="text-[#EF4444]">*</span></label>
            <textarea name="icp" rows={3} placeholder="e.g. Founders of SaaS companies with 5–50 employees, Series A or bootstrapped, struggling with outbound..."
              className="sv-input w-full resize-none" required disabled={loading} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-manrope font-medium text-[#94A3B8] mb-1.5">Target Region</label>
              <input name="targetRegion" type="text" placeholder="e.g. United States, Canada" className="sv-input w-full" disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-manrope font-medium text-[#94A3B8] mb-1.5">Primary Goal</label>
              <select name="primaryGoal" className="sv-input w-full appearance-none" disabled={loading}>
                <option value="Book discovery calls">Book discovery calls</option>
                <option value="Generate inbound leads">Generate inbound leads</option>
                <option value="Build partnerships">Build partnerships</option>
                <option value="Drive demo signups">Drive demo signups</option>
              </select>
            </div>
          </div>
        </div>

        <div className="sv-card p-5 space-y-4">
          <p className="text-xs font-manrope font-semibold text-[#94A3B8] uppercase tracking-wider">Brand Voice</p>
          <div>
            <label className="block text-xs font-manrope font-medium text-[#94A3B8] mb-1.5">Brand Tone</label>
            <select name="brandTone" className="sv-input w-full appearance-none" disabled={loading}>
              {["Professional & Direct", "Consultative", "Founder-to-Founder", "Executive-Level", "Data-Driven", "Empathetic"].map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full sv-btn-primary py-3 flex items-center justify-center gap-2 font-manrope font-semibold text-sm disabled:opacity-70 disabled:cursor-not-allowed">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Initializing Agent-Net...</>
          ) : (
            <>Activate Agent-Net <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </div>
  );
}
