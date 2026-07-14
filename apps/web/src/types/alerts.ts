export interface Alert {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  sourceAccount: string;
  destinationAccount: string;
  riskScore: number; // 0 to 100
  status: "PENDING" | "ESCALATED" | "DISMISSED";
  timestamp: string;
  shapExplanation?: Record<string, number>;
  tippingPoint?: string;
  entityDetails?: {
    name: string;
    category: string;
    deviceId: string;
    ipAddress: string;
  };
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 90) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

export function getRiskColorClass(score: number): string {
  const level = getRiskLevel(score);
  switch (level) {
    case "CRITICAL":
      return "text-risk-critical border-risk-critical/30 bg-risk-critical/10";
    case "HIGH":
      return "text-risk-high border-risk-high/30 bg-risk-high/10";
    case "MEDIUM":
      return "text-risk-medium border-risk-medium/30 bg-risk-medium/10";
    case "LOW":
      return "text-risk-low border-risk-low/30 bg-risk-low/10";
  }
}
