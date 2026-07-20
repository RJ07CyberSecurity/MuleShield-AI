"use client";

import { useState } from "react";
import { useGraphStore } from "../../store/useGraphStore";
import { useUIStore } from "../../store/useUIStore";
import { getRiskColorClass } from "../../types/alerts";

export default function NodeInspector() {
  const { nodes, selectedNodeId, expandNode, isLoading } = useGraphStore();
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<"properties" | "risk" | "hops">("properties");

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center p-8 border border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-low/40 text-center select-none min-h-[350px]">
        <div>
          <span className="material-symbols-outlined text-on-surface-variant/40 text-4xl mb-2">touch_app</span>
          <p className="text-body-sm text-on-surface-variant max-w-[180px] mx-auto leading-normal">
            Click any node on the graph canvas to inspect structural details.
          </p>
        </div>
      </div>
    );
  }

  const riskClass = getRiskColorClass(selectedNode.riskScore);

  const mockRiskVectors = [
    { name: "Overlapping IP sessions", risk: "CRITICAL" },
    { name: "Impossible speed vector", risk: "HIGH" },
    { name: "Canary routing mismatch", risk: "MEDIUM" },
  ];

  const mockHopRegistry = [
    { direction: "INFLOW", amount: "$15,200", id: "TXN-0921" },
    { direction: "OUTFLOW", amount: "$14,500", id: "TXN-8821" },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-outline-variant/20">
        <div className="flex items-center justify-between">
          <span className="font-label-mono text-caption text-on-surface-variant uppercase tracking-wider">
            {selectedNode.type} Node
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskClass}`}>
            Risk: {selectedNode.riskScore}
          </span>
        </div>
        <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate">
          {selectedNode.id}
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/20">
        {["properties", "risk", "hops"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 pb-2 text-center text-[10px] font-label-mono uppercase tracking-wider font-bold transition-all border-b-2 ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "properties" && (
        <div className="p-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest space-y-3 text-body-sm animate-fade-in">
          {Object.entries(selectedNode.details).map(([key, val]) => {
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
            return (
              <div
                key={key}
                className="flex justify-between items-center pb-2 last:pb-0 last:border-b-0 border-b border-outline-variant/10"
              >
                <span className="text-on-surface-variant font-medium text-xs">{formattedKey}</span>
                <span className="text-on-surface font-semibold truncate max-w-[150px] text-xs">{val}</span>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "risk" && (
        <div className="space-y-2 animate-fade-in">
          {mockRiskVectors.map((vector, i) => (
            <div key={i} className="p-3 bg-surface-container-lowest border border-outline-variant/15 rounded-xl flex justify-between items-center text-xs">
              <span className="text-on-surface font-medium">{vector.name}</span>
              <span className={`text-[9px] font-bold font-label-mono uppercase ${
                vector.risk === "CRITICAL" ? "text-risk-critical" : "text-risk-high"
              }`}>{vector.risk}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "hops" && (
        <div className="space-y-2 animate-fade-in">
          {mockHopRegistry.map((hop, i) => (
            <div key={i} className="p-3 bg-surface-container-lowest border border-outline-variant/15 rounded-xl flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-sm ${
                  hop.direction === "INFLOW" ? "text-risk-low" : "text-risk-high"
                }`}>{hop.direction === "INFLOW" ? "download" : "upload"}</span>
                <div>
                  <span className="font-semibold text-on-surface">{hop.direction}</span>
                  <p className="text-[9px] font-label-mono text-on-surface-variant leading-none">{hop.id}</p>
                </div>
              </div>
              <span className="font-bold text-on-surface">{hop.amount}</span>
            </div>
          ))}
        </div>
      )}

      {/* Inspector Actions */}
      <div className="space-y-3 pt-2">
        <button
          onClick={() => {
            expandNode(selectedNode.id);
            addToast(`Expanded transaction relations for node: ${selectedNode.id}`, "success");
          }}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm font-semibold">hub</span>
          {isLoading ? "Expanding..." : "Expand Connections"}
        </button>

        <button
          onClick={() => addToast(`Triggered detailed entity deep investigation for: ${selectedNode.id}`, "info")}
          className="w-full py-2.5 px-4 rounded-xl border border-outline-variant/30 text-on-surface font-bold text-xs hover:bg-white/5 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">search</span>
          Deep Investigation
        </button>
      </div>
    </div>
  );
}
