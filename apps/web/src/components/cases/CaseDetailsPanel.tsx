"use client";

import { Case } from "../../types/cases";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, CheckCircle2, AlertOctagon, FileText, UserCircle, Activity, Info, Link as LinkIcon, Network, Clock } from "lucide-react";
import { useState } from "react";
import AIExplainability from "./AIExplainability";
import InvestigationTimeline from "./InvestigationTimeline";
import NetworkGraphPreview from "./NetworkGraphPreview";
import EvidenceRepository from "./EvidenceRepository";
import CaseActionBar from "./CaseActionBar";

interface CaseDetailsPanelProps {
  caseData: Case | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: Case["status"]) => void;
  /** Display names of OTHER investigators currently viewing this case. */
  viewers?: string[];
}

type TabType = "SUMMARY" | "EXPLAINABILITY" | "TIMELINE" | "EVIDENCE" | "NETWORK";

export default function CaseDetailsPanel({ caseData, onClose, onUpdateStatus, viewers = [] }: CaseDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("SUMMARY");

  if (!caseData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="w-full flex-1 bg-surface border border-outline-variant/30 rounded-xl flex flex-col h-full overflow-hidden shadow-2xl z-20"
      >
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low/95 backdrop-blur flex justify-between items-start sticky top-0 z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-label-mono text-primary border border-primary/30 bg-primary/10 px-1.5 py-0.5 rounded font-bold">
                {caseData.id}
              </span>
              <span className={`text-[10px] font-label-mono font-bold px-1.5 py-0.5 rounded ${
                caseData.priority === "CRITICAL" ? "bg-risk-critical/10 text-risk-critical" : "bg-risk-high/10 text-risk-high"
              }`}>
                {caseData.priority} PRIORITY
              </span>
              {/* Presence indicator — other investigators viewing this case */}
              {viewers.length > 0 && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-outline-variant/30 bg-surface-container-high text-[9px] font-bold text-on-surface-variant">
                  <span className="w-1.5 h-1.5 rounded-full bg-risk-low animate-pulse" />
                  {viewers.slice(0, 3).map((name, i) => (
                    <span
                      key={i}
                      title={name}
                      className="w-4 h-4 rounded-full bg-secondary-container text-primary text-[7px] font-bold flex items-center justify-center border border-outline-variant/20"
                    >
                      {name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                    </span>
                  ))}
                  {viewers.length > 3 && (
                    <span className="text-[8px] text-on-surface-variant">+{viewers.length - 3}</span>
                  )}
                  <span>{viewers.length} also viewing</span>
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-on-surface leading-tight">{caseData.title}</h2>
            <p className="text-xs text-on-surface-variant font-medium mt-1 truncate">
              {caseData.customerName} • {caseData.muleNodes?.[0]}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-full transition-colors ml-2 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Action Bar */}
        <CaseActionBar caseData={caseData} onUpdateStatus={onUpdateStatus} />

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/30 bg-surface-container-lowest overflow-x-auto scrollbar-hide text-xs font-semibold">
          {[
            { id: "SUMMARY", label: "Summary", icon: <Info size={14} /> },
            { id: "EXPLAINABILITY", label: "AI Explain", icon: <Activity size={14} /> },
            { id: "TIMELINE", label: "Timeline", icon: <Clock size={14} /> },
            { id: "NETWORK", label: "Network", icon: <Network size={14} /> },
            { id: "EVIDENCE", label: `Evidence (${caseData.evidenceCount})`, icon: <FileText size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-surface-container-lowest">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "SUMMARY" && (
                <div className="space-y-6">
                  <section>
                    <h3 className="text-xs font-label-mono text-on-surface-variant uppercase font-bold mb-3">Customer Profile</h3>
                    <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/30 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Name</span>
                        <span className="font-medium text-on-surface">{caseData.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Account</span>
                        <span className="font-label-mono text-primary font-bold">{caseData.muleNodes?.[0]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Institution</span>
                        <span className="font-medium text-on-surface">{caseData.bank}</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-label-mono text-on-surface-variant uppercase font-bold mb-3">Risk Summary</h3>
                    <div className="bg-risk-critical/5 rounded-xl p-4 border border-risk-critical/20">
                      <div className="flex items-end gap-3 mb-4">
                        <span className="text-4xl font-display-kpi text-risk-critical leading-none">{caseData.riskScore}</span>
                        <span className="text-xs text-risk-critical/80 font-bold mb-1">/ 100 Risk Score</span>
                      </div>
                      <p className="text-xs text-on-surface leading-relaxed border-l-2 border-risk-critical pl-3">
                        {caseData.description}
                      </p>
                    </div>
                  </section>
                  
                  <section>
                    <h3 className="text-xs font-label-mono text-on-surface-variant uppercase font-bold mb-3">Triggered Rules</h3>
                    <div className="flex flex-wrap gap-2">
                      {caseData.triggeredRules?.map((rule, idx) => (
                        <span key={idx} className="px-2 py-1 rounded bg-surface-container-high border border-outline-variant/30 text-[10px] font-label-mono text-on-surface flex items-center gap-1">
                          <AlertOctagon size={10} className="text-risk-high" />
                          {rule}
                        </span>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-label-mono text-on-surface-variant uppercase font-bold mb-3">Investigator Notes</h3>
                    <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/30">
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        {caseData.investigatorNotes}
                      </p>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "EXPLAINABILITY" && <AIExplainability caseData={caseData} />}
              {activeTab === "TIMELINE" && <InvestigationTimeline events={caseData.timeline || []} />}
              {activeTab === "NETWORK" && <NetworkGraphPreview caseData={caseData} />}
              {activeTab === "EVIDENCE" && <EvidenceRepository caseData={caseData} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
