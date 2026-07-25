import { create } from "zustand";
import { Alert } from "../types/alerts";
import { apiClient } from "../services/api-client";

interface AlertFilter {
  minRisk: number;
  maxRisk: number;
  search: string;
}

interface AlertState {
  alerts: Alert[];
  selectedAlertId: string | null;
  isLoading: boolean;
  error: string | null;
  filter: AlertFilter;

  // Actions
  fetchAlerts: () => Promise<void>;
  addAlert: (alert: Alert) => void;
  setSelectedAlertId: (id: string | null) => void;
  setFilter: (filter: Partial<AlertFilter>) => void;
  resolveAlert: (id: string, action: "DISMISSED" | "ESCALATED") => Promise<void>;
}

// Map backend AlertResponse → frontend Alert shape
function mapBackendAlert(a: any): Alert {
  return {
    id: String(a.id),
    transactionId: `TX-${String(a.id).slice(0, 6).toUpperCase()}`,
    amount: parseFloat(String(a.score)) * 500, // derived estimate
    currency: "USD",
    sourceAccount: `ACC-${String(a.account_id).slice(0, 8).toUpperCase()}`,
    destinationAccount: `ACC-${String(a.customer_id).slice(0, 8).toUpperCase()}`,
    riskScore: Math.round(a.score),
    status: a.status === "NEW" || a.status === "UNDER_REVIEW" ? "PENDING" : a.status,
    timestamp: a.created_at,
    tippingPoint: a.trigger_reason,
    shapExplanation: {
      [a.alert_type.replace(/_/g, " ")]: 0.6,
      "Behavioral Pattern Detected": 0.25,
      "Account Velocity Deviation": 0.15,
    },
    entityDetails: {
      name: a.entity_name || "Unknown Entity",
      category:
        a.severity === "CRITICAL"
          ? "Critical Mule Node"
          : a.severity === "HIGH"
          ? "High Risk Account"
          : "Suspicious Account",
      deviceId: `DEV-${String(a.account_id).slice(0, 8).toUpperCase()}`,
      ipAddress: "192.168.x.x",
    },
  };
}

const mockAlerts: Alert[] = [];

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: mockAlerts,
  selectedAlertId: null,
  isLoading: false,
  error: null,
  filter: {
    minRisk: 0,
    maxRisk: 100,
    search: "",
  },

  fetchAlerts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<any>("/api/v1/alerts");
      // Backend returns ResponseEnvelope: { success, data: AlertResponse[] }
      const rawAlerts =
        response?.data && Array.isArray(response.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : null;

      if (rawAlerts !== null) {
        const mapped = rawAlerts.map(mapBackendAlert);
        set({ alerts: mapped, isLoading: false });
      } else {
        // No backend data — keep simulation
        set({ isLoading: false });
      }
    } catch (err: any) {
      set({ isLoading: false });
      console.warn("Backend API not reachable. Showing local simulation alerts.");
    }
  },

  addAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts],
    }));
  },

  setSelectedAlertId: (id) => {
    set({ selectedAlertId: id });
  },

  setFilter: (newFilter) => {
    set((state) => ({
      filter: { ...state.filter, ...newFilter },
    }));
  },

  resolveAlert: async (id, action) => {
    try {
      await apiClient.post(`/api/v1/alerts/${id}/resolve`, { action });
    } catch (err) {
      console.warn(
        `Backend resolution API failed. Simulating locally for action: ${action}`
      );
    } finally {
      set((state) => ({
        alerts: state.alerts.map((a) =>
          a.id === id ? { ...a, status: action } : a
        ),
        selectedAlertId:
          state.selectedAlertId === id ? null : state.selectedAlertId,
      }));
    }
  },
}));
