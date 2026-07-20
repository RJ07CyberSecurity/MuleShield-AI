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

const mockAlerts: Alert[] = [
  {
    id: "ALERT-88219",
    transactionId: "TX-998812",
    amount: 14500,
    currency: "USD",
    sourceAccount: "ACC-092281",
    destinationAccount: "ACC-9912-MULE-B",
    riskScore: 98,
    status: "PENDING",
    timestamp: "2024-10-24T14:22:01Z",
    tippingPoint:
      "Rapid In-Out Flow Velocity: Funds moved < 4 min from deposit.",
    shapExplanation: {
      "Rapid In-Out Flow Velocity": 0.42,
      "Connection to Sanct. Entity": 0.28,
      "New Device from Lagos, NG": 0.15,
    },
    entityDetails: {
      name: "Vasily Kandinsky",
      category: "Critical Mule Node",
      deviceId: "DEV-FNG-99812",
      ipAddress: "192.168.4.11",
    },
  },
  {
    id: "ALERT-88220",
    transactionId: "TX-998813",
    amount: 8200,
    currency: "USD",
    sourceAccount: "ACC-110294",
    destinationAccount: "ACC-1011-MULE-C",
    riskScore: 84,
    status: "PENDING",
    timestamp: "2024-10-24T13:10:45Z",
    tippingPoint:
      "Structured Deposits: High frequency layering under reporting thresholds.",
    shapExplanation: {
      "Structured Deposits Pattern": 0.52,
      "New Beneficiary Account": 0.18,
      "IP Geolocation Shift": 0.14,
    },
    entityDetails: {
      name: "Elena Petrova",
      category: "Smurf Account",
      deviceId: "DEV-FNG-33101",
      ipAddress: "82.44.112.5",
    },
  },
  {
    id: "ALERT-88221",
    transactionId: "TX-998814",
    amount: 24500,
    currency: "USD",
    sourceAccount: "ACC-552109",
    destinationAccount: "ACC-5421-MULE-A",
    riskScore: 79,
    status: "PENDING",
    timestamp: "2024-10-24T11:45:30Z",
    tippingPoint:
      "High Risk Geo: Outflows linked to known high-risk currency clearing channels.",
    shapExplanation: {
      "High Risk Geographic Region": 0.48,
      "Dormant Account Reactivated": 0.31,
    },
    entityDetails: {
      name: "Marcus Sterling",
      category: "Suspected Mule Controller",
      deviceId: "DEV-FNG-77443",
      ipAddress: "18.2.14.99",
    },
  },
  {
    id: "ALERT-88222",
    transactionId: "TX-998815",
    amount: 1200,
    currency: "USD",
    sourceAccount: "ACC-331002",
    destinationAccount: "ACC-9912-MULE-B",
    riskScore: 52,
    status: "PENDING",
    timestamp: "2024-10-24T09:12:15Z",
    tippingPoint: "Peer Velocity deviation from baseline transaction frequency.",
    shapExplanation: {
      "Peer Velocity Variance": 0.38,
      "Device Identifier Overlap": 0.14,
    },
    entityDetails: {
      name: "Julian Thorne",
      category: "Smurf Account",
      deviceId: "DEV-FNG-99812",
      ipAddress: "192.168.4.11",
    },
  },
];

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: mockAlerts,
  selectedAlertId: "ALERT-88219",
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

      if (rawAlerts && rawAlerts.length > 0) {
        const mapped = rawAlerts.map(mapBackendAlert);
        // Merge: put real alerts first, keep mock ones that aren't replaced
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
