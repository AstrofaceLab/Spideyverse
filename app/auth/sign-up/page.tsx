"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { signUp } from "../actions";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get("error");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (errorMsg) {
      setLocalError(decodeURIComponent(errorMsg));
    }
  }, [errorMsg]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);

    const formData = new FormData(e.currentTarget);
    try {
      await signUp(formData);
    } catch (err) {
      setLocalError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

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

      {localError && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{localError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-manrope font-medium text-[#94A3B8] mb-1.5">Full Name</label>
          <input name="fullName" type="text" placeholder="Jordan Pierce" className="sv-input w-full" required disabled={loading} />
        </div>
        <div>
          <label className="block text-xs font-manrope font-medium text-[#94A3B8] mb-1.5">Work Email</label>
          <input name="email" type="email" placeholder="you@company.com" className="sv-input w-full" required disabled={loading} />
        </div>
        <div>
          <label className="block text-xs font-manrope font-medium text-[#94A3B8] mb-1.5">Password</label>
          <div className="relative">
            <input
              name="password"
              type={show ? "text" : "password"}
              placeholder="Min. 8 characters"
              className="sv-input w-full pr-10"
              required
              disabled={loading}
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
