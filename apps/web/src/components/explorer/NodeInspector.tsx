"use client";

import { useState } from "react";
import { useGraphStore } from "../../store/useGraphStore";
import { useUIStore } from "../../store/useUIStore";
import { getRiskColorClass } from "../../types/alerts";

export default function NodeInspector() {
  const { nodes, edges, selectedNodeId, selectedEdgeId, expandNode, isLoading } = useGraphStore();
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<"properties" | "risk" | "hops" | "mule_summary" | "investigation">("properties");

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  // Default selection text if nothing is selected
  if (!selectedNode && !selectedEdge) {
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

  // --- Transaction Profile (Edge Selection) ---
  if (selectedEdge) {
    const details = selectedEdge.details || {};
    return (
      <div className="space-y-6 text-left animate-fade-in">
        <div className="space-y-2 pb-4 border-b border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="font-label-mono text-caption text-on-surface-variant uppercase tracking-wider">
              Transaction Edge
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary text-primary">
              {selectedEdge.label || "LINK"}
            </span>
          </div>
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate">
            {details.transactionId || selectedEdge.id}
          </h3>
        </div>

        <div className="p-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest space-y-4 text-body-sm">
          <div className="flex justify-between items-center pb-3 border-b border-outline-variant/10">
            <span className="text-on-surface-variant font-medium text-xs">Sender</span>
            <span className="text-on-surface font-semibold text-xs text-right truncate max-w-[150px]">{details.senderName || selectedEdge.source}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-outline-variant/10">
            <span className="text-on-surface-variant font-medium text-xs">Receiver</span>
            <span className="text-on-surface font-semibold text-xs text-right truncate max-w-[150px]">{details.receiverName || selectedEdge.target}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-outline-variant/10">
            <span className="text-on-surface-variant font-medium text-xs">Amount</span>
            <span className="text-on-surface font-semibold text-xs text-right text-risk-critical">{selectedEdge.label || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant font-medium text-xs">Date</span>
            <span className="text-on-surface font-semibold text-xs text-right">{details.date || "Unknown"}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              const txId = details.transactionId || selectedEdge.id;
              window.location.href = `/transactions/${txId.replace("TXN-", "").replace("e-", "")}`;
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm font-semibold">search</span>
            Deep Investigation
          </button>

          <button
            onClick={() => {
              addToast(`Transaction ${details.transactionId || selectedEdge.id} exported to ledger.`, "success");
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-outline-variant/30 text-on-surface font-bold text-xs hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export Record
          </button>
        </div>
      </div>
    );
  }

  // --- Node Profile ---
  // Ensure selectedNode exists since we passed the guard
  if (!selectedNode) return null;

  const nodeDetails = selectedNode.details || {};
  const riskClass = getRiskColorClass(selectedNode.riskScore);

  const mockRiskVectors: any[] = [];
  if (selectedNode.riskScore >= 75) {
    mockRiskVectors.push({ name: "Direct Mule Link", risk: "CRITICAL" });
    mockRiskVectors.push({ name: "Structuring Activity", risk: "CRITICAL" });
  } else if (selectedNode.riskScore >= 30) {
    mockRiskVectors.push({ name: "High Velocity Outflows", risk: "HIGH" });
  } else if (selectedNode.riskScore > 0) {
    mockRiskVectors.push({ name: "New Account Anomaly", risk: "HIGH" });
  }

  const mockHopRegistry: any[] = edges
    .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
    .map(e => {
      const isOutflow = e.source === selectedNode.id;
      const otherNodeId = isOutflow ? e.target : e.source;
      const otherNode = nodes.find(n => n.id === otherNodeId);
      const isMule = otherNode?.details?.category === "Mule Account" || otherNode?.riskScore && otherNode.riskScore >= 75;
      
      return {
        id: isMule ? `MULE: ${otherNodeId}` : otherNodeId,
        direction: isOutflow ? "OUTFLOW" : "INFLOW",
        amount: e.label || e.details?.amount || "Unknown"
      };
    });

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
      <div className="flex border-b border-outline-variant/20 overflow-x-auto custom-scrollbar">
        {["properties", "risk", "hops", ...(nodeDetails?.muleSummary ? ["mule_summary"] : [])].map((tab) => (
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
          {Object.entries(nodeDetails || {}).map(([key, val]) => {
            if (key === "muleSummary" || key === "pastRecords") return null;
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
            return (
              <div
                key={key}
                className="flex justify-between items-center pb-2 last:pb-0 last:border-b-0 border-b border-outline-variant/10"
              >
                <span className="text-on-surface-variant font-medium text-xs">{formattedKey}</span>
                <span className="text-on-surface font-semibold truncate max-w-[150px] text-xs">{val as React.ReactNode}</span>
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

      {activeTab === "mule_summary" && nodeDetails.muleSummary && (
        <div className="space-y-4 animate-fade-in text-body-sm">
          <div className="p-4 bg-risk-critical/10 border border-risk-critical/20 rounded-xl text-on-surface">
            <h4 className="font-bold text-xs text-risk-critical mb-1 uppercase tracking-wider">Detection Summary</h4>
            <p className="text-xs leading-relaxed">{nodeDetails.muleSummary as string}</p>
          </div>
          
          <div>
            <h4 className="font-bold text-xs text-on-surface-variant mb-2 uppercase tracking-wider">Past Records</h4>
            <div className="space-y-2">
              {(nodeDetails.pastRecords as string[]).map((rec, i) => (
                <div key={i} className="p-3 bg-surface-container-lowest border border-outline-variant/15 rounded-xl flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] text-risk-high mt-0.5">warning</span>
                  <span className="text-xs text-on-surface">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "investigation" && (() => {
        const relatedEdge = edges.find(e => e.source === selectedNode.id || e.target === selectedNode.id);
        const edgeDetails = relatedEdge?.details || {};
        const isSender = relatedEdge?.source === selectedNode.id;
        
        const dynTxnId = edgeDetails.transactionId || relatedEdge?.id || "N/A";
        const dynDate = edgeDetails.date || nodeDetails.created || "N/A";
        const dynTime = edgeDetails.time || "";
        const dynAmount = relatedEdge?.label || edgeDetails.amount || nodeDetails.balance || "N/A";
        const dynCustomer = isSender ? (nodeDetails.name || edgeDetails.senderName || "Unknown") : (edgeDetails.senderName || "Unknown");
        const dynReceiver = !isSender ? (nodeDetails.name || edgeDetails.receiverName || "Unknown") : (edgeDetails.receiverName || "Unknown");
        const dynLocation = nodeDetails.location || "N/A";
        const dynMode = edgeDetails.mode || nodeDetails.category || "N/A";

        return (
          <div className="p-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest space-y-4 text-body-sm animate-fade-in">
            <div className="flex justify-between items-center gap-4 pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant font-medium text-xs shrink-0">Node ID</span>
              <span className="text-on-surface font-semibold text-xs text-right truncate">{selectedNode.id}</span>
            </div>
            <div className="flex justify-between items-center gap-4 pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant font-medium text-xs shrink-0">Transaction ID</span>
              <span className="text-on-surface font-semibold text-xs text-right truncate">{dynTxnId}</span>
            </div>
            <div className="flex justify-between items-center gap-4 pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant font-medium text-xs shrink-0">Timestamp</span>
              <span className="text-on-surface font-semibold text-xs text-right truncate">{dynDate} {dynTime}</span>
            </div>
            <div className="flex justify-between items-center gap-4 pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant font-medium text-xs shrink-0">Amount</span>
              <span className="text-on-surface font-semibold text-xs text-right text-risk-critical truncate">{dynAmount}</span>
            </div>
            <div className="flex justify-between items-center gap-4 pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant font-medium text-xs shrink-0">Customer Name</span>
              <span className="text-on-surface font-semibold text-xs text-right truncate">{dynCustomer}</span>
            </div>
            <div className="flex justify-between items-center gap-4 pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant font-medium text-xs shrink-0">Receiver Name</span>
              <span className="text-on-surface font-semibold text-xs text-right truncate">{dynReceiver}</span>
            </div>
            <div className="flex justify-between items-center gap-4 pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant font-medium text-xs shrink-0">Location</span>
              <span className="text-on-surface font-semibold text-xs text-right truncate">{dynLocation}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-on-surface-variant font-medium text-xs shrink-0">Category / Mode</span>
              <span className="text-on-surface font-semibold text-xs text-right truncate">{dynMode}</span>
            </div>
          </div>
        );
      })()}

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
          onClick={() => {
            setActiveTab("investigation");
          }}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl border border-primary/40 bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm font-semibold">troubleshoot</span>
          Deep Investigation
        </button>
      </div>
    </div>
  );
}
