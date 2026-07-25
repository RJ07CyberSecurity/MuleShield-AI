import { create } from "zustand";
import { NetworkNode, NetworkEdge, GraphData } from "../types/graph";
import { apiClient } from "../services/api-client";

interface GraphState {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchGraphData: (alertId?: string, ingestionId?: string) => Promise<void>;
  expandNode: (nodeId: string) => Promise<void>;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  resetGraph: () => void;
}

const mockGraph: GraphData = {
  nodes: [],
  edges: [],
};

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  isLoading: false,
  error: null,

  fetchGraphData: async (alertId, ingestionId) => {
    set({ isLoading: true, error: null });
    try {
      let endpoint = "/api/v1/graph";
      const params = [];
      if (alertId) params.push(`alert_id=${alertId}`);
      if (ingestionId) params.push(`ingestion_id=${ingestionId}`);
      if (params.length > 0) {
        endpoint += `?${params.join("&")}`;
      }
      const response = await apiClient.get<any>(endpoint);

      // Backend returns GraphDataResponse directly (not wrapped in ResponseEnvelope)
      // But handle both cases
      const graphData =
        response?.nodes && Array.isArray(response.nodes)
          ? response
          : response?.data?.nodes && Array.isArray(response.data.nodes)
          ? response.data
          : null;

      if (graphData !== null) {
        set({
          nodes: graphData.nodes,
          edges: graphData.edges || [],
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
        console.warn("No graph data from backend.");
      }
    } catch (err) {
      set({ isLoading: false });
      console.warn("Backend Graph API not reachable.");
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
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  resetGraph: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      error: null,
    });
  },
}));
