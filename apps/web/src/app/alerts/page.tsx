"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAlertStore } from "../../store/useAlertStore";
import { getRiskColorClass } from "../../types/alerts";

export default function AlertsPage() {
  const { alerts, selectedAlertId, setSelectedAlertId, resolveAlert } = useAlertStore();
  const [activeTab, setActiveTab] = useState("History");
  const [riskRange, setRiskRange] = useState(50);

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) || alerts[0];

  const stats = [
    { label: "CRITICAL", value: 14, desc: "↑ 2 since last hour", color: "text-risk-critical border-risk-critical/20" },
    { label: "HIGH", value: 42, desc: "Requires immediate attention", color: "text-risk-high border-risk-high/20" },
    { label: "MED/LOW", value: 128, desc: "Scheduled for review", color: "text-risk-medium border-risk-medium/20" },
    { label: "NEW TODAY", value: 56, desc: "Total ingested in 24h", color: "text-primary border-primary/20" },
    { label: "RESOLVED", value: "1.2k", desc: "94% resolution rate", color: "text-risk-low border-risk-low/20" },
  ];

  const handleAction = async (action: "DISMISSED" | "ESCALATED") => {
    if (!selectedAlert) return;
    await resolveAlert(selectedAlert.id, action);
    alert(`Triage action completed successfully: marked as ${action}`);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-on-surface">Alert Management</h2>
          <span className="px-2.5 py-0.5 bg-risk-low/10 border border-risk-low/20 text-risk-low text-[10px] font-label-mono uppercase tracking-wider rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-risk-low animate-pulse"></span>
            Systems Operational
          </span>
        </div>
      </div>

      {/* KPI Stats Block */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-outline-variant/30 bg-[#0e1220] space-y-1"
          >
            <div className="text-[9px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
              {stat.label}
            </div>
            <div className="text-2xl font-extrabold text-on-surface leading-tight font-display-kpi flex items-center justify-between">
              {stat.value}
              {stat.label === "CRITICAL" && (
                <span className="material-symbols-outlined text-risk-critical text-base">warning</span>
              )}
            </div>
            <div className={`text-[9px] font-semibold text-on-surface-variant/80`}>
              {stat.desc}
            </div>
          </div>
        ))}
      </section>

      {/* Filters Bar */}
      <section className="flex flex-wrap items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 text-body-sm">
        <div className="flex items-center gap-1.5 text-on-surface font-semibold">
          <span className="material-symbols-outlined text-base">filter_alt</span>
          FILTERS
        </div>

        <select className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-on-surface-variant">
          <option>All Severities</option>
        </select>

        <select className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-on-surface-variant">
          <option>All Status</option>
        </select>

        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-1 text-xs">
          <span className="text-on-surface-variant">RISK:</span>
          <input
            type="range"
            min="50"
            max="100"
            value={riskRange}
            onChange={(e) => setRiskRange(Number(e.target.value))}
            className="w-16 h-1 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
          />
          <span className="font-label-mono text-primary font-semibold">{riskRange}-100</span>
        </div>

        <button className="px-3 py-1.5 bg-[#002a78]/30 border border-primary/20 rounded-lg text-xs font-semibold text-primary">
          Last 24 Hours
        </button>

        <select className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-on-surface-variant">
          <option>Bank: Global North-East</option>
        </select>

        <button className="text-on-surface-variant hover:text-on-surface text-xs font-semibold ml-auto">
          Clear All
        </button>
      </section>

      {/* Main content split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Alerts Table (Left) */}
        <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-low">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest bg-surface-container-high/20">
                <th className="px-4 py-4">Severity</th>
                <th className="px-4 py-4 text-center">Score</th>
                <th className="px-4 py-4">Account</th>
                <th className="px-4 py-4">Customer</th>
                <th className="px-4 py-4">Rule Trigger</th>
                <th className="px-4 py-4 text-center">ML</th>
                <th className="px-4 py-4 text-center">Graph</th>
                <th className="px-4 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => {
                const isSelected = selectedAlertId === alert.id;
                const riskColor = getRiskColorClass(alert.riskScore);
                const isCritical = alert.riskScore >= 90;
                const isHigh = alert.riskScore >= 70 && alert.riskScore < 90;

                return (
                  <tr
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    className={`cursor-pointer transition-colors border-b border-outline-variant/10 text-xs hover:bg-surface-container-high/40 ${
                      isSelected ? "bg-primary-container/10 border-l-2 border-l-primary" : ""
                    }`}
                  >
                    <td className="px-4 py-4 font-bold uppercase flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isCritical
                            ? "bg-risk-critical animate-pulse"
                            : isHigh
                            ? "bg-risk-high"
                            : "bg-risk-medium"
                        }`}
                      ></span>
                      {isCritical ? "CRITICAL" : isHigh ? "HIGH" : "MEDIUM"}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-on-surface font-label-mono">
                      {alert.riskScore}
                    </td>
                    <td className="px-4 py-4 font-label-mono text-on-surface">{alert.sourceAccount}</td>
                    <td className="px-4 py-4 font-semibold text-on-surface truncate max-w-[120px]">
                      {alert.entityDetails?.name}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-0.5 rounded border text-[9px] font-semibold ${
                          isCritical
                            ? "text-risk-critical border-risk-critical/20 bg-risk-critical/10"
                            : "text-on-surface-variant border-outline-variant/30 bg-[#0e1220]"
                        }`}
                      >
                        {alert.tippingPoint?.split(":")[0]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-label-mono text-on-surface-variant">
                      {alert.shapExplanation ? Object.values(alert.shapExplanation)[0] : "0.50"}
                    </td>
                    <td className="px-4 py-4 text-center font-label-mono text-on-surface-variant">
                      {alert.shapExplanation ? Object.values(alert.shapExplanation)[1] : "0.50"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="px-2 py-0.5 rounded bg-[#0d0f19] border border-outline-variant/30 text-[9px] font-label-mono uppercase text-on-surface-variant">
                        {isSelected ? "NEW" : alert.status === "PENDING" ? "NEW" : alert.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Table Footer */}
          <div className="p-4 bg-surface-container-high/20 flex justify-between items-center text-caption text-on-surface-variant font-label-mono border-t border-outline-variant/20">
            <span>Showing 4 of 1,248 alerts</span>
            <div className="flex gap-2">
              <button className="px-2 py-1 hover:text-on-surface">Previous</button>
              <button className="px-2.5 py-1 bg-primary text-on-primary font-bold rounded">1</button>
              <button className="px-2.5 py-1 hover:text-on-surface">2</button>
              <button className="px-2.5 py-1 hover:text-on-surface">3</button>
              <button className="px-2 py-1 hover:text-on-surface">Next</button>
            </div>
          </div>
        </div>

        {/* Right Sidebar Triage Sheet (Vasily Kandinsky) */}
        {selectedAlert && (
          <div className="lg:col-span-1 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
            {/* Header info */}
            <div className="flex justify-between items-start pb-4 border-b border-outline-variant/20">
              <div className="space-y-1">
                <div className="flex gap-2 items-center text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
                  <span className="text-risk-critical">{selectedAlert.id}</span>
                  <span>•</span>
                  <span>{selectedAlert.sourceAccount}</span>
                </div>
                <h3 className="font-headline-sm text-2xl font-bold text-on-surface">
                  {selectedAlert.entityDetails?.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAlertId(null)}
                className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors"
              >
                close
              </button>
            </div>

            {/* Score and context container */}
            <div className="grid grid-cols-2 gap-4 items-center p-4 bg-[#07090e] border border-outline-variant/20 rounded-xl">
              {/* Circular Score Gauge */}
              <div className="flex flex-col items-center justify-center relative w-24 h-24 mx-auto">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="38" stroke="rgba(67, 70, 85, 0.2)" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="48"
                    cy="48"
                    r="38"
                    stroke="#F97316"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray="238"
                    strokeDashoffset={238 - (238 * selectedAlert.riskScore) / 100}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-on-surface font-display-kpi leading-none">
                    {selectedAlert.riskScore}
                  </span>
                  <span className="text-[8px] font-label-mono text-on-surface-variant uppercase tracking-wider mt-1">
                    Risk Score
                  </span>
                </div>
              </div>

              {/* Context specifics */}
              <div className="space-y-3 font-body-sm text-[10px]">
                <div className="space-y-0.5">
                  <div className="text-on-surface-variant font-label-mono uppercase tracking-wider">
                    Bank Context
                  </div>
                  <div className="text-on-surface font-semibold truncate max-w-[120px]">
                    Bank of Geneva (Branch 082)
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-on-surface-variant font-label-mono uppercase tracking-wider">
                    Triggered At
                  </div>
                  <div className="text-on-surface font-semibold font-label-mono truncate max-w-[120px]">
                    2024-10-24 14:22:01 UTC
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Contributors */}
            <div className="space-y-3">
              <h4 className="font-label-mono text-[9px] text-on-surface-variant uppercase font-bold tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">risk_rules</span>
                Risk Contributors
              </h4>
              <div className="space-y-2">
                {selectedAlert.shapExplanation &&
                  Object.entries(selectedAlert.shapExplanation).map(([factor, weight]) => {
                    const percentage = Math.round(weight * 100);
                    return (
                      <div
                        key={factor}
                        className="flex justify-between items-center p-3 rounded-lg bg-[#07090e] border border-outline-variant/10 text-xs"
                      >
                        <span className="text-on-surface-variant font-medium">{factor}</span>
                        <span className="font-bold text-risk-high">+{percentage} pts</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Network Preview cluster visual */}
            <div className="space-y-3">
              <h4 className="font-label-mono text-[9px] text-on-surface-variant uppercase font-bold tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs font-semibold">hub</span>
                Network Preview
              </h4>
              <div className="relative w-full aspect-[16/9] bg-[#07090e] border border-outline-variant/20 rounded-xl overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#434655_1px,transparent_1px)] [background-size:12px_12px]"></div>
                <img
                  className="w-full object-cover scale-110 opacity-70"
                  alt="MuleShield network preview nodes link clusters"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBG5YBxdAPcpRz4rSGHtfEYDCn4JAXZPIivXJtXxCLieGm66yA96WrF7XyH8PnwGaD6WJgjNwEPpHKePmClG-X_khOHl-asqPh4aMjeJZhNd8ONFcFEW93pQuRDY8DPKbMhwIxgbggOLDvp4H-laBsvFaTg9D7QN-JpIIkNS7XXZRgEg-NKW0p51Z9UiUGkd2ExDH3kgnssXoo_NolJtMr39HGuxdq7taXmfnWyeYSCrwvq0ys0FTNc"
                />
              </div>
            </div>

            {/* Tab selectors */}
            <div className="space-y-4">
              <div className="flex border-b border-outline-variant/20">
                {["History", "Devices", "Geo-Location"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-center text-[10px] font-label-mono uppercase tracking-wider font-bold transition-colors border-b-2 ${
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "History" && (
                <div className="flex justify-between items-center p-3 rounded-xl bg-[#07090e] border border-outline-variant/10 text-xs">
                  <div>
                    <div className="font-semibold text-on-surface">SWIFT TRSF OUT</div>
                    <div className="text-[10px] text-on-surface-variant font-label-mono mt-0.5">TX-998812</div>
                  </div>
                  <div className="font-bold text-risk-critical">-${selectedAlert.amount.toLocaleString()}</div>
                </div>
              )}
              {activeTab === "Devices" && (
                <div className="p-3 rounded-xl bg-[#07090e] border border-outline-variant/10 text-xs text-on-surface-variant leading-relaxed">
                  Linked Hardware: <strong className="text-on-surface">{selectedAlert.entityDetails?.deviceId}</strong>
                </div>
              )}
              {activeTab === "Geo-Location" && (
                <div className="p-3 rounded-xl bg-[#07090e] border border-outline-variant/10 text-xs text-on-surface-variant leading-relaxed">
                  Terminal IP: <strong className="text-on-surface">{selectedAlert.entityDetails?.ipAddress}</strong>
                </div>
              )}
            </div>

            {/* Action buttons grid */}
            <div className="space-y-3 pt-2 border-t border-outline-variant/10">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAction("ESCALATED")}
                  className="py-3 bg-primary text-on-primary font-bold rounded-xl text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm font-semibold">assignment</span>
                  Convert to Case
                </button>
                <button className="py-3 border border-outline/30 text-on-surface font-bold rounded-xl text-xs hover:bg-white/5 transition-all flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-sm font-semibold">group_add</span>
                  Assign
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAction("ESCALATED")}
                  className="py-3 border border-outline/30 text-on-surface font-bold rounded-xl text-xs hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm font-semibold">flag</span>
                  Escalate
                </button>
                <button
                  onClick={() => handleAction("DISMISSED")}
                  className="py-3 border border-outline/30 text-on-surface-variant hover:text-on-surface font-bold rounded-xl text-xs hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm font-semibold">delete_outline</span>
                  Ignore
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
