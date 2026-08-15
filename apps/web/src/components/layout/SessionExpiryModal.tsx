"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";

/** How many ms before expiry to start showing the warning modal */
const WARN_BEFORE_MS = 5 * 60 * 1000; // 5 minutes

/** How often (ms) the watcher interval fires */
const POLL_INTERVAL_MS = 30_000; // 30 seconds

export default function SessionExpiryModal() {
  const { isAuthenticated, sessionExpiry, logout, refreshSession } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !sessionExpiry) {
      setShowWarning(false);
      return;
    }

    // Coarse watcher — fires every 30s, shows modal once we enter the warning window
    const coarseInterval = setInterval(() => {
      const remaining = sessionExpiry - Date.now();

      if (remaining <= 0) {
        // Session expired — force logout
        clearInterval(coarseInterval);
        logout();
      } else if (remaining <= WARN_BEFORE_MS) {
        setShowWarning(true);
        setSecondsLeft(Math.ceil(remaining / 1000));
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(coarseInterval);
  }, [isAuthenticated, sessionExpiry, logout]);

  // Fine-grained countdown once the modal is visible
  useEffect(() => {
    if (!showWarning || !sessionExpiry) return;

    const fineInterval = setInterval(() => {
      const remaining = sessionExpiry - Date.now();
      if (remaining <= 0) {
        clearInterval(fineInterval);
        logout();
      } else {
        setSecondsLeft(Math.ceil(remaining / 1000));
      }
    }, 1_000);

    return () => clearInterval(fineInterval);
  }, [showWarning, sessionExpiry, logout]);

  const handleStayLoggedIn = async () => {
    setIsRefreshing(true);
    try {
      await refreshSession();
      setShowWarning(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  if (!showWarning) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expiry-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal card */}
      <div className="relative w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-low shadow-2xl shadow-black/40 overflow-hidden">
        {/* Gradient top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-risk-high via-amber-400 to-primary animate-pulse" />

        <div className="p-8 space-y-6">
          {/* Icon + title */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-risk-high/15 border border-risk-high/30 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-risk-high text-2xl">timer</span>
            </div>
            <div>
              <h2 id="session-expiry-title" className="text-lg font-bold text-on-surface">
                Session Expiring Soon
              </h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Your session will automatically log you out in
              </p>
            </div>
          </div>

          {/* Countdown display */}
          <div className="flex items-center justify-center py-4">
            <div className="relative flex items-center justify-center w-28 h-28">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 112 112">
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-outline-variant/20"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - Math.min(secondsLeft, 300) / 300)}`}
                  className="text-risk-high transition-[stroke-dashoffset] duration-1000"
                />
              </svg>
              <div className="text-center">
                <div className="font-display-kpi text-3xl font-bold text-risk-high tabular-nums">
                  {formatTime(secondsLeft)}
                </div>
                <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                  remaining
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-on-surface-variant text-center leading-relaxed">
            For security, your session is limited to 1 hour. Click{" "}
            <strong className="text-primary">Stay Logged In</strong> to refresh your session and
            continue working.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="session-stay-logged-in-btn"
              onClick={handleStayLoggedIn}
              disabled={isRefreshing}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Refreshing…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Stay Logged In
                </>
              )}
            </button>
            <button
              id="session-logout-btn"
              onClick={() => logout()}
              className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:text-risk-high hover:border-risk-high/40 font-semibold transition-all"
            >
              Logout Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
