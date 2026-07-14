export interface NetworkNode {
  id: string;
  type: "account" | "device" | "ip" | "bank";
  label: string;
  riskScore: number;
  details: {
    name?: string;
    balance?: string;
    category?: string;
    location?: string;
    hardware?: string;
    isp?: string;
    created?: string;
    [key: string]: any;
  };
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  label?: string; // e.g. amount
  value?: number;
  type?: string;
}

export interface GraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}
