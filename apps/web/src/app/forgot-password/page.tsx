"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "../../services/api-client";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<any>("/api/v1/auth/forgot-password/send-link", {
        email: email
      });
      
      if (!response.success) {
        throw new Error(response.message || "Failed to send reset email.");
      }

      setIsSent(true);
      if (response.data && response.data.dev_link) {
        setDevLink(response.data.dev_link);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to request password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-on-surface flex flex-col md:flex-row">
      {/* Left Column (Branding & Stats Details) */}
      <div className="w-full md:w-[45%] bg-[#090b12] border-r border-outline-variant/10 p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Glow background */}
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Logo */}
        <div className="flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary font-bold text-3xl">shield</span>
          <span className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight uppercase">
            MuleShield AI
          </span>
        </div>

        {/* Stats card widgets */}
        <div className="my-12 md:my-0 space-y-6">
          <div className="p-5 bg-[#0d0f19] border border-outline-variant/20 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs font-label-mono">
              <span className="text-on-surface-variant uppercase font-bold tracking-wider">Network Integrity Scan</span>
              <span className="text-risk-low font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-risk-low animate-ping"></span>
                ACTIVE
              </span>
            </div>
            <div className="text-xl font-bold text-on-surface">99.98% Uptime Efficiency</div>
          </div>

          <div className="p-5 bg-[#0d0f19] border border-outline-variant/20 rounded-xl space-y-3">
            <div className="text-xs font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
              Nodes Analyzed
            </div>
            <div className="text-xl font-bold text-on-surface">1.2M+</div>
            {/* Progress bar */}
            <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden w-full">
              <div className="bg-[#2563eb] h-full rounded-full w-[82%]" />
            </div>
          </div>

          <div className="p-5 bg-[#0d0f19] border border-outline-variant/20 rounded-xl space-y-3">
            <div className="text-xs font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
              Threat Reaction
            </div>
            <div className="text-xl font-bold text-on-surface">&lt; 140ms</div>
            <div className="text-[9px] font-label-mono text-primary uppercase font-bold tracking-wider">
              Latency Optimized
            </div>
          </div>
        </div>

        {/* Bottom quotes */}
        <div>
          <p className="text-xs italic text-on-surface-variant max-w-sm leading-relaxed">
            "Precision-engineered intelligence for the next generation of financial defense."
          </p>
        </div>
      </div>

      {/* Right Column (Reset request form) */}
      <div className="flex-1 p-8 md:p-24 flex flex-col justify-between bg-[#07090e]">
        <div />

        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 flex gap-3 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-base">settings_backup_restore</span>
            <span>Reset credentials process logs.</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-on-surface">Reset Your Password</h1>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              Enter your work email to receive reset instructions.
            </p>
          </div>

          {isSent ? (
            <div className="space-y-6">
              <div className="p-6 bg-[#0c0e17] border border-primary/30 rounded-xl space-y-4 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="material-symbols-outlined text-primary text-2xl">mark_email_read</span>
                </div>
                <h2 className="text-xl font-bold text-on-surface">Check your email</h2>
                <p className="text-body-sm text-on-surface-variant">
                  We have sent a secure password reset link to <br/>
                  <span className="font-bold text-on-surface">{email}</span>.
                </p>
                <p className="text-xs text-on-surface-variant/60 italic pt-2">
                  Link expires in 15 minutes. If you don't see it, check your spam folder.
                </p>
              </div>

              {devLink && (
                <div className="p-4 bg-[#1a2318] border border-[#71966a]/30 rounded-xl text-center space-y-3">
                  <div className="text-[#84b07c] text-xs font-bold uppercase tracking-widest font-label-mono flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">developer_mode</span>
                    Dev Mode Active
                  </div>
                  <p className="text-xs text-[#a0cc98]">No SMTP server configured. Use the link below to verify:</p>
                  <Link 
                    href={devLink.replace("http://localhost:3000", "")} 
                    className="inline-block px-4 py-2 bg-[#84b07c]/20 hover:bg-[#84b07c]/30 text-[#84b07c] font-bold rounded-lg text-sm transition-colors break-all"
                  >
                    Reset Password
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-[#2a1215] border border-[#f5c2c7]/20 rounded-xl text-[#ea868f] text-xs">
                  {error}
                </div>
              )}
              {/* Email input */}
              <div className="space-y-2">
                <label className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                  Work Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3.5 pr-12 text-body-sm text-on-surface focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-[#2563eb] text-white font-bold text-body-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {isLoading ? "Sending Instructions..." : "Send Reset Link"}
                <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
              </button>
            </form>
          )}

          {/* Back link */}
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-caption text-on-surface-variant hover:text-on-surface font-semibold"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to Login
            </Link>
          </div>
        </div>

        {/* Footer links */}
        <div className="flex justify-center gap-6 text-caption text-on-surface-variant/60 font-label-mono pt-12 border-t border-outline-variant/10 max-w-md w-full mx-auto">
          <a className="hover:text-primary transition-colors" href="#">Support</a>
          <span>•</span>
          <a className="hover:text-primary transition-colors" href="#">Legal</a>
          <span>•</span>
          <a className="hover:text-primary transition-colors" href="#">System Status</a>
        </div>
      </div>
    </div>
  );
}
