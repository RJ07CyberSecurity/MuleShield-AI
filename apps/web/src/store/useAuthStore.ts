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

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
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

  initialize: async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }
    try {
      const response = await apiClient.get<any>("/api/v1/auth/me");
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
        });
      } else {
        // Token is invalid or expired
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      // On any error (401, network), treat as logged out
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      set({ user: null, isAuthenticated: false, isLoading: false });
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
      set({ user: null, isAuthenticated: false, isLoading: false });
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
      const response = await apiClient.post<any>("/api/v1/auth/mfa/setup");
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
      const response = await apiClient.post<any>("/api/v1/auth/mfa/disable");
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
