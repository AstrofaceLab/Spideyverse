"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

export default function SignUpPage() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); window.location.href = "/auth/onboarding"; }, 1200);
  };

  return (
    <div className="w-full max-w-sm fade-in-up">
      <div className="flex items-center gap-2 mb-8 lg:hidden">
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="10" stroke="#3B82F6" strokeWidth="1.2" strokeOpacity="0.6"/>
          <circle cx="11" cy="11" r="2.5" fill="#3B82F6"/>
        </svg>
        <span className="font-poppins text-sm font-semibold text-[#E5ECF6]">SPIDEYVERSE</span>
      </div>

      <h1 className="font-poppins text-2xl font-semibold text-[#E5ECF6] mb-1.5">Create your account</h1>
      <p className="text-sm text-[#64748B] mb-7">Start building your connected AI workforce.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-manrope font-medium text-[#94A3B8] mb-1.5">Full Name</label>
          <input type="text" placeholder="Jordan Pierce" className="sv-input w-full" required />
        </div>
        <div>
          <label className="block text-xs font-manrope font-medium text-[#94A3B8] mb-1.5">Work Email</label>
          <input type="email" placeholder="you@company.com" className="sv-input w-full" required />
        </div>
        <div>
          <label className="block text-xs font-manrope font-medium text-[#94A3B8] mb-1.5">Password</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              placeholder="Min. 8 characters"
              className="sv-input w-full pr-10"
              required
            />
            <button type="button" onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8] transition-colors">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full sv-btn-primary py-2.5 flex items-center justify-center gap-2 font-manrope font-semibold disabled:opacity-70 disabled:cursor-not-allowed mt-2">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
          ) : (
            <>Create Account <ArrowRight className="w-4 h-4" /></>
          )}
        </button>

        <p className="text-xs text-center text-[#4B5563] font-manrope">
          By creating an account, you agree to our{" "}
          <Link href="#" className="text-[#64748B] hover:text-[#94A3B8] transition-colors underline">Terms of Service</Link>
          {" "}and{" "}
          <Link href="#" className="text-[#64748B] hover:text-[#94A3B8] transition-colors underline">Privacy Policy</Link>.
        </p>
      </form>

      <p className="text-center text-xs text-[#64748B] mt-6 font-manrope">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
