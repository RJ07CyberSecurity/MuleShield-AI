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
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
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
      set({ user: null, isAuthenticated: false, isLoading: false });
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  },

  setUser: (user) => set({ user, isAuthenticated: true }),
}));
