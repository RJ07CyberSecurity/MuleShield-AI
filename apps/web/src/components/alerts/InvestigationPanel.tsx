"use client";

import React, { useState } from "react";
import { Alert } from "../../types/alerts";

interface InvestigationPanelProps {
  alert: Alert;
  onClose: () => void;
  onAction: (action: "DISMISSED" | "ESCALATED") => void;
}

export default function InvestigationPanel({ alert, onClose, onAction }: InvestigationPanelProps) {
  const [activeTab, setActiveTab] = useState("AI Analysis");
  
  const isCritical = alert.riskScore >= 90;
  const isHigh = alert.riskScore >= 70 && alert.riskScore < 90;
  const riskColor = isCritical ? "#DC2626" : isHigh ? "#F97316" : "#F59E0B";

  return (
    <div className="w-full lg:w-[450px] xl:w-[500px] flex-shrink-0 flex flex-col bg-surface-container-low border-l border-outline-variant/30 h-[800px] shadow-2xl rounded-xl lg:rounded-none lg:rounded-r-xl overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start p-4 border-b border-outline-variant/20 bg-surface-container-lowest sticky top-0 z-10">
        <div className="space-y-1.5">
          <div className="flex gap-2 items-center text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
            <span className={isCritical ? "text-risk-critical" : isHigh ? "text-risk-high" : "text-risk-medium"}>{alert.id}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">schedule</span>
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <h3 className="font-headline-sm text-xl font-bold text-on-surface flex items-center gap-2">
            {alert.entityDetails?.name || "Unknown Entity"}
            <span className="material-symbols-outlined text-primary text-base" title="KYC Verified">verified</span>
          </h3>
          <div className="text-xs text-on-surface-variant font-label-mono">
            {alert.sourceAccount} | Internal Bank
          </div>
        </div>
        <button
          onClick={onClose}
          className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors p-1 hover:bg-surface-container-high rounded"
        >
          close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg">
            <div className="text-[9px] font-label-mono text-on-surface-variant uppercase mb-1">Risk Rating</div>
            <div className={`font-bold ${isCritical ? 'text-risk-critical' : isHigh ? 'text-risk-high' : 'text-risk-medium'}`}>{isCritical ? "CRITICAL" : isHigh ? "HIGH" : "MEDIUM"} Risk</div>
          </div>
          <div className="p-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg">
            <div className="text-[9px] font-label-mono text-on-surface-variant uppercase mb-1">Account Age</div>
            <div className="font-bold text-on-surface">Verified</div>
          </div>
          <div className="p-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg">
            <div className="text-[9px] font-label-mono text-on-surface-variant uppercase mb-1">Tx Amount</div>
            <div className="font-bold text-on-surface">${alert.amount.toLocaleString()}</div>
          </div>
        </div>

        {/* Workspace Tabs */}
        <div className="flex border-b border-outline-variant/20 overflow-x-auto no-scrollbar">
          {["AI Analysis", "Timeline", "Network", "Device", "Behaviour"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-center text-[10px] font-label-mono uppercase tracking-wider font-bold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content: AI Analysis */}
        {activeTab === "AI Analysis" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Risk Gauge & Summary */}
            <div className="flex items-center gap-6 p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="rgba(67, 70, 85, 0.2)" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={riskColor}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * alert.riskScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-on-surface font-display-kpi leading-none">
                    {alert.riskScore}
                  </span>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-label-mono text-on-surface-variant uppercase">Model Confidence</span>
                  <span className="text-xs font-bold text-primary">{Math.min(alert.riskScore + 5, 99)}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(alert.riskScore + 5, 99)}%` }}></div>
                </div>
                <div className="text-[10px] text-on-surface-variant mt-2 leading-tight">
                  <strong className="text-on-surface">Prediction:</strong> {alert.tippingPoint || "High probability anomaly detected in transaction patterns."}
                </div>
              </div>
            </div>

            {/* AI Explanation (Horizontal Bars) */}
            <div className="space-y-3">
              <h4 className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                Risk Contributors (SHAP)
              </h4>
              <div className="space-y-2">
                {alert.shapExplanation ? (
                  Object.entries(alert.shapExplanation).map(([factor, pts], i) => {
                    const color = pts >= 0.5 ? "bg-risk-critical" : pts >= 0.2 ? "bg-risk-high" : "bg-primary";
                    const scaledPts = Math.round(pts * 100);
                    return (
                      <div key={i} className="flex flex-col gap-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant truncate max-w-[200px]">{factor}</span>
                          <span className={`font-bold ${scaledPts > 0 ? 'text-risk-high' : 'text-primary'}`}>
                            {scaledPts > 0 ? '+' : ''}{scaledPts}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden flex">
                          {scaledPts > 0 ? (
                            <div className={`h-full ${color}`} style={{ width: `${Math.min((scaledPts / 100) * 100, 100)}%` }}></div>
                          ) : (
                            <div className={`h-full ${color} ml-auto`} style={{ width: `${Math.min((Math.abs(scaledPts) / 100) * 100, 100)}%` }}></div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-on-surface-variant">No SHAP explanation available.</div>
                )}
              </div>
            </div>

            {/* Rules Triggered */}
            <div className="space-y-3">
              <h4 className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                Rules Triggered
              </h4>
              <div className="flex flex-wrap gap-2">
                {(alert.tippingPoint ? alert.tippingPoint.split(":") : ["Anomaly"]).map(rule => (
                  <span key={rule} className="px-2 py-1 bg-surface-container-highest border border-outline-variant/20 rounded-md text-[10px] font-bold text-on-surface uppercase">
                    {rule.trim()}
                  </span>
                ))}
                {alert.shapExplanation && Object.keys(alert.shapExplanation).slice(0, 3).map((rule) => (
                  <span key={rule} className="px-2 py-1 bg-surface-container-highest border border-outline-variant/20 rounded-md text-[10px] font-bold text-on-surface uppercase">
                    {rule.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Network Preview */}
        {activeTab === "Network" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
            <h4 className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
              Entity Link Analysis
            </h4>
            <div className="flex-1 w-full bg-[#07090e] border border-outline-variant/30 rounded-xl overflow-hidden relative min-h-[250px] flex items-center justify-center select-none shadow-inner">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#434655_1px,transparent_1px)] [background-size:12px_12px]"></div>
              
              <div className="relative z-10 flex flex-col items-center gap-8">
                <div className="flex items-center gap-16">
                  {/* Source node */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full border-2 border-outline-variant/50 bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant">person</span>
                    </div>
                    <span className="text-[9px] font-label-mono text-on-surface-variant">Origin</span>
                  </div>
                  
                  {/* Central suspect node */}
                  <div className="flex flex-col items-center gap-2 relative">
                    <div className="w-16 h-16 rounded-full border-2 border-risk-critical bg-risk-critical/10 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.3)] animate-pulse">
                      <span className="material-symbols-outlined text-risk-critical text-2xl">warning</span>
                    </div>
                    <span className="text-[10px] font-label-mono font-bold text-on-surface absolute -bottom-6 whitespace-nowrap">This Account</span>
                    
                    {/* Connecting lines */}
                    <div className="absolute top-1/2 -left-16 w-16 h-[2px] bg-outline-variant/30 -z-10">
                      <div className="absolute top-0 left-0 h-full w-2 bg-risk-critical shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-[slideRight_1.5s_infinite]"></div>
                    </div>
                    <div className="absolute top-1/2 left-16 w-16 h-[2px] bg-outline-variant/30 -z-10">
                       <div className="absolute top-0 left-0 h-full w-2 bg-risk-critical shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-[slideRight_1.5s_infinite_0.5s]"></div>
                    </div>
                    <div className="absolute -top-16 left-1/2 w-[2px] h-16 bg-outline-variant/30 -z-10"></div>
                  </div>

                  {/* Dest node */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full border-2 border-outline-variant/50 bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant">account_balance</span>
                    </div>
                    <span className="text-[9px] font-label-mono text-on-surface-variant">Offshore</span>
                  </div>
                </div>
                
                {/* Shared device node */}
                <div className="flex flex-col items-center gap-2 -mt-4">
                    <div className="w-10 h-10 rounded-xl border border-primary/50 bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-sm">smartphone</span>
                    </div>
                    <span className="text-[9px] font-label-mono text-primary">Shared Device (3)</span>
                </div>
              </div>
              
              <div className="absolute bottom-3 right-3">
                <button className="px-3 py-1.5 bg-surface-container-highest border border-outline-variant/30 rounded-lg text-[9px] font-bold text-on-surface uppercase hover:bg-white/10 transition-colors flex items-center gap-1">
                  Open full graph <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fallback for other tabs */}
        {["Timeline", "Device", "Behaviour"].includes(activeTab) && (
          <div className="p-8 text-center text-on-surface-variant text-sm border border-dashed border-outline-variant/30 rounded-xl">
             <span className="material-symbols-outlined text-4xl mb-2 opacity-50">construction</span>
             <p>The {activeTab} view is currently being integrated into the new operations centre layout.</p>
          </div>
        )}

      </div>

      {/* Case Management Actions Pinned to Bottom */}
      <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/20 sticky bottom-0 z-10 space-y-3 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between text-[10px] font-label-mono text-on-surface-variant uppercase px-1 mb-2">
           <span>Audit Status: <strong className="text-on-surface">Unassigned</strong></span>
           <button className="hover:text-on-surface underline">View History</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onAction("ESCALATED")}
            className="py-2.5 bg-risk-critical hover:bg-risk-critical/90 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-risk-critical/20 flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            Freeze & Escalate
          </button>
          <button
            onClick={() => onAction("ESCALATED")}
            className="py-2.5 bg-surface-container-high border border-primary/30 hover:border-primary/60 text-primary font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Assign to Me
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button className="py-2 bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-bold rounded-lg text-[10px] transition-all flex items-center justify-center gap-1">
             <span className="material-symbols-outlined text-[14px]">file_download</span> Report
          </button>
          <button className="py-2 bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-bold rounded-lg text-[10px] transition-all flex items-center justify-center gap-1">
             <span className="material-symbols-outlined text-[14px]">badge</span> Request KYC
          </button>
          <button 
             onClick={() => onAction("DISMISSED")}
             className="py-2 bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-bold rounded-lg text-[10px] transition-all flex items-center justify-center gap-1"
          >
             <span className="material-symbols-outlined text-[14px]">close</span> Dismiss
          </button>
        </div>
      </div>

    </div>
  );
}
