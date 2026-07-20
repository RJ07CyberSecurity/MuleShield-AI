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

    // Generate graph elements dynamically for the subject account ID
    const elements = [
      // Center Subject Account Node
      {
        data: {
          id: "subject",
          label: `Account: ${accountId.substring(0, 10)}`,
          type: "account",
          risk: "high",
        },
      },
      // Customer profile node
      {
        data: {
          id: "customer",
          label: "Customer: Vasily Kandinsky",
          type: "customer",
          risk: "low",
        },
      },
      // KYC Linked Phone Node
      {
        data: {
          id: "phone",
          label: "Phone: +41 22 798 1204",
          type: "phone",
          risk: "low",
        },
      },
      // Shared Device Session Nodes
      {
        data: {
          id: "device_1",
          label: "MacBook Pro (ID: 7291a)",
          type: "device",
          risk: "medium",
        },
      },
      {
        data: {
          id: "device_2",
          label: "iPhone 15 Pro (ID: 9912c)",
          type: "device",
          risk: "critical",
        },
      },
      // Shared IP Node
      {
        data: {
          id: "ip_address",
          label: "IP: 195.176.3.11",
          type: "ip",
          risk: "critical",
        },
      },
      // Beneficiaries
      {
        data: {
          id: "beneficiary_1",
          label: "Bene: Bank of Zurich",
          type: "counterparty",
          risk: "medium",
        },
      },
      {
        data: {
          id: "beneficiary_2",
          label: "Bene: Cayman Fund (Mule)",
          type: "counterparty",
          risk: "critical",
        },
      },

      // Links (Edges)
      { data: { source: "customer", target: "subject", label: "OWNS" } },
      { data: { source: "customer", target: "phone", label: "MOBILE" } },
      { data: { source: "customer", target: "device_1", label: "LOGGED_IN" } },
      { data: { source: "customer", target: "device_2", label: "LOGGED_IN" } },
      { data: { source: "device_2", target: "ip_address", label: "USED_IP" } },
      { data: { source: "subject", target: "beneficiary_1", label: "TRANSFER" } },
      { data: { source: "subject", target: "beneficiary_2", label: "TRANSFER" } },
      { data: { source: "ip_address", target: "beneficiary_2", label: "SHARED_FOOTPRINT" } },
    ];

    const cy = cytoscape({
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

    // Add styles for dimming other nodes
    cy.style()
      .selector(".dimmed")
      .style({
        opacity: 0.25,
      })
      .update();

    return () => {
      cy.destroy();
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
