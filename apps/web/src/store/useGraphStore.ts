import { create } from "zustand";
import { NetworkNode, NetworkEdge, GraphData } from "../types/graph";
import { apiClient } from "../services/api-client";

interface GraphState {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNodeId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchGraphData: (alertId?: string) => Promise<void>;
  expandNode: (nodeId: string) => Promise<void>;
  setSelectedNodeId: (id: string | null) => void;
  resetGraph: () => void;
}

const mockGraph: GraphData = {
  nodes: [
    {
      id: "ACC-9912-MULE-B",
      type: "account",
      label: "M. Miller (Mule B)",
      riskScore: 94,
      details: {
        name: "Marcus Miller",
        balance: "$142,500.00",
        category: "High Risk Mule Node",
        created: "2025-11-12",
        location: "New York, USA",
      },
    },
    {
      id: "ACC-5521-SARAH",
      type: "account",
      label: "S. Chambers (Acc A)",
      riskScore: 32,
      details: {
        name: "Sarah Chambers",
        balance: "$12,400.00",
        category: "Legitimate Account",
        created: "2021-04-19",
        location: "Boston, USA",
      },
    },
    {
      id: "DEV-FNG-99812",
      type: "device",
      label: "iPhone 15 Pro Max",
      riskScore: 88,
      details: {
        hardware: "Apple A17 Pro (iOS 17.4)",
        location: "New York, USA (Proxy Detected)",
        category: "Shared Hardware Identifier",
      },
    },
    {
      id: "IP-192.168.4.11",
      type: "ip",
      label: "192.168.4.11",
      riskScore: 82,
      details: {
        isp: "DigitalOcean VPN Gateway",
        location: "New Jersey, USA",
        category: "Hosting/Proxy Address",
      },
    },
    {
      id: "ACC-0912-RETAIL",
      type: "account",
      label: "A. Lin (Retail Acc)",
      riskScore: 42,
      details: {
        name: "Anna Lin",
        balance: "$4,120.00",
        category: "Secondary Smurf Node",
        created: "2024-08-30",
        location: "Queens, USA",
      },
    },
    {
      id: "BANK-GLOBAL-TRUST",
      type: "bank",
      label: "Global Trust Bank",
      riskScore: 10,
      details: {
        location: "New York City, Headquarters",
        category: "Settlement Entity",
      },
    },
  ],
  edges: [
    {
      id: "e1",
      source: "ACC-5521-SARAH",
      target: "ACC-9912-MULE-B",
      label: "$14,500.00",
      value: 14500,
    },
    {
      id: "e2",
      source: "ACC-9912-MULE-B",
      target: "DEV-FNG-99812",
      label: "Authorized Session",
    },
    {
      id: "e3",
      source: "ACC-5521-SARAH",
      target: "DEV-FNG-99812",
      label: "Associated Device",
    },
    {
      id: "e4",
      source: "DEV-FNG-99812",
      target: "IP-192.168.4.11",
      label: "NAT Route",
    },
    {
      id: "e5",
      source: "ACC-0912-RETAIL",
      target: "DEV-FNG-99812",
      label: "Authorized Session",
    },
    {
      id: "e6",
      source: "ACC-0912-RETAIL",
      target: "ACC-9912-MULE-B",
      label: "$1,200.00",
      value: 1200,
    },
    {
      id: "e7",
      source: "ACC-9912-MULE-B",
      target: "BANK-GLOBAL-TRUST",
      label: "Clearing Outflow",
    },
  ],
};

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: mockGraph.nodes,
  edges: mockGraph.edges,
  selectedNodeId: null,
  isLoading: false,
  error: null,

  fetchGraphData: async (alertId) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint = alertId
        ? `/api/v1/graph?alert_id=${alertId}`
        : "/api/v1/graph";
      const response = await apiClient.get<any>(endpoint);

      // Backend returns GraphDataResponse directly (not wrapped in ResponseEnvelope)
      // But handle both cases
      const graphData =
        response?.nodes && Array.isArray(response.nodes)
          ? response
          : response?.data?.nodes && Array.isArray(response.data.nodes)
          ? response.data
          : null;

      if (graphData && graphData.nodes.length > 0) {
        set({
          nodes: graphData.nodes,
          edges: graphData.edges || [],
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
        console.warn("No graph data from backend. Showing local simulation graph.");
      }
    } catch (err) {
      set({ isLoading: false });
      console.warn("Backend Graph API not reachable. Showing local simulation graph.");
    }
  },

  expandNode: async (nodeId) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get<any>(
        `/api/v1/graph/expand/${nodeId}`
      );
      const graphData =
        response?.nodes && Array.isArray(response.nodes)
          ? response
          : response?.data?.nodes && Array.isArray(response.data.nodes)
          ? response.data
          : null;

      if (graphData && graphData.nodes.length > 0) {
        set((state) => {
          const nodeIds = new Set(state.nodes.map((n) => n.id));
          const edgeIds = new Set(state.edges.map((e) => e.id));
          return {
            nodes: [
              ...state.nodes,
              ...graphData.nodes.filter((n: NetworkNode) => !nodeIds.has(n.id)),
            ],
            edges: [
              ...state.edges,
              ...(graphData.edges || []).filter(
                (e: NetworkEdge) => !edgeIds.has(e.id)
              ),
            ],
            isLoading: false,
          };
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      set({ isLoading: false });
      console.warn("Backend node expansion failed. Simulating node isolation.");
    }
  },

  setSelectedNodeId: (id) => {
    set({ selectedNodeId: id });
  },

  resetGraph: () => {
    set({
      nodes: mockGraph.nodes,
      edges: mockGraph.edges,
      selectedNodeId: null,
    });
  },
}));
