import io
import re

file_path = r'e:\MuleShieldAI\apps\web\src\store\useCaseStore.ts'

with io.open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update interface
new_interface = '''  createCase: (customData?: any) => Promise<void>;
  updateCaseStatus: (id: string, status: Case["status"]) => Promise<void>;
  assignCase: (id: string, officerId: string) => Promise<void>;
  addCaseNote: (id: string, noteText: string) => Promise<void>;
  presenceMap: Record<string, string[]>;
  connectedUsers: number;
  applyRemoteEvent: (event: any) => void;
  updatePresence: (caseId: string, viewers: string[]) => void;
  setConnectedUsers: (n: number) => void;
}'''

text = re.sub(r'  updateCaseStatus: .*? => Promise<void>;\s*addCaseNote: .*? => Promise<void>;\s*}', new_interface, text)

# 2. Add users map cache
text = text.replace('function mapBackendCase(c: any): Case {', '''// Module level cache for resolving user names synchronously
let cachedUsersMap: Record<string, string> = {};

function mapBackendCase(c: any): Case {''')

# 3. Update mapBackendCase properties
assign_repl = '''    assignee_id: c.officer_id || c.owner_id,
    assignedTo: (c.officer_id || c.owner_id) ? (cachedUsersMap[c.officer_id || c.owner_id] || Investigator ()) : "Unassigned",'''
text = re.sub(r'    assignedTo: c\.assignee_id \? .*? : "Unassigned",', assign_repl, text)

timeline_repl = '''      { id: "t3", stage: "Officer Assigned", description: "Assigned to an investigator", timestamp: new Date().toISOString(), icon: "person", isCompleted: (c.officer_id || c.owner_id) ? true : false },'''
text = re.sub(r'      { id: "t3", stage: "Officer Assigned", description: "Assigned to an investigator", timestamp: new Date\(\)\.toISOString\(\), icon: "person", isCompleted: c\.assignee_id \? true : false },', timeline_repl, text)

# 4. Update init state
init_state = '''export const useCaseStore = create<CaseState>((set) => ({
  cases: mockCases,
  isLoading: false,
  error: null,
  presenceMap: {},
  connectedUsers: 0,

  createCase: async (customData?: any) => {
    try {
      const payload = {
        notes: customData?.description || "Manually registered case from dashboard.",
        status: "NEW",
        recommended_action: "PENDING_REVIEW"
      };
      const response = await apiClient.post<any>("/api/v1/cases", payload);
      if (response?.data) {
        const newCase = mapBackendCase(response.data);
        if (customData) {
          if (customData.title) newCase.title = customData.title;
          if (customData.description) newCase.description = customData.description;
          if (customData.customerName) newCase.customerName = customData.customerName;
          if (customData.priority) newCase.priority = customData.priority;
          if (customData.riskScore) newCase.riskScore = customData.riskScore;
        }
        set((state) => {
          const exists = state.cases.some((c) => c.id === newCase.id);
          if (exists) return state;
          return { cases: [newCase, ...state.cases] };
        });
      }
    } catch (err) {
      console.error("Failed to create case dynamically via API", err);
    }
  },'''

text = re.sub(r'export const useCaseStore = create<CaseState>\(\(set\) => \(\{\s*cases: mockCases,\s*isLoading: false,\s*error: null,', init_state, text)

# 5. Inject user fetch in fetchCases
fetch_repl = '''  fetchCases: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch users map first to resolve names
      try {
        const usersRes = await apiClient.get<any>("/api/v1/auth/users");
        if (usersRes?.success && Array.isArray(usersRes.data)) {
          usersRes.data.forEach((u: any) => {
            cachedUsersMap[u.id] = f"{u.first_name} {u.last_name}";
          });
        }
      } catch (err) {
        console.warn("Failed to fetch users for case mapping", err);
      }

      const response = await apiClient.get<any>("/api/v1/cases");'''

text = text.replace('''  fetchCases: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<any>("/api/v1/cases");''', fetch_repl)

# 6. Add assignCase
assign_case = '''  updateCaseStatus: async (id, status) => {
    try {
      await apiClient.patch(/api/v1/cases//status, { status });
    } catch (err) {
      console.warn(Backend status API failed. Simulating status change locally to: );
    } finally {
      set((state) => ({
        cases: state.cases.map((c) => (c.id === id ? { ...c, status } : c)),
      }));
    }
  },

  assignCase: async (id, officerId) => {
    const officerName = cachedUsersMap[officerId] || Investigator ();
    set((state) => ({
      cases: state.cases.map((c) =>
        c.id === id ? { 
          ...c, 
          assignee_id: officerId,
          assignedTo: officerName,
          status: c.status === "NEW" ? "INVESTIGATING" : c.status
        } : c
      ),
    }));

    try {
      await apiClient.patch(/api/v1/cases//assign, { officer_id: officerId });
    } catch (err: any) {
      console.error("Failed to assign case", err);
      useCaseStore.getState().fetchCases();
    }
  },'''

text = re.sub(r'  updateCaseStatus: async \(id, status\) => \{[\s\S]*?\},', assign_case, text, count=1)

# 7. Add WS Events
ws_events = '''  addCaseNote: async (id, noteText) => {
    const newNote: CaseNote = {
      id: 
-,
      investigator: "Compliance Analyst (Active)",
      timestamp: new Date().toISOString(),
      text: noteText,
    };

    try {
      await apiClient.post(/api/v1/cases//notes, { text: noteText });
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
          // Partial update without full data payload
          if (event.type === "case_closed") {
            set((state) => ({
              cases: state.cases.map((c) => (c.id === caseId ? { ...c, status: "CLOSED" as const } : c)),
            }));
          } else if (event.type === "case_reopened") {
            set((state) => ({
              cases: state.cases.map((c) => (c.id === caseId ? { ...c, status: "INVESTIGATING" as const } : c)),
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
  },'''

text = re.sub(r'  addCaseNote: async \(id, noteText\) => \{[\s\S]*?\},', ws_events, text, count=1)

with io.open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(text)
