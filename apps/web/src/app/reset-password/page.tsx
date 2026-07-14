"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Requirements checks
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const calculateEntropy = () => {
    if (!newPassword) return 0;
    let poolSize = 0;
    if (hasLowercase) poolSize += 26;
    if (hasUppercase) poolSize += 26;
    if (hasNumber) poolSize += 10;
    if (hasSpecial) poolSize += 32;
    return Math.round(newPassword.length * Math.log2(poolSize));
  };

  const entropy = calculateEntropy();

  const getStrengthText = () => {
    if (entropy === 0) return "EMPTY";
    if (entropy < 40) return "WEAK";
    if (entropy < 65) return "MEDIUM";
    return "STRONG";
  };

  const getStrengthColor = () => {
    const text = getStrengthText();
    if (text === "EMPTY") return "text-on-surface-variant";
    if (text === "WEAK") return "text-risk-critical";
    if (text === "MEDIUM") return "text-risk-medium";
    return "text-risk-low";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasLowercase || !hasUppercase || !hasNumber || !hasSpecial || newPassword !== confirmPassword) {
      return;
    }
    // Success -> redirect back to login page
    alert("Password updated successfully. Please log in.");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-on-surface flex flex-col md:flex-row">
      {/* Left Column (Sentinel branding & statistics) */}
      <div className="w-full md:w-[45%] bg-[#090b12] border-r border-outline-variant/10 p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Glow background */}
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#2563eb]/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Logo */}
        <div className="flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary font-bold text-3xl">shield</span>
          <span className="font-label-mono text-sm text-on-surface uppercase tracking-widest font-extrabold">
            Sentinel Auth
          </span>
        </div>

        {/* Stats widgets */}
        <div className="grid grid-cols-1 gap-4 pt-8 border-t border-outline-variant/10">
          <div className="flex gap-4">
            <div className="flex-1 p-4 bg-[#0d0f19] border border-outline-variant/20 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider">
                <span className="material-symbols-outlined text-[10px] text-primary">insights</span>
                Auth Intelligence
              </div>
              <div className="text-lg font-bold text-on-surface">99.98%</div>
              <div className="text-[9px] font-label-mono text-risk-low font-bold uppercase tracking-wider">
                +0.02 Uptime
              </div>
            </div>

            <div className="flex-1 p-4 bg-[#0d0f19] border border-outline-variant/20 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider">
                <span className="material-symbols-outlined text-[10px] text-risk-high">share</span>
                Threat Vectors
              </div>
              <div className="text-lg font-bold text-risk-high">0.00</div>
              <div className="text-[9px] font-label-mono text-on-surface-variant/60 uppercase tracking-wider">
                Neutralized Active
              </div>
            </div>

            <div className="flex-1 p-4 bg-[#0d0f19] border border-outline-variant/20 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider">
                <span className="material-symbols-outlined text-[10px] text-primary">speed</span>
                Latency
              </div>
              <div className="text-lg font-bold text-on-surface">14ms</div>
              <div className="text-[9px] font-label-mono text-on-surface-variant/60 uppercase tracking-wider">
                Regional Global Avg
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (Password inputs) */}
      <div className="flex-1 p-8 md:p-24 flex flex-col justify-between bg-[#07090e]">
        <div />

        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-on-surface">Reset Password</h1>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              Enhance your account security with a strong, precision-generated credential.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New password input */}
            <div className="space-y-2">
              <label className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                New Password
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base hover:text-primary transition-colors"
                >
                  {showNew ? "visibility_off" : "visibility"}
                </button>
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3.5 pr-12 text-body-sm text-on-surface focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Strength and Entropy metrics */}
              <div className="flex justify-between items-center text-[10px] font-label-mono uppercase pt-1 px-1">
                <span>
                  Strength:{" "}
                  <span className={`font-bold ${getStrengthColor()}`}>{getStrengthText()}</span>
                </span>
                <span className="text-on-surface-variant">Entropy: {entropy} bits</span>
              </div>
            </div>

            {/* Confirm password input */}
            <div className="space-y-2">
              <label className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base hover:text-primary transition-colors"
                >
                  {showConfirm ? "visibility_off" : "visibility"}
                </button>
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3.5 pr-12 text-body-sm text-on-surface focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            {/* Password requirements list */}
            <div className="p-4 rounded-xl border border-outline-variant/20 bg-[#0c0e17] space-y-2">
              <div className="flex items-center gap-3 text-caption">
                <span className={`material-symbols-outlined text-base ${hasLowercase ? "text-risk-low" : "text-on-surface-variant/40"}`}>
                  {hasLowercase ? "check_circle" : "radio_button_unchecked"}
                </span>
                <span className={hasLowercase ? "text-on-surface" : "text-on-surface-variant"}>At least one lowercase letter</span>
              </div>
              <div className="flex items-center gap-3 text-caption">
                <span className={`material-symbols-outlined text-base ${hasUppercase ? "text-risk-low" : "text-on-surface-variant/40"}`}>
                  {hasUppercase ? "check_circle" : "radio_button_unchecked"}
                </span>
                <span className={hasUppercase ? "text-on-surface" : "text-on-surface-variant"}>At least one uppercase letter</span>
              </div>
              <div className="flex items-center gap-3 text-caption">
                <span className={`material-symbols-outlined text-base ${hasNumber ? "text-risk-low" : "text-on-surface-variant/40"}`}>
                  {hasNumber ? "check_circle" : "radio_button_unchecked"}
                </span>
                <span className={hasNumber ? "text-on-surface" : "text-on-surface-variant"}>At least one number</span>
              </div>
              <div className="flex items-center gap-3 text-caption">
                <span className={`material-symbols-outlined text-base ${hasSpecial ? "text-risk-low" : "text-on-surface-variant/40"}`}>
                  {hasSpecial ? "check_circle" : "radio_button_unchecked"}
                </span>
                <span className={hasSpecial ? "text-on-surface" : "text-on-surface-variant"}>At least one special character</span>
              </div>
            </div>

            {/* Update button */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-[#b4c5ff] text-[#002a78] font-bold text-body-sm hover:bg-[#b4c5ff]/90 transition-all flex items-center justify-center gap-2"
            >
              Update Password
              <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </button>
          </form>
        </div>

        <div className="text-center text-caption text-on-surface-variant font-label-mono pt-12">
          Having Issues?{" "}
          <Link href="/locked" className="text-primary hover:underline font-semibold">
            Contact System Support
          </Link>
        </div>
      </div>
    </div>
  );
}
