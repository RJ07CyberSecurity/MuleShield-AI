"use client";

import { useEffect } from "react";
import NetworkGraphCanvas from "../../components/explorer/NetworkGraphCanvas";
import NodeInspector from "../../components/explorer/NodeInspector";
import { useGraphStore } from "../../store/useGraphStore";

export default function ExplorerPage() {
  const { fetchGraphData, resetGraph } = useGraphStore();

  useEffect(() => {
    fetchGraphData();
    return () => resetGraph();
  }, [fetchGraphData, resetGraph]);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <p className="text-body-sm text-on-surface-variant">
            Explore linked entities, device sharing patterns, and proxy/IP usage patterns to map money mule rings.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={resetGraph}
            className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 rounded-xl text-body-sm font-semibold transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm text-on-surface-variant">refresh</span>
            Reset Layout
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Network Diagram Canvas (Left) */}
        <div className="lg:col-span-3">
          <NetworkGraphCanvas />
        </div>

        {/* Node Properties Panel (Right) */}
        <div className="lg:col-span-1 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low">
          <NodeInspector />
        </div>
      </div>
    </div>
  );
}
