"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Move to 2FA verification step (Image 1)
    router.push("/login/verify");
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-on-surface flex flex-col md:flex-row">
      {/* Left Column (Branding & Stats) */}
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

        {/* Description */}
        <div className="my-12 md:my-0 space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-on-surface leading-tight">
            Next-Generation Intelligence for <span className="text-primary">Financial Integrity.</span>
          </h2>
          <p className="text-body-sm text-on-surface-variant leading-relaxed max-w-sm">
            Real-time transaction monitoring and predictive risk assessment powered by the world's most advanced behavioral graph network.
          </p>
        </div>

        {/* Stats widgets */}
        <div className="grid grid-cols-3 gap-4 pt-8 border-t border-outline-variant/10">
          <div className="p-3 bg-[#0d0f19] border border-outline-variant/20 rounded-xl">
            <div className="font-label-mono text-base font-bold text-primary">1.2B+</div>
            <div className="text-[8px] text-on-surface-variant uppercase font-bold tracking-wider leading-tight mt-1">
              Transactions Protected
            </div>
          </div>
          <div className="p-3 bg-[#0d0f19] border border-outline-variant/20 rounded-xl">
            <div className="font-label-mono text-base font-bold text-primary">99.9%</div>
            <div className="text-[8px] text-on-surface-variant uppercase font-bold tracking-wider leading-tight mt-1">
              Risk Accuracy
            </div>
          </div>
          <div className="p-3 bg-[#0d0f19] border border-outline-variant/20 rounded-xl">
            <div className="font-label-mono text-base font-bold text-primary">24/7</div>
            <div className="text-[8px] text-on-surface-variant uppercase font-bold tracking-wider leading-tight mt-1">
              Active Monitoring
            </div>
          </div>
        </div>

        <div className="text-[9px] font-label-mono text-on-surface-variant/40 mt-8 md:mt-0 uppercase tracking-widest">
          ———— SENTINEL DEFENSE SYSTEMS ECOSYSTEM
        </div>
      </div>

      {/* Right Column (Sign In Form) */}
      <div className="flex-1 p-8 md:p-24 flex flex-col justify-between bg-[#07090e]">
        <div />

        {/* Form panel */}
        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-on-surface">Access Control</h1>
            <p className="text-body-sm text-on-surface-variant">
              Enter your credentials to access the engine.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Work email input */}
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

            {/* Password input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                  System Password
                </label>
                <Link
                  href="/forgot-password"
                  className="font-label-mono text-[9px] text-primary hover:underline uppercase tracking-wider"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base hover:text-primary transition-colors"
                >
                  {showPassword ? "visibility_off" : "visibility"}
                </button>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3.5 pr-12 text-body-sm text-on-surface focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            {/* Maintain session Checkbox */}
            <div className="flex items-center gap-3 select-none">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant/30 bg-[#0c0e17] text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="remember" className="text-body-sm text-on-surface-variant cursor-pointer">
                Maintain session for 12 hours
              </label>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-[#2563eb] text-white font-bold text-body-sm hover:opacity-90 transition-opacity"
            >
              Sign In
            </button>
          </form>

          {/* SSO Options */}
          <div className="space-y-4">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-outline-variant/10"></div>
              <span className="flex-shrink mx-4 font-label-mono text-[9px] text-on-surface-variant/60 uppercase tracking-widest">
                Enterprise SSO
              </span>
              <div className="flex-grow border-t border-outline-variant/10"></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => router.push("/login/verify")}
                className="p-3 border border-outline-variant/20 rounded-xl bg-[#0c0e17] hover:bg-surface-container-high transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">key</span>
              </button>
              <button
                onClick={() => router.push("/login/verify")}
                className="p-3 border border-outline-variant/20 rounded-xl bg-[#0c0e17] hover:bg-surface-container-high transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">vpn_key</span>
              </button>
              <button
                onClick={() => router.push("/login/verify")}
                className="p-3 border border-outline-variant/20 rounded-xl bg-[#0c0e17] hover:bg-surface-container-high transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">fingerprint</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-caption text-on-surface-variant/60 font-label-mono pt-12 border-t border-outline-variant/10 max-w-md w-full mx-auto">
          <div className="flex gap-6">
            <a className="hover:text-primary transition-colors" href="#">Support Center</a>
            <a className="hover:text-primary transition-colors" href="#">Security Audit</a>
            <a className="hover:text-primary transition-colors" href="#">Terms</a>
          </div>
          <div>© 2026 SENTINEL DEFENSE SYSTEMS.</div>
        </div>
      </div>
    </div>
  );
}
