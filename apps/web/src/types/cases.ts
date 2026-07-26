export interface CaseNote {
  id: string;
  investigator: string;
  timestamp: string;
  text: string;
}

export interface CaseTimelineEvent {
  id: string;
  stage: string; // e.g., "Alert Generated", "Case Created", "Officer Assigned"
  description: string;
  timestamp: string;
  icon: string;
  isCompleted: boolean;
}

export interface CaseEvidence {
  id: string;
  filename: string;
  type: string; // e.g., "Bank Statement", "Image", "Geo Location"
  size: string;
  uploadedBy: string;
  uploadDate: string;
}

export interface Case {
  id: string;
  title: string;
  status: "NEW" | "INVESTIGATING" | "SAR_DRAFTED" | "CLOSED";
  riskScore: number;
  assignedTo: string;
  assignee_id?: string;
  createdAt: string;
  updatedAt?: string;
  description: string;
  muleNodes: string[];
  transactionsCount: number;
  totalAmount: number;
  notes: CaseNote[];
  
  // Extended fields for Investigation Workspace
  customerName?: string;
  bank?: string;
  priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  aiConfidence?: number;
  slaRemaining?: string; // e.g., "14h 30m"
  evidenceCount?: number;
  currentStage?: string;
  
  // Feature contributions for AI Explainability
  shapValues?: Array<{ feature: string; value: number; contribution: "positive" | "negative" }>;
  triggeredRules?: string[];
  
  timeline?: CaseTimelineEvent[];
  evidence?: CaseEvidence[];
  linkedAlerts?: string[];
  linkedAccounts?: string[];
  investigatorNotes?: string; // rich text or markdown summary
}

// ─────────────────────────────────────────────────────────────────────────────
// Real-time WebSocket event types for the shared Investigation workspace
// ─────────────────────────────────────────────────────────────────────────────

export interface PresencePayload {
  type: "presence_update";
  case_id: string;
  viewers: string[];        // display names of investigators currently viewing
  viewer_count: number;
}

export interface ConnectedUsersPayload {
  type: "connected_users";
  count: number;
}

export interface CaseCreatedPayload {
  type: "case_created";
  data: Record<string, any>;
}

export interface CaseUpdatedPayload {
  type: "case_updated" | "case_closed" | "case_reopened" | "case_assigned" | "case_escalated";
  case_id: string;
  data?: Record<string, any>;
  assigned_to?: string;
  reassigned_from?: string;
  escalation_level?: string;
  escalated_to?: string;
  reason?: string;
  action?: string;
}

export interface CaseNoteAddedPayload {
  type: "case_note_added";
  case_id: string;
  note: {
    id: string;
    investigator: string;
    timestamp: string;
    text: string;
  };
}

export interface PongPayload {
  type: "pong";
}

export type InvestigationEvent =
  | PresencePayload
  | ConnectedUsersPayload
  | CaseCreatedPayload
  | CaseUpdatedPayload
  | CaseNoteAddedPayload
  | PongPayload;

