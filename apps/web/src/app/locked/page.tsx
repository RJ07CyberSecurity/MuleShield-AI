"use client";

import Link from "next/link";

export default function LockedPage() {
  const handleSupportContact = () => {
    alert("Support request ticket generated. A compliance lead will contact you shortly.");
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-on-surface flex flex-col justify-between items-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-risk-high/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header bar */}
      <header className="w-full max-w-7xl flex items-center justify-between py-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary font-bold text-3xl">shield</span>
          <span className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight uppercase">
            MuleShield AI
          </span>
        </div>
        <div className="font-label-mono text-[9px] text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-risk-low"></span>
          System Monitoring: Operational
        </div>
      </header>

      {/* Main Locked Card */}
      <main className="w-full max-w-lg p-8 md:p-12 rounded-3xl bg-[#0a0d17] border-2 border-risk-high/30 shadow-2xl space-y-8 relative z-10 hover:border-risk-high/50 transition-all duration-300">
        <div className="text-center space-y-6">
          {/* Warning Icon */}
          <div className="w-16 h-16 rounded-2xl bg-risk-high/15 border border-risk-high/30 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-risk-high text-3xl font-semibold">lock</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface leading-tight">
            Security Alert: <br />
            <span className="text-risk-high">Account Locked</span>
          </h1>

          {/* Description */}
          <p className="text-body-sm text-on-surface-variant leading-relaxed text-center max-w-sm mx-auto">
            Too many failed login attempts. For your security, this account has been temporarily locked. Please contact your system administrator or verify your identity to unlock.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-4 pt-4 border-t border-outline-variant/10">
          <button
            onClick={handleSupportContact}
            className="w-full py-4 rounded-xl bg-[#b4c5ff] text-[#002a78] font-bold text-body-sm hover:bg-[#b4c5ff]/90 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">support_agent</span>
            Contact Security Support
          </button>

          <Link
            href="/"
            className="w-full text-center block py-4 rounded-xl border border-outline/30 text-on-surface font-bold text-body-sm hover:bg-white/5 transition-all"
          >
            Back to Home
          </Link>
        </div>

        {/* Error identifier info */}
        <div className="flex justify-between items-center text-[10px] font-label-mono uppercase pt-2 text-on-surface-variant/40">
          <span>Error Code</span>
          <span className="font-bold text-risk-high">ERR_AUTH_LOCKED_V4</span>
        </div>
      </main>

      {/* Footer bar */}
      <footer className="w-full text-center text-caption text-on-surface-variant/40 font-label-mono py-4 border-t border-outline-variant/10 mt-8">
        © 2026 SENTINEL DEFENSE SYSTEMS. ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
}
