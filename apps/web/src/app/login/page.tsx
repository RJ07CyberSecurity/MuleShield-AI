"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "../../services/api-client";
import {
  signInWithGoogle,
  signInWithGithub,
  auth,
  createRecaptchaVerifier,
  sendOtpToPhone,
} from "../../services/firebase";

// Helper: store tokens and set cookie for middleware route protection
function storeAuthTokens(access_token: string, refresh_token: string) {
  localStorage.setItem("token", access_token);
  localStorage.setItem("refresh_token", refresh_token);
  // Mirror token in cookie for Next.js Edge Middleware (max-age = 15 min, same as JWT)
  document.cookie = `muleshield_token=${access_token}; path=/; max-age=900; SameSite=Strict`;
}

export default function LoginPage() {
  const router = useRouter();

  // Login modes: "email" | "phone" | "direct"
  const [loginMethod, setLoginMethod] = useState<"email" | "phone" | "direct">("direct");

  // Email/Firebase state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any | null>(null);

  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Clear states on method switch
  useEffect(() => {
    setError(null);
    setOtpSent(false);
    setOtp("");
    setConfirmationResult(null);
  }, [loginMethod]);

  // ── Direct DB Login (no Firebase) ──
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await apiClient.post<any>("/api/v1/auth/login", {
        email,
        password,
      });
      if (response?.success && response?.data?.access_token) {
        storeAuthTokens(response.data.access_token, response.data.refresh_token);
        router.push("/dashboard");
      } else {
        setError(response?.message || "Invalid email or password.");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Firebase SSO ──
  const handleFirebaseSSO = async (ssoType: "google" | "github") => {
    setError(null);
    setIsLoading(true);
    try {
      const { idToken } =
        ssoType === "google"
          ? await signInWithGoogle()
          : await signInWithGithub();
      const response = await apiClient.post<any>("/api/v1/auth/firebase-login", {
        id_token: idToken,
      });
      if (response?.success) {
        storeAuthTokens(response.data.access_token, response.data.refresh_token);
        router.push("/dashboard");
      } else {
        setError(response?.message || "SSO Sign-In failed");
      }
    } catch (err: any) {
      setError(
        err.message ||
          `${ssoType === "google" ? "Google" : "GitHub"} Sign-In canceled or failed.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Firebase Email Login ──
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      const response = await apiClient.post<any>("/api/v1/auth/firebase-login", {
        id_token: idToken,
      });

      if (response?.success) {
        storeAuthTokens(response.data.access_token, response.data.refresh_token);
        router.push("/dashboard");
      } else {
        setError(response?.message || "Firebase session registration failed");
      }
    } catch (err: any) {
      setError(err.message || "Invalid email/password credentials via Firebase Auth.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Phone OTP ──
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError("Please enter a valid phone number including country code.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const verifier = createRecaptchaVerifier("recaptcha-container");
      const confirmResult = await sendOtpToPhone(phoneNumber.trim(), verifier);
      setConfirmationResult(confirmResult);
      setOtpSent(true);
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to send verification code. Please make sure the number format is valid (e.g. +14155552671)."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !confirmationResult) {
      setError("Please enter the verification code.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(otp.trim());
      const idToken = await userCredential.user.getIdToken();

      const response = await apiClient.post<any>("/api/v1/auth/firebase-login", {
        id_token: idToken,
      });

      if (response?.success) {
        storeAuthTokens(response.data.access_token, response.data.refresh_token);
        router.push("/dashboard");
      } else {
        setError(response?.message || "Firebase session registration failed");
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
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
              Securing Session Gateway
            </h3>
            <p className="text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider animate-pulse">
              Authenticating credentials...
            </p>
          </div>
        </div>
      )}

      {/* Left Column (Branding) */}
      <div className="w-full md:w-[45%] bg-[#090b12] border-r border-outline-variant/10 p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary font-bold text-3xl">shield</span>
          <span className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight uppercase">
            MuleShield AI
          </span>
        </div>

        <div className="my-12 md:my-0 space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-on-surface leading-tight">
            Next-Generation Intelligence for{" "}
            <span className="text-primary">Financial Integrity.</span>
          </h2>
          <p className="text-body-sm text-on-surface-variant leading-relaxed max-w-sm">
            Real-time transaction monitoring and predictive risk assessment powered by the
            world's most advanced behavioral graph network.
          </p>

          {/* Quick credentials hint */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-1.5">
            <div className="text-[9px] font-label-mono text-primary uppercase tracking-widest font-bold">
              Demo Credentials
            </div>
            <div className="font-label-mono text-xs text-on-surface">
              analyst@muleshield.ai
            </div>
            <div className="font-label-mono text-xs text-on-surface-variant">
              password123
            </div>
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

        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-on-surface">Access Control</h1>
            <p className="text-body-sm text-on-surface-variant">
              Enter your credentials to access the compliance engine.
            </p>
          </div>

          {/* Tab selectors */}
          <div className="flex border-b border-outline-variant/10 mb-6">
            {(["direct", "email", "phone"] as const).map((method) => (
              <button
                key={method}
                type="button"
                disabled={isLoading}
                onClick={() => setLoginMethod(method)}
                className={`flex-1 pb-3 text-xs font-label-mono uppercase tracking-wider font-bold border-b-2 transition-all ${
                  loginMethod === method
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface disabled:opacity-50"
                }`}
              >
                {method === "direct" ? "Direct Login" : method === "email" ? "Firebase Email" : "Phone OTP"}
              </button>
            ))}
          </div>

          {/* ── Direct DB Login Form ── */}
          {loginMethod === "direct" && (
            <form onSubmit={handleDirectLogin} className="space-y-6">
              {error && (
                <div className="p-4 bg-[#2a1215] border border-[#f5c2c7]/20 rounded-xl text-[#ea868f] text-xs">
                  {error}
                </div>
              )}
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
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@muleshield.ai"
                    className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3.5 pr-12 text-body-sm text-on-surface focus:outline-none focus:border-primary/50 disabled:opacity-50"
                  />
                </div>
              </div>

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
                    disabled={isLoading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base hover:text-primary transition-colors disabled:opacity-50"
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
                    className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3.5 pr-12 text-body-sm text-on-surface focus:outline-none focus:border-primary/50 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 select-none">
                <input
                  type="checkbox"
                  id="remember"
                  disabled={isLoading}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-outline-variant/30 bg-[#0c0e17] text-primary focus:ring-0 cursor-pointer disabled:opacity-50"
                />
                <label htmlFor="remember" className="text-body-sm text-on-surface-variant cursor-pointer">
                  Maintain session for 12 hours
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-[#2563eb] text-white font-bold text-body-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          )}

          {/* ── Firebase Email Form ── */}
          {loginMethod === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-[#2a1215] border border-[#f5c2c7]/20 rounded-xl text-[#ea868f] text-xs">
                  {error}
                </div>
              )}
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
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3.5 pr-12 text-body-sm text-on-surface focus:outline-none focus:border-primary/50 disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                  System Password
                </label>
                <div className="relative">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base hover:text-primary transition-colors"
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
                    className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3.5 pr-12 text-body-sm text-on-surface focus:outline-none focus:border-primary/50 disabled:opacity-50"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-[#2563eb] text-white font-bold text-body-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading ? "Signing In..." : "Sign In via Firebase"}
              </button>
            </form>
          )}

          {/* ── Phone OTP Form ── */}
          {loginMethod === "phone" && (
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-6">
              {error && (
                <div className="p-4 bg-[#2a1215] border border-[#f5c2c7]/20 rounded-xl text-[#ea868f] text-xs">
                  {error}
                </div>
              )}
              {!otpSent ? (
                <div className="space-y-2">
                  <label className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                      call
                    </span>
                    <input
                      type="tel"
                      required
                      disabled={isLoading}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+14155552671"
                      className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3.5 pr-12 text-body-sm text-on-surface focus:outline-none focus:border-primary/50 disabled:opacity-50"
                    />
                  </div>
                  <p className="text-[10px] text-on-surface-variant/70 leading-normal">
                    Enter your complete phone number including country code (e.g. +91 for India).
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                    Verification OTP Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      disabled={isLoading}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="6-digit code"
                      className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3.5 pr-12 text-body-sm text-on-surface focus:outline-none focus:border-primary/50 disabled:opacity-50 text-center tracking-widest font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <span className="text-on-surface-variant">Code sent to {phoneNumber}</span>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-primary hover:underline font-bold"
                    >
                      Change Number
                    </button>
                  </div>
                </div>
              )}
              <div id="recaptcha-container" className="my-2 flex justify-center"></div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-[#2563eb] text-white font-bold text-body-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading
                  ? "Processing..."
                  : otpSent
                  ? "Verify OTP Code"
                  : "Send Verification Code"}
              </button>
            </form>
          )}

          {/* Enterprise SSO Options */}
          <div className="space-y-4">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-outline-variant/10"></div>
              <span className="flex-shrink mx-4 font-label-mono text-[9px] text-on-surface-variant/60 uppercase tracking-widest">
                Enterprise SSO
              </span>
              <div className="flex-grow border-t border-outline-variant/10"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleFirebaseSSO("google")}
                className="p-3 border border-outline-variant/20 rounded-xl bg-[#0c0e17] hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 font-bold text-xs disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.42 7.5l3.79 2.94C6.1 7.57 8.82 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.55z" />
                  <path fill="#FBBC05" d="M5.21 10.44c-.25-.75-.4-1.56-.4-2.44s.15-1.69.4-2.44L1.42 2.62C.51 4.44 0 6.47 0 8.6c0 2.13.51 4.16 1.42 5.98l3.79-2.94z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.9 1.09-3.18 0-5.9-2.53-6.79-5.4L1.42 16.14C3.37 19.98 7.35 23 12 23z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleFirebaseSSO("github")}
                className="p-3 border border-outline-variant/20 rounded-xl bg-[#0c0e17] hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 font-bold text-xs disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                GitHub
              </button>
            </div>
          </div>
        </div>

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
