"use client";

import { Case } from "../../types/cases";
import Link from "next/link";
import { ExternalLink, Hub, ShieldAlert, Smartphone, UserCircle, Wallet } from "lucide-react";
import { motion } from "framer-motion";

interface NetworkGraphPreviewProps {
  caseData: Case;
}

export default function NetworkGraphPreview({ caseData }: NetworkGraphPreviewProps) {
  // A simulated mock mini-graph preview since we cannot embed a full interactive React Flow component in a small tab easily
  // We'll use absolute positioned animated nodes
  const nodes = [
    { id: 1, label: caseData.customerName, icon: <UserCircle size={16} />, x: 50, y: 50, color: "bg-primary text-on-primary", delay: 0 },
    { id: 2, label: caseData.muleNodes?.[0], icon: <Wallet size={14} />, x: 20, y: 30, color: "bg-surface-container-highest text-on-surface", delay: 0.1 },
    { id: 3, label: "Shared IP", icon: <Hub size={14} />, x: 80, y: 20, color: "bg-surface-container-highest text-on-surface", delay: 0.2 },
    { id: 4, label: "Burner Phone", icon: <Smartphone size={14} />, x: 85, y: 70, color: "bg-risk-high/20 text-risk-high border border-risk-high/30", delay: 0.3 },
    { id: 5, label: "Mule Ring X", icon: <ShieldAlert size={14} />, x: 25, y: 80, color: "bg-risk-critical text-on-primary", delay: 0.4 },
  ];

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 p-4 relative h-[300px] overflow-hidden flex items-center justify-center">
        {/* Draw mock SVG lines between nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" preserveAspectRatio="none">
          <line x1="50%" y1="50%" x2="20%" y2="30%" stroke="var(--color-primary)" strokeWidth="1" strokeDasharray="4" />
          <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="var(--color-primary)" strokeWidth="1" />
          <line x1="50%" y1="50%" x2="85%" y2="70%" stroke="var(--color-risk-high)" strokeWidth="1.5" />
          <line x1="50%" y1="50%" x2="25%" y2="80%" stroke="var(--color-risk-critical)" strokeWidth="2" />
        </svg>

        {/* Nodes */}
        {nodes.map(node => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: node.delay, type: "spring" }}
            className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className={`p-2 rounded-full shadow-lg flex items-center justify-center ${node.color}`}>
              {node.icon}
            </div>
            <div className="text-[9px] font-bold text-on-surface-variant bg-surface-container-lowest px-1.5 py-0.5 rounded border border-outline-variant/30 whitespace-nowrap shadow-sm">
              {node.label}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex justify-between items-center">
        <div>
          <h4 className="text-xs font-bold text-primary">Full Network Analysis</h4>
          <p className="text-[10px] text-on-surface-variant mt-0.5">Explore 3rd-degree linkages in the 3D Graph module.</p>
        </div>
        <Link
          href={`/graph?case=${caseData.id}`}
          className="px-3 py-1.5 bg-primary text-on-primary text-[10px] font-bold rounded-lg shadow-md hover:bg-primary-fixed transition-colors flex items-center gap-1.5"
        >
          Open Graph <ExternalLink size={12} />
        </Link>
      </div>
      
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 p-3">
        <h4 className="text-[10px] font-label-mono text-on-surface-variant font-bold uppercase tracking-wider mb-2">Key Linkages</h4>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-xs text-on-surface">
            <ShieldAlert size={12} className="text-risk-critical" />
            Direct link to <span className="font-bold">Mule Ring X</span> (Known Organised Crime Group)
          </li>
          <li className="flex items-center gap-2 text-xs text-on-surface">
            <Smartphone size={12} className="text-risk-high" />
            Device ID shared with 4 other flagged accounts
          </li>
        </ul>
      </div>
    </div>
  );
}
