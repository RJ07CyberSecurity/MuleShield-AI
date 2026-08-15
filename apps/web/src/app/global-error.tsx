"use client";

import { useEffect } from "react";

/**
 * app/global-error.tsx — Next.js App Router GLOBAL error boundary.
 *
 * This wraps the root layout (app/layout.tsx) itself, so it MUST include
 * <html> and <body> tags. It handles catastrophic errors that crash the
 * root layout (e.g., a broken ThemeProvider or QueryProvider).
 *
 * This is the correct Next.js App Router replacement for the Pages Router
 * pages/_error.js file.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[MuleShield GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#07090e",
          color: "#e1e2ed",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
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
              A critical error occurred in the MuleShield AI interface. Please
              try again or return to the login page.
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
              id="global-error-retry-btn"
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
              id="global-error-login-btn"
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
      </body>
    </html>
  );
}
