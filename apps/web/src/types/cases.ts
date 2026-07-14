export interface CaseNote {
  id: string;
  investigator: string;
  timestamp: string;
  text: string;
}

export interface Case {
  id: string;
  title: string;
  status: "NEW" | "INVESTIGATING" | "SAR_DRAFTED" | "CLOSED";
  riskScore: number;
  assignedTo: string;
  createdAt: string;
  description: string;
  muleNodes: string[];
  transactionsCount: number;
  totalAmount: number;
  notes: CaseNote[];
}
