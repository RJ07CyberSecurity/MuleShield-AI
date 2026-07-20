import { create } from "zustand";
import { Case, CaseNote } from "../types/cases";
import { apiClient } from "../services/api-client";

interface CaseState {
  cases: Case[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCases: () => Promise<void>;
  updateCaseStatus: (id: string, status: Case["status"]) => Promise<void>;
  addCaseNote: (id: string, noteText: string) => Promise<void>;
}

// Map backend CaseResponse → frontend Case shape
function mapBackendCase(c: any): Case {
  return {
    id: String(c.id),
    title: c.title || "Untitled Case",
    status:
      c.status === "OPEN" || c.status === "NEW"
        ? "NEW"
        : c.status === "INVESTIGATING"
        ? "INVESTIGATING"
        : c.status === "CLOSED" || c.status === "RESOLVED"
        ? "CLOSED"
        : "NEW",
    riskScore: c.priority === "CRITICAL" ? 90 : c.priority === "HIGH" ? 70 : 45,
    assignedTo: c.assignee_id ? `Investigator (${String(c.assignee_id).slice(0, 4)})` : "Unassigned",
    createdAt: c.created_at,
    description: c.description || "No description available.",
    muleNodes: [`CUST-${String(c.customer_id).slice(0, 8).toUpperCase()}`],
    transactionsCount: 0,
    totalAmount: 0,
    notes: [],
  };
}

const mockCases: Case[] = [
  {
    id: "CASE-2026-0881",
    title: "Marcus Miller Layering Loop",
    status: "INVESTIGATING",
    riskScore: 94,
    assignedTo: "Sarah Chambers (CCO)",
    createdAt: "2026-07-11T14:32:00Z",
    description:
      "Multi-hop structure route flagged via IP-192.168.4.11 and device DEV-FNG-99812. Suspected money mule ring layering funds to clear through shell corporate entities.",
    muleNodes: ["ACC-9912-MULE-B", "ACC-0912-RETAIL", "DEV-FNG-99812"],
    transactionsCount: 14,
    totalAmount: 15700,
    notes: [
      {
        id: "n1",
        investigator: "Sarah Chambers",
        timestamp: "2026-07-12T10:15:00Z",
        text: "Confirmed hardware device match between Marcus Miller and Anna Lin's accounts. Highly suspicious overlapping session tokens.",
      },
    ],
  },
  {
    id: "CASE-2026-0882",
    title: "Cross-Border Smurf Cluster",
    status: "NEW",
    riskScore: 78,
    assignedTo: "Triage Team (Auto)",
    createdAt: "2026-07-14T20:00:00Z",
    description:
      "High-frequency transfers under reporting thresholds to destination accounts located in high-risk foreign jurisdictions.",
    muleNodes: ["ACC-7832-RESERVE", "ACC-1011-MULE-C"],
    transactionsCount: 8,
    totalAmount: 9800,
    notes: [],
  },
  {
    id: "CASE-2026-0883",
    title: "Ingress Velocity Deviation",
    status: "CLOSED",
    riskScore: 56,
    assignedTo: "Marcus Thorne",
    createdAt: "2026-07-09T08:15:00Z",
    description:
      "Dormant account reactivated with transaction size exceeding normal range by 800%.",
    muleNodes: ["ACC-1102-LEGACY", "ACC-5421-MULE-A"],
    transactionsCount: 3,
    totalAmount: 45000,
    notes: [
      {
        id: "n2",
        investigator: "Marcus Thorne",
        timestamp: "2026-07-10T15:44:00Z",
        text: "User submitted updated source of wealth declaration forms. Anomaly cleared. Account marked safe and case closed.",
      },
    ],
  },
];

export const useCaseStore = create<CaseState>((set) => ({
  cases: mockCases,
  isLoading: false,
  error: null,

  fetchCases: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<any>("/api/v1/cases");
      // Backend wraps in ResponseEnvelope: { success, data: CaseResponse[] }
      const rawCases =
        response?.data && Array.isArray(response.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : null;

      if (rawCases && rawCases.length > 0) {
        const mapped = rawCases.map(mapBackendCase);
        set({ cases: mapped, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      set({ isLoading: false });
      console.warn("Backend Cases API not reachable. Showing local simulation cases.");
    }
  },

  updateCaseStatus: async (id, status) => {
    try {
      await apiClient.post(`/api/v1/cases/${id}/status`, { status });
    } catch (err) {
      console.warn(`Backend status API failed. Simulating status change locally to: ${status}`);
    } finally {
      set((state) => ({
        cases: state.cases.map((c) => (c.id === id ? { ...c, status } : c)),
      }));
    }
  },

  addCaseNote: async (id, noteText) => {
    const newNote: CaseNote = {
      id: `n-${Date.now()}`,
      investigator: "Compliance Analyst (Active)",
      timestamp: new Date().toISOString(),
      text: noteText,
    };

    try {
      await apiClient.post(`/api/v1/cases/${id}/notes`, { text: noteText });
    } catch (err) {
      console.warn("Backend notes API failed. Appending note locally.");
    } finally {
      set((state) => ({
        cases: state.cases.map((c) =>
          c.id === id ? { ...c, notes: [...c.notes, newNote] } : c
        ),
      }));
    }
  },
}));
