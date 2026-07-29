import { create } from "zustand";
import { Case, CaseNote } from "../types/cases";
import { apiClient } from "../services/api-client";

interface CaseState {
  cases: Case[];
  activeCaseId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveCaseId: (id: string | null) => void;
  fetchCases: () => Promise<void>;
  createCase: (customData?: any) => Promise<void>;
  updateCaseStatus: (id: string, status: Case["status"]) => Promise<void>;
  assignCase: (id: string, officerId: string, officerName?: string) => Promise<void>;
  addCaseNote: (id: string, noteText: string) => Promise<void>;
  updateCaseMetadata: (id: string, updates: Partial<Case>) => Promise<void>;
  presenceMap: Record<string, string[]>;
  connectedUsers: number;
  applyRemoteEvent: (event: any) => void;
  updatePresence: (caseId: string, viewers: string[]) => void;
  setConnectedUsers: (n: number) => void;
}

// Module level cache for user names
let cachedUsersMap: Record<string, string> = {};

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
    priority: c.priority || (c.escalation_status === "ESCALATED" ? "CRITICAL" : "MEDIUM"),

    customerName: c.customer_name || c.customer_id || "Unknown Customer",
    riskScore: c.risk_score || c.riskScore || 75,
    aiConfidence: c.ai_confidence || c.aiConfidence || 85,
    assignee_id: c.officer_id || c.owner_id,
    assignedTo: (c.officer_id || c.owner_id) ? (cachedUsersMap[c.officer_id || c.owner_id] || `Investigator (${String(c.officer_id || c.owner_id).slice(0, 4)})`) : "Unassigned",

    createdAt: c.created_at,
    description: c.notes || c.description || "No description available.",
    muleNodes: c.customer_id ? [`CUST-${String(c.customer_id).slice(0, 8).toUpperCase()}`] : [],
    transactionsCount: 0,
    totalAmount: 0,
    currency: c.currency || "USD",
    notes: (Array.isArray(c.case_notes) ? c.case_notes : Array.isArray(c.notes) ? c.notes : (c.notes ? [c.notes] : [])).map((n: any) => typeof n === 'string' ? { id: `n-${Date.now()}`, investigator: 'Analyst', timestamp: new Date().toISOString(), text: n } : n),
    slaRemaining: c.slaRemaining || "48h 00m",
    evidenceCount: (c.evidence || []).length,
    currentStage: c.stage || (c.status === "NEW" ? "Alert Triage" : "Network Analysis"),
    shapValues: c.shapValues || [],
    triggeredRules: c.triggeredRules || [],
    timeline: c.timeline || [],
    evidence: c.evidence || [],
    linkedAlerts: c.alert_id ? [`ALT-${c.alert_id}`] : [],
    linkedAccounts: [],
    investigatorNotes: c.notes || "Initial triage suggests coordinated mule activity. Awaiting document verification."
  };
}

export const useCaseStore = create<CaseState>((set, get) => ({
  cases: [],
  activeCaseId: null,
  isLoading: false,
  error: null,
  presenceMap: {},
  connectedUsers: 0,

  setActiveCaseId: (id: string | null) => {
    set({ activeCaseId: id });
  },

  createCase: async (customData?: any) => {
    try {
      const payload = {
        notes: customData?.description || "Manually registered case from dashboard.",
        status: customData?.status || "NEW",
        recommended_action: "PENDING_REVIEW",
        escalation_status: customData?.priority === "CRITICAL" || customData?.isEscalated ? "ESCALATED" : null,
        escalated_by: null,
        title: customData?.title,
        customer_name: customData?.customerName,
        customer_id: customData?.customerName,
        priority: customData?.priority,
        stage: "Escalated",
        risk_score: customData?.riskScore,
        ai_confidence: customData?.aiConfidence || 85
      };
      const response = await apiClient.post<any>("/api/v1/cases", payload);
      if (response?.data) {
        const newCase = mapBackendCase(response.data);
        set((state) => {
          const exists = state.cases.some((c) => c.id === newCase.id);
          if (exists) return state;
          return { cases: [newCase, ...state.cases] };
        });
      }
    } catch (err) {
      console.error("Failed to create case dynamically via API", err);
    }
  },

  fetchCases: async () => {
    set({ isLoading: true, error: null });
    try {
      try {
        const usersRes = await apiClient.get<any>("/api/v1/auth/users");
        if (usersRes?.success && Array.isArray(usersRes.data)) {
          usersRes.data.forEach((u: any) => {
            cachedUsersMap[u.id] = `${u.first_name} ${u.last_name}`;
          });
        }
      } catch (err) {
        console.warn("Failed to load users for case map");
      }

      const response = await apiClient.get<any>("/api/v1/cases");
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

  assignCase: async (id, officerId, officerName) => {
    const name = officerName || cachedUsersMap[officerId] || `Investigator (${officerId.slice(0, 4)})`;
    set((state) => ({
      cases: state.cases.map((c) =>
        c.id === id ? { 
          ...c, 
          assignee_id: officerId,
          assignedTo: name,
          status: c.status === "NEW" ? "INVESTIGATING" : c.status
        } : c
      ),
    }));

    try {
      await apiClient.patch(`/api/v1/cases/${id}/assign`, { officer_id: officerId });
    } catch (err: any) {
      console.error("Failed to assign case", err);
      get().fetchCases();
    }
  },

  updateCaseMetadata: async (id, updates) => {
    try {
      // Optimistic UI update
      set((state) => ({
        cases: state.cases.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }));

      // Backend API call
      const payload = {
        title: updates.title,
        customer_name: updates.customerName,
        priority: updates.priority,
        stage: updates.currentStage || (updates as any).stage,
        risk_score: updates.riskScore,
        ai_confidence: updates.aiConfidence,
        status: updates.status
      };
      
      // Clean undefined
      Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);
      
      await apiClient.patch(`/api/v1/cases/${id}`, payload);
    } catch (err) {
      console.warn(`Backend update metadata API failed for ${id}`);
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

  applyRemoteEvent: (event: any) => {
    switch (event.type) {
      case "case_created": {
        const incoming = mapBackendCase(event.data);
        set((state) => {
          const exists = state.cases.some((c) => c.id === incoming.id);
          if (exists) return state;
          return { cases: [incoming, ...state.cases] };
        });
        break;
      }

      case "case_updated":
      case "case_closed":
      case "case_reopened":
      case "case_assigned":
      case "case_escalated": {
        if (!event.case_id) break;
        const caseId = event.case_id;
        if (event.data) {
          const updated = mapBackendCase(event.data);
          set((state) => ({
            cases: state.cases.map((c) => (c.id === caseId ? { ...c, ...updated } : c)),
          }));
        } else {
          if (event.type === "case_closed") {
            set((state) => ({
              cases: state.cases.map((c) => (c.id === caseId ? { ...c, status: "CLOSED" as const } : c)),
            }));
          } else if (event.type === "case_reopened") {
            set((state) => ({
              cases: state.cases.map((c) => (c.id === caseId ? { ...c, status: "INVESTIGATING" as const } : c)),
            }));
          } else if (event.type === "case_assigned") {
            set((state) => ({
              cases: state.cases.map((c) => (c.id === caseId ? { 
                ...c, 
                assignee_id: event.assigned_to,
                assignedTo: event.assigned_to ? (cachedUsersMap[event.assigned_to] || `Investigator (${event.assigned_to.slice(0, 4)})`) : "Unassigned"
              } : c)),
            }));
          } else if (event.type === "case_escalated") {
            set((state) => ({
              cases: state.cases.map((c) => (c.id === caseId ? { ...c, priority: "CRITICAL" as const, riskScore: 95 } : c)),
            }));
          }
        }
        break;
      }

      case "case_note_added": {
        const { case_id: caseId, note } = event;
        const newNote: any = {
          id: note.id,
          investigator: note.investigator,
          timestamp: note.timestamp,
          text: note.text,
        };
        set((state) => ({
          cases: state.cases.map((c) =>
            c.id === caseId
              ? {
                  ...c,
                  notes: c.notes.some((n) => n.id === newNote.id)
                    ? c.notes
                    : [...c.notes, newNote],
                }
              : c
          ),
        }));
        break;
      }

      case "presence_update": {
        const { case_id, viewers } = event;
        set((state) => ({
          presenceMap: { ...state.presenceMap, [case_id]: viewers },
        }));
        break;
      }

      case "connected_users": {
        set({ connectedUsers: event.count });
        break;
      }
    }
  },

  updatePresence: (caseId: string, viewers: string[]) => {
    set((state) => ({
      presenceMap: { ...state.presenceMap, [caseId]: viewers },
    }));
  },

  setConnectedUsers: (n: number) => {
    set({ connectedUsers: n });
  },
}));
