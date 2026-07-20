"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "../../services/api-client";

function storeAuthTokens(access_token: string, refresh_token: string) {
  localStorage.setItem("token", access_token);
  localStorage.setItem("refresh_token", refresh_token);
  document.cookie = `muleshield_token=${access_token}; path=/; max-age=900; SameSite=Strict`;
}

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!agreed) {
      setError("You must accept the Terms of Service to continue.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post<any>("/api/v1/auth/register", {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (response?.success) {
        // Auto-login after successful registration
        const loginResponse = await apiClient.post<any>("/api/v1/auth/login", {
          email: email.trim().toLowerCase(),
          password,
        });

        if (loginResponse?.success && loginResponse?.data?.access_token) {
          storeAuthTokens(
            loginResponse.data.access_token,
            loginResponse.data.refresh_token
          );
          router.push("/dashboard");
        } else {
          // Registration succeeded but auto-login failed — send to login
          setSuccess(true);
        }
      } else {
        setError(response?.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    "w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3.5 pr-12 text-body-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/60 transition-colors disabled:opacity-50";
  const labelCls =
    "font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider";

  return (
    <div className="min-h-screen bg-[#07090e] text-on-surface flex flex-col md:flex-row relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-[#07090e]/85 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-center space-y-2">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-widest animate-pulse">
              Creating Your Account
            </h3>
            <p className="text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider animate-pulse">
              Securing credentials...
            </p>
          </div>
        </div>
      )}

      {/* ── Left branding column ── */}
      <div className="w-full md:w-[45%] bg-[#090b12] border-r border-outline-variant/10 p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary font-bold text-3xl">shield</span>
          <span className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight uppercase">
            MuleShield AI
          </span>
        </div>

        {/* Hero copy */}
        <div className="my-12 md:my-0 space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-on-surface leading-tight">
            Join the{" "}
            <span className="text-primary">Financial Crime Intelligence</span>{" "}
            Platform.
          </h2>
          <p className="text-body-sm text-on-surface-variant leading-relaxed max-w-sm">
            Create your analyst account and start monitoring transactions with
            real-time AI-powered risk detection — up and running in seconds.
          </p>

          {/* Feature chips */}
          <div className="space-y-3 pt-2">
            {[
              { icon: "radar", label: "Real-time transaction monitoring" },
              { icon: "hub", label: "Graph-linked mule network detection" },
              { icon: "lock", label: "Role-based access & MFA ready" },
            ].map(({ icon, label }) => (
              <div key={icon} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-base">{icon}</span>
                </div>
                <span className="text-body-sm text-on-surface-variant">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-8 border-t border-outline-variant/10">
          {[
            { value: "1.2B+", label: "Transactions Protected" },
            { value: "99.9%", label: "Risk Accuracy" },
            { value: "24/7", label: "Active Monitoring" },
          ].map(({ value, label }) => (
            <div key={value} className="p-3 bg-[#0d0f19] border border-outline-variant/20 rounded-xl">
              <div className="font-label-mono text-base font-bold text-primary">{value}</div>
              <div className="text-[8px] text-on-surface-variant uppercase font-bold tracking-wider leading-tight mt-1">
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="text-[9px] font-label-mono text-on-surface-variant/40 mt-8 md:mt-0 uppercase tracking-widest">
          ———— SENTINEL DEFENSE SYSTEMS ECOSYSTEM
        </div>
      </div>

      {/* ── Right form column ── */}
      <div className="flex-1 p-8 md:p-16 flex flex-col justify-between bg-[#07090e] overflow-y-auto">
        <div />

        <div className="max-w-md w-full mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-on-surface">Create Account</h1>
            <p className="text-body-sm text-on-surface-variant">
              Register your analyst credentials to access the platform.
            </p>
          </div>

          {/* Success banner (if auto-login failed) */}
          {success && (
            <div className="p-4 bg-emerald-900/30 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm space-y-2">
              <div className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                Account created successfully!
              </div>
              <p className="text-xs text-emerald-300/80">
                Your account is ready.{" "}
                <Link href="/login" className="underline font-bold hover:text-emerald-200">
                  Sign in now →
                </Link>
              </p>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="p-4 bg-[#2a1215] border border-[#f5c2c7]/20 rounded-xl text-[#ea868f] text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5">error</span>
              {error}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelCls}>First Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                      badge
                    </span>
                    <input
                      type="text"
                      required
                      disabled={isLoading}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Last Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                      badge
                    </span>
                    <input
                      type="text"
                      required
                      disabled={isLoading}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className={labelCls}>Work Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@muleshield.ai"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className={labelCls}>Password <span className="text-on-surface-variant/50 normal-case font-normal">(min 8 chars)</span></label>
                <div className="relative">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {showPassword ? "visibility_off" : "visibility"}
                  </button>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </div>
                {/* Password strength bar */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4].map((i) => {
                        const strength =
                          password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)
                            ? 4
                            : password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                            ? 3
                            : password.length >= 8
                            ? 2
                            : 1;
                        return (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-all ${
                              i <= strength
                                ? strength >= 4 ? "bg-emerald-500" : strength >= 3 ? "bg-yellow-400" : strength >= 2 ? "bg-orange-400" : "bg-red-500"
                                : "bg-outline-variant/20"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-on-surface-variant/60">
                      {password.length < 8 ? "Too short" : password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? "Strong — great!" : password.length >= 10 && /[A-Z]/.test(password) ? "Good strength" : "Add uppercase, numbers & symbols for stronger password"}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className={labelCls}>Confirm Password</label>
                <div className="relative">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {showConfirm ? "visibility_off" : "visibility"}
                  </button>
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    disabled={isLoading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls} ${
                      confirmPassword.length > 0
                        ? confirmPassword === password
                          ? "border-emerald-500/50 focus:border-emerald-500/80"
                          : "border-red-500/50 focus:border-red-500/80"
                        : ""
                    }`}
                  />
                  {confirmPassword.length > 0 && (
                    <span
                      className={`material-symbols-outlined absolute right-10 top-1/2 -translate-y-1/2 text-base ${
                        confirmPassword === password ? "text-emerald-500" : "text-red-400"
                      }`}
                    >
                      {confirmPassword === password ? "check_circle" : "cancel"}
                    </span>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 select-none">
                <input
                  type="checkbox"
                  id="terms"
                  disabled={isLoading}
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-outline-variant/30 bg-[#0c0e17] text-primary focus:ring-0 cursor-pointer flex-shrink-0 disabled:opacity-50"
                />
                <label htmlFor="terms" className="text-[11px] text-on-surface-variant cursor-pointer leading-relaxed">
                  I agree to the MuleShield AI{" "}
                  <a href="#" className="text-primary hover:underline font-bold">Terms of Service</a>{" "}
                  and{" "}
                  <a href="#" className="text-primary hover:underline font-bold">Privacy Policy</a>.
                  This platform is restricted to authorised compliance personnel.
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !agreed}
                className="w-full py-4 rounded-xl bg-[#2563eb] text-white font-bold text-body-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                {isLoading ? "Creating Account…" : "Create Account"}
              </button>
            </form>
          )}

          {/* Login link */}
          <p className="text-center text-body-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-caption text-on-surface-variant/60 font-label-mono pt-12 border-t border-outline-variant/10 max-w-md w-full mx-auto mt-12">
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
