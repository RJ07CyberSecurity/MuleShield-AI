"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/useAuthStore";
import { apiClient } from "../../services/api-client";

function storeAuthTokens(access_token: string, refresh_token: string) {
  localStorage.setItem("token", access_token);
  localStorage.setItem("refresh_token", refresh_token);
  document.cookie = `muleshield_token=${access_token}; path=/; max-age=900; SameSite=Strict`;
}

export default function SignupPage() {
  const router = useRouter();
  const initializeAuth = useAuthStore((state) => state.initialize);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("analyst");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ── Live Password Policy Criteria ──
  const isMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordValid = isMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const isConfirmMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isPasswordValid) {
      setError("Please fulfill all security password policy requirements.");
      return;
    }

    if (!isConfirmMatch) {
      setError("Passwords do not match. Please re-enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post<any>("/api/v1/auth/register", {
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phone,
        role,
        password,
      });

      if (response?.success) {
        setSuccessMessage("Account created successfully! Launching software workspace...");
        
        // Auto-login to obtain session tokens
        try {
          const loginRes = await apiClient.post<any>("/api/v1/auth/login", {
            email,
            password,
          });

          if (loginRes?.success && loginRes.data?.access_token) {
            storeAuthTokens(loginRes.data.access_token, loginRes.data.refresh_token);
            await initializeAuth();
            router.push("/dashboard");
            return;
          }
        } catch {
          // If auto-login fails, redirect to login
        }
        
        router.push("/login");
      } else {
        setError(response?.message || "Registration failed. Please check your details.");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Email may already be registered.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-on-surface flex flex-col md:flex-row relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-[#07090e]/85 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-center space-y-2">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-widest animate-pulse">
              Provisioning Security Profile
            </h3>
            <p className="text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider animate-pulse">
              Registering staff credentials...
            </p>
          </div>
        </div>
      )}

      {/* Left Column (Branding) */}
      <div className="w-full md:w-[45%] bg-[#090b12] border-r border-outline-variant/10 p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-3 select-none">
          <img
            src="/muleshield-logo.jpg"
            alt="MuleShield AI"
            className="w-10 h-10 object-contain rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] flex-shrink-0"
          />
          <span className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight uppercase">
            MuleShield AI
          </span>
        </div>

        <div className="my-12 md:my-0 space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-on-surface leading-tight">
            Join the Next-Generation of <br />
            <span className="text-primary">Financial Integrity.</span>
          </h2>
          <p className="text-body-sm text-on-surface-variant leading-relaxed max-w-sm">
            Create your analyst identity to access real-time transaction monitoring and money mule detection.
          </p>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
            <div className="text-[10px] font-label-mono text-primary font-bold uppercase tracking-wider">
              Password Policy Enforcement
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              All compliance staff accounts must maintain 8+ chars with uppercase, lowercase, numbers, and symbols.
            </p>
          </div>
        </div>

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
              Active Surveillance
            </div>
          </div>
        </div>

        <div className="text-[9px] font-label-mono text-on-surface-variant/40 mt-8 md:mt-0 uppercase tracking-widest">
          ———— MULESHIELD AI ENTERPRISE SUITE
        </div>
      </div>

      {/* Right Column (Registration Form) */}
      <div className="flex-1 p-8 md:p-16 flex flex-col justify-center bg-[#07090e] overflow-y-auto">
        <div className="max-w-lg w-full mx-auto space-y-6" suppressHydrationWarning>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-on-surface">Create Account</h1>
            <p className="text-body-sm text-on-surface-variant">
              Register a new compliance analyst or risk officer account.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5" suppressHydrationWarning>
            {error && (
              <div className="p-4 bg-[#2a1215] border border-[#f5c2c7]/20 rounded-xl text-[#ea868f] text-xs">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl text-primary text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{successMessage}</span>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  suppressHydrationWarning
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3 text-body-sm text-on-surface focus:outline-none focus:border-primary/50 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  suppressHydrationWarning
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3 text-body-sm text-on-surface focus:outline-none focus:border-primary/50 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Work Email & Phone Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                  Work Email Address *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    suppressHydrationWarning
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@muleshield.ai"
                    className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3 pr-10 text-body-sm text-on-surface focus:outline-none focus:border-primary/50 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                  Contact Phone Number *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    call
                  </span>
                  <input
                    type="tel"
                    required
                    disabled={isLoading}
                    suppressHydrationWarning
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (415) 555-0192"
                    className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3 pr-10 text-body-sm text-on-surface focus:outline-none focus:border-primary/50 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Department Role */}
            <div className="space-y-1.5">
              <label className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                Assigned Staff Role *
              </label>
              <select
                disabled={isLoading}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3 text-body-sm text-on-surface focus:outline-none focus:border-primary/50 disabled:opacity-50"
              >
                <option value="analyst">Compliance Analyst (Case & Investigation View)</option>
                <option value="investigator">Senior Forensic Investigator</option>
                <option value="risk_officer">Risk & SAR Compliance Officer</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                  Password *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {showPassword ? "visibility_off" : "visibility"}
                  </button>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3 pr-10 text-body-sm text-on-surface focus:outline-none focus:border-primary/50 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3 text-body-sm text-on-surface focus:outline-none focus:border-primary/50 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Live Password Policy Checklist */}
            <div className="p-3.5 bg-[#0c0e17] border border-outline-variant/20 rounded-xl space-y-2">
              <div className="text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
                Password Policy Requirements
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-label-mono">
                <div className={`flex items-center gap-1.5 ${isMinLength ? "text-risk-low" : "text-on-surface-variant/50"}`}>
                  <span className="material-symbols-outlined text-xs">{isMinLength ? "check_circle" : "cancel"}</span>
                  <span>8+ Characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? "text-risk-low" : "text-on-surface-variant/50"}`}>
                  <span className="material-symbols-outlined text-xs">{hasUpper ? "check_circle" : "cancel"}</span>
                  <span>Uppercase (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? "text-risk-low" : "text-on-surface-variant/50"}`}>
                  <span className="material-symbols-outlined text-xs">{hasLower ? "check_circle" : "cancel"}</span>
                  <span>Lowercase (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? "text-risk-low" : "text-on-surface-variant/50"}`}>
                  <span className="material-symbols-outlined text-xs">{hasNumber ? "check_circle" : "cancel"}</span>
                  <span>Number (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? "text-risk-low" : "text-on-surface-variant/50"}`}>
                  <span className="material-symbols-outlined text-xs">{hasSpecial ? "check_circle" : "cancel"}</span>
                  <span>Special (!@#$)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${isConfirmMatch ? "text-risk-low" : "text-on-surface-variant/50"}`}>
                  <span className="material-symbols-outlined text-xs">{isConfirmMatch ? "check_circle" : "cancel"}</span>
                  <span>Passwords Match</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isPasswordValid || !isConfirmMatch}
              suppressHydrationWarning
              className="w-full py-4 rounded-xl bg-[#2563eb] text-white font-bold text-body-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Login CTA */}
          <p className="text-center text-body-sm text-on-surface-variant pt-2">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
