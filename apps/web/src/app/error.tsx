"use client";

import { useEffect } from "react";

/**
 * app/error.tsx — Next.js App Router segment-level error boundary.
 *
 * Rendered INSIDE the root layout (app/layout.tsx), so it must NOT include
 * <html> or <body> tags. Those are provided by the root layout.
 *
 * This catches runtime errors in any page or layout below the root.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[MuleShield Error Boundary]", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        textAlign: "center",
        padding: "24px",
        background: "#07090e",
        color: "#e1e2ed",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ fontSize: "48px" }}>⚠️</div>
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>
          Something went wrong
        </h1>
        <p
          style={{
            color: "#9aa0b4",
            fontSize: "14px",
            maxWidth: "400px",
            lineHeight: "1.6",
          }}
        >
          An unexpected error occurred in the MuleShield AI interface. Your
          session data is safe.
        </p>
        {error?.digest && (
          <p
            style={{
              color: "#555e7a",
              fontSize: "11px",
              marginTop: "8px",
              fontFamily: "monospace",
            }}
          >
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          id="error-retry-btn"
          onClick={reset}
          style={{
            background: "#06b6d4",
            color: "#001a20",
            border: "none",
            borderRadius: "10px",
            padding: "12px 24px",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
        <button
          id="error-login-btn"
          onClick={() => {
            window.location.href = "/login";
          }}
          style={{
            background: "transparent",
            color: "#9aa0b4",
            border: "1px solid rgba(154,160,180,0.3)",
            borderRadius: "10px",
            padding: "12px 24px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
