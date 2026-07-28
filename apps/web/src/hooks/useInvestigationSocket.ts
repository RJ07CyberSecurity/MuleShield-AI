"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCaseStore } from "../store/useCaseStore";
import { useUIStore } from "../store/useUIStore";
import { InvestigationEvent } from "../types/cases";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

/** WebSocket endpoint on the API Gateway (single origin, port 8000). */
const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/^http/, "ws");

const WS_ENDPOINT = `${WS_BASE_URL}/ws/cases`;

/** Ping interval to keep the connection alive (ms). */
const PING_INTERVAL_MS = 30_000;

/** Reconnect back-off — doubles on each failure, capped at MAX_BACKOFF_MS. */
const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

interface UseInvestigationSocketOptions {
  /** The case currently open in the detail panel; null when list view is shown. */
  activeCaseId: string | null;
  /** Whether the current user is authenticated. Skip connection if false. */
  isAuthenticated: boolean;
}

/**
 * useInvestigationSocket
 *
 * Opens a persistent WebSocket connection to the shared Investigation
 * workspace. Handles:
 *  - JWT authentication via ?token= query param
 *  - Bidirectional message dispatch into useCaseStore.applyRemoteEvent
 *  - Presence tracking (viewing_case / left_case messages)
 *  - Ping keepalive every 30 seconds
 *  - Exponential back-off reconnection on connection drop
 *  - Toast notifications for significant real-time events
 *  - Clean teardown on unmount / logout
 */
export function useInvestigationSocket({
  activeCaseId,
  isAuthenticated,
}: UseInvestigationSocketOptions) {
  const { applyRemoteEvent } = useCaseStore();
  const { addToast } = useUIStore();

  const socketRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef<number>(INITIAL_BACKOFF_MS);
  const activeCaseIdRef = useRef<string | null>(activeCaseId);
  const mountedRef = useRef(true);

  // Keep activeCaseIdRef current without triggering reconnects
  useEffect(() => {
    activeCaseIdRef.current = activeCaseId;
  }, [activeCaseId]);

  // ── Send presence events when active case changes ────────────────────────
  useEffect(() => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // Notify server that we left the previous case (tracked separately below)
  }, [activeCaseId]);

  const sendJson = useCallback((payload: object) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }, []);

  const startPing = useCallback(() => {
    if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    pingTimerRef.current = setInterval(() => {
      sendJson({ type: "ping" });
    }, PING_INTERVAL_MS);
  }, [sendJson]);

  const stopPing = useCallback(() => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (!isAuthenticated) return;

    if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      console.warn("[InvSocket] No auth token found — skipping WebSocket connection.");
      return;
    }

    const url = `${WS_ENDPOINT}?token=${encodeURIComponent(token)}`;
    console.info("[InvSocket] Connecting to", url);

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      console.info("[InvSocket] Connected to shared investigation workspace.");
      backoffRef.current = INITIAL_BACKOFF_MS; // reset back-off on success
      startPing();

      // If a case is already open, announce our presence
      if (activeCaseIdRef.current) {
        sendJson({ type: "viewing_case", case_id: activeCaseIdRef.current });
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as InvestigationEvent;

        // Check if the event was triggered by the current user
        const { user } = useAuthStore.getState();
        const isSelf = (msg as any).actor_id && String((msg as any).actor_id) === String(user?.id);

        // Let the store handle state updates
        applyRemoteEvent(msg);

        if (isSelf) return; // Do not show toasts for actions triggered by yourself

        // Show toast notifications for significant events (non-self-originated)
        switch (msg.type) {
          case "case_created":
            addToast("New investigation case filed by another investigator.", "info");
            break;
          case "case_assigned":
            addToast(`Case ${(msg as any).case_id?.slice(0, 8)} assigned.`, "info");
            break;
          case "case_escalated":
            addToast(`Case ${(msg as any).case_id?.slice(0, 8)} escalated.`, "warning");
            break;
          case "case_closed":
            addToast(`Case ${(msg as any).case_id?.slice(0, 8)} closed.`, "success");
            break;
          case "case_reopened":
            addToast(`Case ${(msg as any).case_id?.slice(0, 8)} reopened.`, "warning");
            break;
          case "case_note_added": {
            const investigator = (msg as any).note?.investigator ?? "An investigator";
            addToast(`${investigator} added a note to case ${(msg as any).case_id?.slice(0, 8)}.`, "info");
            break;
          }
          // pong, presence_update, connected_users — no toast needed
          default:
            break;
        }
      } catch (err) {
        console.warn("[InvSocket] Failed to parse message:", event.data, err);
      }
    };

    ws.onerror = (err) => {
      console.warn("[InvSocket] WebSocket error:", err);
    };

    ws.onclose = (event) => {
      console.info(`[InvSocket] Disconnected (code=${event.code}).`);
      stopPing();
      socketRef.current = null;

      if (!mountedRef.current) return;           // component unmounted — don't reconnect
      if (event.code === 4001) {
        // Authentication failure — do not reconnect
        console.warn("[InvSocket] Auth rejected (4001). Check JWT token.");
        return;
      }

      // Schedule reconnect with exponential back-off
      const delay = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
      console.info(`[InvSocket] Reconnecting in ${delay}ms…`);
      reconnectTimerRef.current = setTimeout(connect, delay);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ── Mount: open connection ────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      // Unmount: clean up cleanly
      mountedRef.current = false;

      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      stopPing();

      const ws = socketRef.current;
      if (ws) {
        if (activeCaseIdRef.current) {
          try {
            ws.send(JSON.stringify({ type: "left_case", case_id: activeCaseIdRef.current }));
          } catch {
            // ignore if already closing
          }
        }
        ws.onclose = null; // Prevent reconnect loop from teardown
        ws.close(1000, "Component unmounted");
        socketRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect]);

  // ── Presence: send viewing_case / left_case when activeCaseId changes ────
  useEffect(() => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // Send left_case for the PREVIOUS activeCaseIdRef.current if it was set
    if (activeCaseIdRef.current && activeCaseIdRef.current !== activeCaseId) {
      sendJson({ type: "left_case", case_id: activeCaseIdRef.current });
    }

    if (activeCaseId) {
      sendJson({ type: "viewing_case", case_id: activeCaseId });
    }
    
    // Update the ref to the new activeCaseId
    activeCaseIdRef.current = activeCaseId;
  }, [activeCaseId, sendJson]);

  /** Manually send a left_case notification (call when closing the detail panel). */
  const notifyLeftCase = useCallback(
    (caseId: string) => {
      sendJson({ type: "left_case", case_id: caseId });
    },
    [sendJson]
  );

  return { notifyLeftCase };
}
