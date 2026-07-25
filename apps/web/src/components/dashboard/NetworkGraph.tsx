"use client";

import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";

interface NetworkGraphProps {
  accountId: string;
}

export default function NetworkGraph({ accountId }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cy: cytoscape.Core;

    const fetchAndRenderGraph = async () => {
      try {
        const { apiClient } = await import("../../services/api-client");
        const decodedAccountId = decodeURIComponent(accountId);
        const res = await apiClient.get<any>(`/api/v1/graph/expand/ACC-${encodeURIComponent(decodedAccountId)}`);
        const graphData =
          res?.nodes && Array.isArray(res.nodes)
            ? res
            : res?.data?.nodes && Array.isArray(res.data.nodes)
            ? res.data
            : null;

        let elements: any[] = [];
        if (graphData) {
          // Map backend nodes to Cytoscape format
          const nodes = graphData.nodes.map((n: any) => ({
            data: {
              id: n.id,
              label: n.label || n.id,
              type: n.type || "account",
              risk: n.riskScore >= 70 ? "critical" : n.riskScore >= 40 ? "medium" : "low"
            }
          }));
          // Map backend edges to Cytoscape format
          const edges = (graphData.edges || []).map((e: any) => ({
            data: {
              id: e.id,
              source: e.source,
              target: e.target,
              label: e.label || "TRANSFER"
            }
          }));
          
          // Ensure the source account node exists to prevent Cytoscape errors
          if (!nodes.find((n: any) => n.data.id === `ACC-${decodedAccountId}`)) {
            nodes.push({
              data: {
                id: `ACC-${decodedAccountId}`,
                label: `Account: ${decodedAccountId}`,
                type: "account",
                risk: "high"
              }
            });
          }
          
          elements = [...nodes, ...edges];
        }

        if (elements.length === 0) {
          // Fallback if no data (for example, if this account doesn't exist in DB)
          elements = [
            { data: { id: `ACC-${decodedAccountId}`, label: `Account: ${decodedAccountId}`, type: "account", risk: "high" } }
          ];
        }

        cy = cytoscape({
          container: containerRef.current,
          elements: elements,
      boxSelectionEnabled: false,
      autounselectify: false,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#434655",
            label: "data(label)",
            color: "#E2E8F0",
            "font-size": "10px",
            "text-valign": "bottom",
            "text-margin-y": 6,
            "width": "32px",
            "height": "32px",
            "transition-property": "background-color, width, height",
            "transition-duration": 0.25,
            "border-width": "2px",
            "border-color": "#1E293B",
          },
        },
        {
          selector: 'node[type="customer"]',
          style: {
            "background-color": "#3B82F6",
            "shape": "ellipse",
            "width": "38px",
            "height": "38px",
          },
        },
        {
          selector: 'node[type="account"]',
          style: {
            "background-color": "#EF4444",
            "shape": "rectangle",
            "border-color": "#F87171",
            "border-width": "3px",
          },
        },
        {
          selector: 'node[type="device"]',
          style: {
            "background-color": "#F59E0B",
            "shape": "diamond",
          },
        },
        {
          selector: 'node[type="ip"]',
          style: {
            "background-color": "#8B5CF6",
            "shape": "hexagon",
          },
        },
        {
          selector: 'node[risk="critical"]',
          style: {
            "border-color": "#EF4444",
            "border-width": "3px",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "rgba(100, 116, 139, 0.4)",
            "target-arrow-color": "rgba(100, 116, 139, 0.4)",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": "7px",
            color: "#64748B",
            "text-margin-y": -6,
          },
        },
        {
          selector: "node:selected",
          style: {
            "background-color": "#10B981",
            "border-color": "#34D399",
            "border-width": "4px",
          },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        nodeOverlap: 20,
        nestingFactor: 1.2,
        gravity: 1,
        numIter: 1000,
        initialTemp: 1000,
        coolingFactor: 0.99,
        minTemp: 1.0,
      } as any,
    });

    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      setSelectedNodeInfo(
        `Type: ${node.data("type").toUpperCase()} | Label: ${node.data("label")} (Risk: ${node.data("risk").toUpperCase()})`
      );

      // Highlight neighbors
      const neighbors = node.neighborhood();
      cy.elements().addClass("dimmed");
      node.removeClass("dimmed");
      neighbors.removeClass("dimmed");
    });

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        setSelectedNodeInfo(null);
        cy.elements().removeClass("dimmed");
      }
    });

    cy.on("tap", "edge", (evt) => {
      const edge = evt.target;
      const label = edge.data("label");
      const source = edge.data("source");
      const target = edge.data("target");

      if (label === "TRANSFER") {
        const mockTxId = `998A-112B`; // Using mock ID that matches the page's structure
        window.location.href = `/transactions/${mockTxId}`;
      } else {
        setSelectedNodeInfo(`Edge Type: ${label} | Connected Entities: ${source} <-> ${target}`);
      }
    });

    // Add styles for dimming other nodes
    cy.style()
      .selector(".dimmed")
      .style({
        opacity: 0.25,
      })
      .update();

      } catch (error) {
        console.error("Failed to load graph data dynamically", error);
      }
    };
    fetchAndRenderGraph();

    return () => {
      if (cy) cy.destroy();
    };
  }, [accountId]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between min-h-[300px]">
      <div ref={containerRef} className="w-full flex-1 min-h-[250px] bg-[#07090e] rounded-xl overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#434655_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </div>
      
      {/* Selection Tooltip Info Banner */}
      <div className="mt-3 px-4 py-2.5 bg-surface-container-high/40 border border-outline-variant/15 rounded-xl text-[10px] font-label-mono text-on-surface-variant flex justify-between items-center">
        <span>
          {selectedNodeInfo || "Click any node on the graph canvas to inspect structural relationships"}
        </span>
        {selectedNodeInfo && (
          <button
            onClick={() => setSelectedNodeInfo(null)}
            className="text-primary hover:underline font-bold"
          >
            Clear Selection
          </button>
        )}
      </div>
    </div>
  );
}
