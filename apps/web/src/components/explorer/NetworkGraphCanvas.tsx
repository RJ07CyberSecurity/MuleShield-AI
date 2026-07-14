"use client";

import { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { useGraphStore } from "../../store/useGraphStore";
import { getRiskColorClass } from "../../types/alerts";

export default function NetworkGraphCanvas() {
  const { nodes: storeNodes, edges: storeEdges, selectedNodeId, setSelectedNodeId } = useGraphStore();
  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);

  useEffect(() => {
    // Generate circular positions for the nodes so they layout beautifully
    const radius = 220;
    const centerX = 350;
    const centerY = 250;

    const mappedNodes: Node[] = storeNodes.map((node, idx) => {
      // Position center node in middle, other nodes in circle
      const isCenter = node.id === "ACC-9912-MULE-B";
      const angle = (idx * 2 * Math.PI) / (storeNodes.length - 1);
      const x = isCenter ? centerX : centerX + radius * Math.cos(angle);
      const y = isCenter ? centerY : centerY + radius * Math.sin(angle);

      // Node style class based on risk score
      const riskClass = getRiskColorClass(node.riskScore);
      const isSelected = selectedNodeId === node.id;

      return {
        id: node.id,
        position: { x, y },
        data: {
          label: (
            <div
              className={`p-3 rounded-xl border text-left transition-all duration-200 shadow-md ${
                isSelected
                  ? "ring-2 ring-primary border-primary scale-105"
                  : "border-outline-variant/30"
              } bg-surface-container-high`}
              style={{ minWidth: "140px" }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-xs text-on-surface-variant">
                  {node.type === "account"
                    ? "account_balance_wallet"
                    : node.type === "device"
                    ? "smartphone"
                    : node.type === "ip"
                    ? "dns"
                    : "account_balance"}
                </span>
                <span className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider">
                  {node.type}
                </span>
              </div>
              <div className="font-semibold text-xs text-on-surface truncate">{node.label}</div>
              <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-outline-variant/20">
                <span className="text-[9px] text-on-surface-variant font-label-mono">Risk Index</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${riskClass}`}>
                  {node.riskScore}
                </span>
              </div>
            </div>
          ),
        },
        style: {
          background: "transparent",
          border: "none",
          padding: 0,
        },
      };
    });

    const mappedEdges: Edge[] = storeEdges.map((edge) => {
      const hasValue = edge.value !== undefined;
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: edge.source.includes("MULE") || edge.target.includes("MULE"),
        style: {
          stroke: edge.source.includes("MULE") || edge.target.includes("MULE") ? "#F97316" : "#2563eb",
          strokeWidth: hasValue ? 2.5 : 1.5,
          opacity: 0.8,
        },
        labelStyle: {
          fill: "#e1e2ed",
          fontSize: "9px",
          fontFamily: "JetBrains Mono",
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: "#1d1f27",
          rx: 4,
          ry: 4,
          fillOpacity: 0.9,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edge.source.includes("MULE") || edge.target.includes("MULE") ? "#F97316" : "#2563eb",
          width: 12,
          height: 12,
        },
      };
    });

    setRfNodes(mappedNodes);
    setRfEdges(mappedEdges);
  }, [storeNodes, storeEdges, selectedNodeId]);

  return (
    <div className="w-full h-[550px] rounded-2xl border border-outline-variant/30 bg-surface-container-low overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 p-3 bg-surface-container-high/90 backdrop-blur-md rounded-xl border border-outline-variant/30 text-caption font-label-mono text-on-surface-variant space-y-1 select-none pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-risk-high"></span>
          <span>Orange: Anomaly Pattern Path</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
          <span>Blue: Normal Interaction Path</span>
        </div>
      </div>

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        fitView
      >
        <Background color="rgba(67, 70, 85, 0.15)" gap={16} />
        <Controls showInteractive={false} className="!bg-surface-container-high !border-outline-variant/30 !text-on-surface hover:!bg-surface-container-highest" />
      </ReactFlow>
    </div>
  );
}
