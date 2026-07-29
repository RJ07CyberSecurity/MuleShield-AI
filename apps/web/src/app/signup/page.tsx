"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "../../services/api-client";

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await apiClient.post<any>("/api/v1/auth/register", {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });
      if (response?.success) {
        // Redirect to login after successful signup
        router.push("/login");
      } else {
        setError(response?.message || "Registration failed.");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
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
              Provisioning Identity
            </h3>
            <p className="text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider animate-pulse">
              Creating account securely...
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
            Join the Next-Generation of <br />
            <span className="text-primary">Financial Integrity.</span>
          </h2>
          <p className="text-body-sm text-on-surface-variant leading-relaxed max-w-sm">
            Create an account to access the world's most advanced behavioral graph network for real-time transaction monitoring.
          </p>
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

      {/* Right Column (Sign Up Form) */}
      <div className="flex-1 p-8 md:p-24 flex flex-col justify-center bg-[#07090e]">
        <div className="max-w-md w-full mx-auto space-y-8" suppressHydrationWarning>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-on-surface">Create Account</h1>
            <p className="text-body-sm text-on-surface-variant">
              Register a new user identity in the compliance engine.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6" suppressHydrationWarning>
            {error && (
              <div className="p-4 bg-[#2a1215] border border-[#f5c2c7]/20 rounded-xl text-[#ea868f] text-xs">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  suppressHydrationWarning
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3.5 text-body-sm text-on-surface focus:outline-none focus:border-primary/50 disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  suppressHydrationWarning
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-xl px-4 py-3.5 text-body-sm text-on-surface focus:outline-none focus:border-primary/50 disabled:opacity-50"
                />
              </div>
            </div>

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
                  suppressHydrationWarning
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@muleshield.ai"
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
                  suppressHydrationWarning
                  onClick={() => setShowPassword(!showPassword)}
                  className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base hover:text-primary transition-colors disabled:opacity-50"
                >
                  {showPassword ? "visibility_off" : "visibility"}
                </button>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  suppressHydrationWarning
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
              suppressHydrationWarning
              className="w-full py-4 rounded-xl bg-[#2563eb] text-white font-bold text-body-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? "Registering..." : "Create Account"}
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
