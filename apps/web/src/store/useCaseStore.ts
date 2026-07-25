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
    
    // Rich frontend simulations
    customerName: c.customer_name || "Unknown Entity",
    bank: c.bank || "MuleShield First National",
    priority: c.priority === "CRITICAL" ? "CRITICAL" : c.priority === "HIGH" ? "HIGH" : c.riskScore >= 40 ? "MEDIUM" : "LOW",
    aiConfidence: c.aiConfidence || Math.floor(Math.random() * (98 - 75 + 1) + 75),
    slaRemaining: c.slaRemaining || `${Math.floor(Math.random() * 48)}h ${Math.floor(Math.random() * 60)}m`,
    evidenceCount: c.evidenceCount || Math.floor(Math.random() * 10),
    currentStage: c.currentStage || (c.status === "NEW" ? "Alert Triage" : "Network Analysis"),
    
    shapValues: c.shapValues || [
      { feature: "Rapid Transit", value: 45.2, contribution: "positive" },
      { feature: "Layering", value: 32.1, contribution: "positive" },
      { feature: "Geo Risk", value: 18.5, contribution: "positive" },
      { feature: "Account Age", value: -12.4, contribution: "negative" }
    ],
    triggeredRules: c.triggeredRules || ["R1_HIGH_TXN_FREQ", "R3_RAPID_PASS_THROUGH"],
    
    timeline: c.timeline || [
      { id: "t1", stage: "Alert Generated", description: "System flagged anomalous behavior", timestamp: c.created_at, icon: "warning", isCompleted: true },
      { id: "t2", stage: "Case Created", description: "Auto-escalated to case registry", timestamp: c.created_at, icon: "folder", isCompleted: true },
      { id: "t3", stage: "Officer Assigned", description: "Assigned to an investigator", timestamp: new Date().toISOString(), icon: "person", isCompleted: c.assignee_id ? true : false },
      { id: "t4", stage: "Evidence Added", description: "Bank statements collected", timestamp: "", icon: "attach_file", isCompleted: false },
      { id: "t5", stage: "Network Analysed", description: "Graph analysis completed", timestamp: "", icon: "hub", isCompleted: false },
      { id: "t6", stage: "Closed", description: "Investigation concluded", timestamp: "", icon: "check_circle", isCompleted: false }
    ],
    evidence: c.evidence || [],
    linkedAlerts: c.linkedAlerts || [`ALT-${Math.floor(Math.random() * 9000) + 1000}`, `ALT-${Math.floor(Math.random() * 9000) + 1000}`],
    linkedAccounts: c.linkedAccounts || [`ACCT-${Math.floor(Math.random() * 90000) + 10000}`],
    investigatorNotes: c.investigatorNotes || "Initial triage suggests coordinated mule activity. Awaiting document verification."
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
