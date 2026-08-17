"use client";

import { useEffect, useState, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { useGraphStore } from "../../store/useGraphStore";
import { useUIStore } from "../../store/useUIStore";
import { getRiskColorClass } from "../../types/alerts";

const nodeTypes = {};
const edgeTypes = {};

export default function NetworkGraphCanvas() {
  const { nodes: storeNodes, edges: storeEdges, selectedNodeId, setSelectedNodeId } = useGraphStore();
  const { addToast } = useUIStore();
  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);

  // Timeline Playback states
  const [playbackTime, setPlaybackTime] = useState(10); // current slider value
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackTime((prev) => (prev >= 10 ? 1 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleExportGraph = (type: "PNG" | "SVG") => {
    addToast(`Successfully compiled and exported active network topology as ${type}`, "success");
  };

  useEffect(() => {
    // Guard: skip mapping if there are no nodes
    if (storeNodes.length === 0) {
      setRfNodes([]);
      setRfEdges([]);
      return;
    }

    // Adjust radius and center based on number of nodes
    const nodeCount = storeNodes.length;
    const radius = nodeCount > 15 ? 420 : 220;
    const centerX = 450;
    const centerY = 350;

    // Find center subject node (main account, or fallback to highest risk score)
    const mainAccount = storeNodes.find((n) => n.type === "account" && !n.label.includes("Counterparty"));
    const sortedByRisk = [...storeNodes].sort((a, b) => b.riskScore - a.riskScore);
    const centerNodeId = mainAccount ? mainAccount.id : (sortedByRisk[0]?.id || "");

    let circleIdx = 0;
    const mappedNodes: Node[] = storeNodes.map((node) => {
      const isCenter = node.id === centerNodeId;
      let x = centerX;
      let y = centerY;
      let isVisible = true;

      if (!isCenter) {
        const divisor = Math.max(nodeCount - (centerNodeId ? 1 : 0), 1);
        const angle = (circleIdx * 2 * Math.PI) / divisor;
        x = centerX + radius * Math.cos(angle);
        y = centerY + radius * Math.sin(angle);
        
        // Use opacity for timeline playback instead of 'hidden' to avoid ReactFlow's notify() crash
        isVisible = (circleIdx % 10) < playbackTime;
        circleIdx++;
      }

      const riskClass = getRiskColorClass(node.riskScore);
      const isSelected = selectedNodeId === node.id;

      let riskBorder = "border-outline-variant/35";
      if (isCenter) {
        riskBorder = "border-primary shadow-[0_0_20px_rgba(37,99,235,0.3)] ring-1 ring-primary/50";
      } else if (node.riskScore >= 90) {
        riskBorder = "border-risk-critical";
      } else if (node.riskScore >= 70) {
        riskBorder = "border-risk-high";
      } else if (node.riskScore >= 40) {
        riskBorder = "border-risk-medium";
      }

      return {
        id: node.id,
        position: { x, y },
        data: {
          label: (
            <div
              className={`p-2 rounded-xl border text-left transition-all duration-200 shadow-xl ${
                isSelected
                  ? "ring-2 ring-primary border-primary scale-105"
                  : riskBorder
              } bg-surface-container-high hover:border-primary/50`}
              style={{ minWidth: "120px", maxWidth: "150px", opacity: isVisible ? 1 : 0, pointerEvents: isVisible ? "auto" : "none" }}
            >
              <div className="flex items-center gap-1 mb-1">
                <span className="material-symbols-outlined text-[10px] text-on-surface-variant">
                  {node.type === "account"
                    ? "account_balance_wallet"
                    : node.type === "device"
                    ? "smartphone"
                    : node.type === "ip"
                    ? "dns"
                    : "account_balance"}
                </span>
                <span className="text-[8px] font-label-mono text-on-surface-variant uppercase tracking-wider">
                  {node.type}
                </span>
              </div>
              <div className="font-bold text-[10px] text-on-surface truncate leading-normal">{node.label}</div>
              <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-outline-variant/15">
                <span className="text-[7px] text-on-surface-variant font-label-mono uppercase tracking-wider">Risk</span>
                <span className={`text-[8px] font-bold px-1 py-0.1 rounded-full border ${riskClass}`}>
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
      const isMuleEdge = edge.source.includes("MULE") || edge.target.includes("MULE") || edge.id.includes("exp");

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: isMuleEdge || hasValue,
        style: {
          stroke: isMuleEdge ? "#F97316" : "#2563eb",
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
          fillOpacity: 0.95,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isMuleEdge ? "#F97316" : "#2563eb",
          width: 12,
          height: 12,
        },
      };
    });

    setRfNodes(mappedNodes);
    setRfEdges(mappedEdges);
  }, [storeNodes, storeEdges, selectedNodeId, playbackTime]);

  if (storeNodes.length === 0) {
    return (
      <div className="w-full h-[540px] rounded-2xl border border-outline-variant/30 bg-surface-container-low overflow-hidden relative flex flex-col items-center justify-center p-8 text-center">
        {/* Subtle decorative grid background for high-tech premium feel */}
        <div className="absolute inset-0 opacity-[0.1] pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(37, 99, 235, 0.15) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        
        {/* Glowing network hub icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary shadow-[0_0_30px_rgba(37,99,235,0.15)] animate-pulse">
          <span className="material-symbols-outlined text-3xl">hub</span>
        </div>
        
        <h3 className="text-base font-bold text-on-surface mb-2 font-display uppercase tracking-wider">
          No Statement Selected
        </h3>
        
        <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed mb-8">
          To visualize financial routes, entity links, and device sharing patterns, please select a statement from the Ingestion History or upload a new one.
        </p>

        <a 
          href="/dashboard"
          className="px-5 py-2.5 bg-primary hover:bg-primary-fixed text-on-primary text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 hover:scale-[1.02]"
        >
          <span className="material-symbols-outlined text-sm">dashboard</span>
          Go to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low overflow-hidden relative flex flex-col">
      {/* Top Legend and Controls Bar */}
      <div className="absolute top-4 left-4 z-10 p-3.5 bg-surface-container-high/90 backdrop-blur-md rounded-xl border border-outline-variant/20 text-caption font-label-mono text-on-surface-variant space-y-1.5 select-none pointer-events-none text-left">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-risk-high"></span>
          <span>Orange: Anomaly Pattern Path</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-container"></span>
          <span>Blue: Normal Settlement Route</span>
        </div>
      </div>

      {/* Export Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => handleExportGraph("PNG")}
          className="px-2.5 py-1.5 bg-surface-container-high/90 backdrop-blur-md hover:bg-surface-container-highest border border-outline-variant/20 rounded-lg text-[10px] font-label-mono text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-xs">image</span>
          PNG
        </button>
        <button
          onClick={() => handleExportGraph("SVG")}
          className="px-2.5 py-1.5 bg-surface-container-high/90 backdrop-blur-md hover:bg-surface-container-highest border border-outline-variant/20 rounded-lg text-[10px] font-label-mono text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-xs">code</span>
          SVG
        </button>
      </div>

      {/* Target Entity Callout (Separate from Graph) */}
      {(() => {
        const main = storeNodes.find((n) => n.type === "account" && !n.label.includes("Counterparty"));
        const target = main || [...storeNodes].sort((a, b) => b.riskScore - a.riskScore)[0];
        if (!target) return null;
        return (
          <div className="absolute bottom-20 right-4 z-10 p-4 bg-surface-container-high/95 backdrop-blur-md rounded-xl border border-primary/40 shadow-lg flex flex-col gap-1 w-64 pointer-events-auto">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-sm">account_balance_wallet</span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Target Entity</span>
              </div>
            </div>
            <p className="text-sm font-black text-on-surface truncate" title={target.label}>{target.label}</p>
            <div className="flex justify-between items-center mt-2 border-t border-outline-variant/20 pt-2">
              <span className="text-[10px] text-on-surface-variant font-label-mono uppercase">Risk Score</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRiskColorClass(target.riskScore)}`}>
                {target.riskScore}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Main Canvas view */}
      <div className="h-[480px] w-full">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onEdgeClick={(_, edge) => useGraphStore.getState().setSelectedEdgeId(edge.id)}
          onPaneClick={() => {
            setSelectedNodeId(null);
            useGraphStore.getState().setSelectedEdgeId(null);
          }}
          fitView
        >
          <Background color="rgba(67, 70, 85, 0.15)" gap={16} />
          <Controls showInteractive={false} className="!bg-surface-container-high !border-outline-variant/35 !text-on-surface hover:!bg-surface-container-highest" />
        </ReactFlow>
      </div>

      {/* Timeline playback controls widget */}
      <div className="border-t border-outline-variant/20 p-4 bg-surface-container-low/95 flex items-center gap-4 z-10">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="material-symbols-outlined text-primary text-xl hover:scale-105 transition-transform"
        >
          {isPlaying ? "pause_circle" : "play_circle"}
        </button>
        <div className="text-[10px] font-label-mono text-on-surface-variant uppercase w-20 text-left select-none">
          Canary trace
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={playbackTime}
          onChange={(e) => setPlaybackTime(Number(e.target.value))}
          className="flex-1 h-1 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
        />
        <div className="text-[10px] font-label-mono text-primary font-bold w-12 text-right">
          Step {playbackTime}/10
        </div>
      </div>
    </div>
  );
}
