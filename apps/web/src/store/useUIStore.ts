import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "warning" | "error" | "info";
  duration?: number;
}

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"], duration?: number) => void;
  removeToast: (id: string) => void;
  globalIngestionId: string | null;
  setGlobalIngestionId: (id: string | null) => void;
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  toasts: [],
  addToast: (message, type = "info", duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  globalIngestionId: typeof window !== "undefined" ? sessionStorage.getItem("activeIngestionId") : null,
  setGlobalIngestionId: (id) => {
    if (typeof window !== "undefined") {
      if (id) {
        sessionStorage.setItem("activeIngestionId", id);
      } else {
        sessionStorage.removeItem("activeIngestionId");
      }
    }
    set({ globalIngestionId: id });
  },
  theme: typeof window !== "undefined" ? (localStorage.getItem("display-theme") as any) || "system" : "system",
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("display-theme", theme);
    }
    set({ theme });
  },
}));

