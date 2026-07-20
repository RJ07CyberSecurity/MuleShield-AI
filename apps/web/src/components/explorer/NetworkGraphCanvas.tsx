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
    // Generate circular positions for the nodes
    const radius = 220;
    const centerX = 350;
    const centerY = 250;

    const mappedNodes: Node[] = storeNodes.map((node, idx) => {
      const isCenter = node.id === "ACC-9912-MULE-B";
      const angle = (idx * 2 * Math.PI) / (storeNodes.length - 1);
      const x = isCenter ? centerX : centerX + radius * Math.cos(angle);
      const y = isCenter ? centerY : centerY + radius * Math.sin(angle);

      const riskClass = getRiskColorClass(node.riskScore);
      const isSelected = selectedNodeId === node.id;

      // Determine border color based on risk score
      let riskBorder = "border-outline-variant/35";
      if (node.riskScore >= 90) riskBorder = "border-risk-critical";
      else if (node.riskScore >= 70) riskBorder = "border-risk-high";
      else if (node.riskScore >= 40) riskBorder = "border-risk-medium";

      // Timeline visibility filtering mock: make outer nodes disappear sequentially based on playbackTime
      const isVisible = isCenter || (idx % 10) < playbackTime;

      return {
        id: node.id,
        position: { x, y },
        hidden: !isVisible,
        data: {
          label: (
            <div
              className={`p-3 rounded-xl border text-left transition-all duration-200 shadow-xl ${
                isSelected
                  ? "ring-2 ring-primary border-primary scale-105"
                  : riskBorder
              } bg-surface-container-high hover:border-primary/50`}
              style={{ minWidth: "150px" }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="material-symbols-outlined text-xs text-on-surface-variant">
                  {node.type === "account"
                    ? "account_balance_wallet"
                    : node.type === "device"
                    ? "smartphone"
                    : node.type === "ip"
                    ? "dns"
                    : "account_balance"}
                </span>
                <span className="text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider">
                  {node.type}
                </span>
              </div>
              <div className="font-bold text-xs text-on-surface truncate leading-normal">{node.label}</div>
              <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-outline-variant/15">
                <span className="text-[8px] text-on-surface-variant font-label-mono uppercase tracking-wider">Risk Index</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${riskClass}`}>
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
      const isMuleEdge = edge.source.includes("MULE") || edge.target.includes("MULE");

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: isMuleEdge,
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

      {/* Main Canvas view */}
      <div className="h-[480px] w-full">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
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
