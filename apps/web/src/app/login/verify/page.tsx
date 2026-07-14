"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [attempts, setAttempts] = useState(0);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Focus the first input on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return; // only allow numbers

    const newDigits = [...digits];
    newDigits[index] = value.substring(value.length - 1); // Keep last character only
    setDigits(newDigits);

    // Automatically shift focus to next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        // Clear previous input and focus it
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
        inputRefs.current[index - 1].focus();
      } else if (digits[index]) {
        // Clear current input
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < 6) return;

    setAttempts((prev) => prev + 1);

    // Simulated check: If they fail too many times, lock the account (Image 5)
    if (attempts >= 2) {
      router.push("/locked");
    } else {
      // Direct navigation to Dashboard
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-on-surface flex flex-col md:flex-row">
      {/* Left Column (Sentinel Auth branding & risk widgets) */}
      <div className="w-full md:w-[45%] bg-[#090b12] border-r border-outline-variant/10 p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Glow background */}
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#2563eb]/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand */}
        <div className="font-label-mono text-sm text-on-surface uppercase tracking-widest font-extrabold select-none">
          Sentinel Auth
        </div>

        {/* Middle text */}
        <div className="my-12 md:my-0 space-y-6">
          <h3 className="font-headline-sm text-base text-on-surface uppercase tracking-wider font-bold">
            Neural Risk Analysis
          </h3>
          <p className="text-body-sm text-on-surface-variant leading-relaxed max-w-sm">
            MuleShield AI continuously monitors node connections to prevent illegal financial structuring.
          </p>
        </div>

        {/* Stats widgets */}
        <div className="grid grid-cols-1 gap-4 pt-8 border-t border-outline-variant/10">
          <div className="flex gap-4">
            <div className="flex-1 p-4 bg-[#0d0f19] border border-outline-variant/20 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider">
                <span className="material-symbols-outlined text-[10px] text-primary">hub</span>
                Node_Density
              </div>
              <div className="text-lg font-bold text-on-surface">94.2%</div>
              <div className="text-[9px] font-label-mono text-risk-low font-bold uppercase tracking-wider">
                +0.42% Stable
              </div>
            </div>

            <div className="flex-1 p-4 bg-[#0d0f19] border border-outline-variant/20 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider">
                <span className="material-symbols-outlined text-[10px] text-risk-high">warning</span>
                Anomaly_Index
              </div>
              <div className="text-lg font-bold text-risk-high">0.032</div>
              <div className="text-[9px] font-label-mono text-on-surface-variant/60 uppercase tracking-wider">
                Latest Triage
              </div>
            </div>

            <div className="flex-1 p-4 bg-[#0d0f19] border border-outline-variant/20 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider">
                <span className="material-symbols-outlined text-[10px] text-primary">security</span>
                Protocol
              </div>
              <div className="text-lg font-bold text-on-surface font-label-mono">SHA-512</div>
              <div className="text-[9px] font-label-mono text-on-surface-variant/60 uppercase tracking-wider">
                Encryption Active
              </div>
            </div>
          </div>
        </div>

        <div className="text-[8px] font-label-mono text-on-surface-variant/40 mt-8 md:mt-0 uppercase tracking-widest">
          © 2026 SENTINEL DEFENSE SYSTEMS. ALL RIGHTS RESERVED.
        </div>
      </div>

      {/* Right Column (Verification form) */}
      <div className="flex-1 p-8 md:p-24 flex flex-col justify-between bg-[#07090e]">
        <div />

        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-on-surface">Security Verification</h1>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              Enter the 6-digit code from your authenticator app to secure your access.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Digit inputs */}
            <div className="flex justify-between items-center gap-2 md:gap-3">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  required
                  value={digit}
                  ref={(el) => {
                    if (el) inputRefs.current[index] = el;
                  }}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-16 md:w-14 md:h-20 bg-[#0c0e17] border border-outline-variant/30 rounded-xl text-center text-xl font-bold text-on-surface focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
                />
              ))}
            </div>

            {/* Verify button */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-[#b4c5ff] text-[#002a78] font-bold text-body-sm hover:bg-[#b4c5ff]/90 transition-all flex items-center justify-center gap-2"
            >
              Verify Identity
              <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </button>
          </form>

          {/* Try another method */}
          <div className="space-y-4 text-center">
            <button
              onClick={() => router.push("/locked")}
              className="text-on-surface-variant hover:text-on-surface text-caption uppercase tracking-wider font-bold flex items-center gap-2 mx-auto"
            >
              <span className="material-symbols-outlined text-base">forum</span>
              Try Another Method
            </button>

            <div className="flex items-center justify-center gap-3 text-[10px] font-label-mono text-on-surface-variant/60 uppercase tracking-widest pt-2">
              <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => alert("SMS OTP code triggered.")}>
                SMS Verification
              </span>
              <span>•</span>
              <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => router.push("/forgot-password")}>
                Recovery Code
              </span>
            </div>
          </div>
        </div>

        <div className="text-center text-caption text-on-surface-variant font-label-mono pt-12">
          Lost access?{" "}
          <Link href="/locked" className="text-primary hover:underline font-semibold">
            Contact System Administrator
          </Link>
        </div>
      </div>
    </div>
  );
}
