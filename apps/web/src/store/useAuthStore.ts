"use client";
import { create } from "zustand";
import { apiClient } from "../services/api-client";

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_mfa_enabled: boolean;
  roles: string[];
  avatar_url?: string;
}

// 1 hour in milliseconds — matches the server-side ACCESS_TOKEN_EXPIRE_MINUTES=60
const SESSION_DURATION_MS = 60 * 60 * 1000;

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Absolute timestamp (ms since epoch) when the current session expires */
  sessionExpiry: number | null;

  // Actions
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  setupMfa: () => Promise<{ secret: string; qr_code_uri: string }>;
  verifyMfa: (code: string) => Promise<void>;
  disableMfa: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  sessionExpiry: null,

  initialize: async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null, sessionExpiry: null });
      return;
    }

    // Abort the auth check after 8 seconds so the user is never stuck on the
    // loading screen when the backend is unreachable or very slow.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8_000);

    try {
      const response = await apiClient.get<any>("/api/v1/auth/me", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response && response.success && response.data) {
        const raw = response.data;
        // roles from backend are RoleResponse objects: { id, name, description }
        const roles: string[] = Array.isArray(raw.roles)
          ? raw.roles.map((r: any) => (typeof r === "string" ? r : r.name))
          : [];
        const u: AuthUser = {
          id: String(raw.id),
          email: raw.email,
          first_name: raw.first_name,
          last_name: raw.last_name,
          is_active: raw.is_active,
          is_mfa_enabled: raw.is_mfa_enabled,
          roles,
          avatar_url: raw.avatar_url,
        };
        set({
          user: u,
          isAuthenticated: true,
          isLoading: false,
          sessionExpiry: Date.now() + SESSION_DURATION_MS,
        });
      } else {
        // Token is invalid or expired
        clearTimeout(timeoutId);
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        set({ user: null, isAuthenticated: false, isLoading: false, sessionExpiry: null });
      }
    } catch {
      // On any error (401, network error, timeout abort) — treat as logged out
      clearTimeout(timeoutId);
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      set({ user: null, isAuthenticated: false, isLoading: false, sessionExpiry: null });
    }
  },

  /**
   * Silently refreshes the access token and resets the 1-hour session timer.
   * Called by the session watcher when the user chooses "Stay Logged In".
   */
  refreshSession: async () => {
    const refreshToken =
      typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    if (!refreshToken) {
      await get().logout();
      return;
    }
    try {
      const response = await apiClient.post<any>("/api/v1/auth/refresh", {
        refresh_token: refreshToken,
      });
      if (response && response.data?.access_token) {
        localStorage.setItem("token", response.data.access_token);
        if (response.data.refresh_token) {
          localStorage.setItem("refresh_token", response.data.refresh_token);
        }
        // Reset the session timer to another full hour
        set({ sessionExpiry: Date.now() + SESSION_DURATION_MS });
      } else {
        // Refresh endpoint returned no token — force logout
        await get().logout();
      }
    } catch {
      await get().logout();
    }
  },

  logout: async () => {
    try {
      await apiClient.post("/api/v1/auth/logout", {});
    } catch {
      // Ignore logout API errors — still clear local state
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      sessionStorage.clear();
      if (typeof document !== "undefined") {
        document.cookie = "muleshield_token=; path=/; max-age=0; SameSite=Strict";
      }
      set({ user: null, isAuthenticated: false, isLoading: false, sessionExpiry: null });
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  },

  setUser: (user) => set({ user, isAuthenticated: true }),

  updateProfile: async (data: Partial<AuthUser>) => {
    try {
      const response = await apiClient.patch<any>("/api/v1/auth/me", data);
      if (response && response.success && response.data) {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      } else if (response && !response.success) {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (e: any) {
      console.error("Failed to update profile", e);
      throw e;
    }
  },
  setupMfa: async () => {
    try {
      const response = await apiClient.post<any>("/api/v1/auth/mfa/setup", {});
      if (response && response.success) {
        return response.data;
      }
      throw new Error(response?.message || "Failed to setup MFA");
    } catch (e: any) {
      console.error("MFA setup failed", e);
      throw e;
    }
  },
  verifyMfa: async (code: string) => {
    try {
      const { user } = get();
      if (!user) throw new Error("No user found");
      const response = await apiClient.post<any>("/api/v1/auth/mfa/verify", { email: user.email, code });
      if (response && response.success) {
        set((state) => ({
          user: state.user ? { ...state.user, is_mfa_enabled: true } : null,
        }));
      } else {
        throw new Error(response?.message || "Failed to verify MFA");
      }
    } catch (e: any) {
      console.error("MFA verification failed", e);
      throw e;
    }
  },
  disableMfa: async () => {
    try {
      const response = await apiClient.post<any>("/api/v1/auth/mfa/disable", {});
      if (response && response.success) {
        set((state) => ({
          user: state.user ? { ...state.user, is_mfa_enabled: false } : null,
        }));
      } else {
        throw new Error(response?.message || "Failed to disable MFA");
      }
    } catch (e: any) {
      console.error("MFA disable failed", e);
      throw e;
    }
  },
}));
