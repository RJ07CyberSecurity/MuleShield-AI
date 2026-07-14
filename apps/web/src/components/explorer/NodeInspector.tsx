"use client";

import { useGraphStore } from "../../store/useGraphStore";
import { getRiskColorClass } from "../../types/alerts";

export default function NodeInspector() {
  const { nodes, selectedNodeId, expandNode, isLoading } = useGraphStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center p-8 border border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-low/40">
        <p className="text-body-sm text-on-surface-variant text-center">
          Click any node on the graph canvas to inspect structural details.
        </p>
      </div>
    );
  }

  const riskClass = getRiskColorClass(selectedNode.riskScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-label-mono text-caption text-on-surface-variant uppercase tracking-wider">
            {selectedNode.type} Node
          </span>
          <span
            className={`px-2.5 py-0.5 border rounded-full text-caption font-bold ${riskClass}`}
          >
            Risk Score: {selectedNode.riskScore}
          </span>
        </div>
        <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate">
          {selectedNode.id}
        </h3>
      </div>

      {/* Property Details */}
      <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-3 text-body-sm">
        {Object.entries(selectedNode.details).map(([key, val]) => {
          // Capitalize key
          const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
          return (
            <div
              key={key}
              className="flex justify-between items-center pb-2 last:pb-0 last:border-b-0 border-b border-outline-variant/10"
            >
              <span className="text-on-surface-variant font-medium">{formattedKey}</span>
              <span className="text-on-surface font-semibold truncate max-w-[180px]">{val}</span>
            </div>
          );
        })}
      </div>

      {/* Inspector Actions */}
      <div className="space-y-3">
        <button
          onClick={() => expandNode(selectedNode.id)}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-primary text-on-primary font-bold text-body-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">hub</span>
          {isLoading ? "Expanding..." : "Expand Connections"}
        </button>

        <button className="w-full py-3 px-4 rounded-xl border border-outline/30 text-on-surface font-bold text-body-sm hover:bg-white/5 transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm">search</span>
          Deep Investigation
        </button>
      </div>
    </div>
  );
}
