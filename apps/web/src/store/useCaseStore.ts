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

const mockCases: Case[] = [];

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

      if (rawCases !== null) {
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
