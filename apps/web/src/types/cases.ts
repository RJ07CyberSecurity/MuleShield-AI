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
