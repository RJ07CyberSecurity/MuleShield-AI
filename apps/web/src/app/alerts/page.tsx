"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAlertStore } from "../../store/useAlertStore";
import { useUIStore } from "../../store/useUIStore";
import { getRiskColorClass } from "../../types/alerts";

export default function AlertsPage() {
  const { alerts, selectedAlertId, setSelectedAlertId, resolveAlert } = useAlertStore();
  const { addToast } = useUIStore();
  
  const [activeTab, setActiveTab] = useState("History");
  const [riskRange, setRiskRange] = useState(50);
  
  // Custom filter states
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [bankFilter, setBankFilter] = useState("ALL");

  // Sorting state for left-hand list
  const [sortAsc, setSortAsc] = useState(false);

  const selectedAlert = useMemo(() => {
    return alerts.find((a) => a.id === selectedAlertId) || alerts[0];
  }, [alerts, selectedAlertId]);

  const stats = [
    { label: "CRITICAL", value: 14, desc: "↑ 2 since last hour", color: "text-risk-critical" },
    { label: "HIGH", value: 42, desc: "Requires attention", color: "text-risk-high" },
    { label: "MED/LOW", value: 128, desc: "Scheduled review", color: "text-risk-medium" },
    { label: "NEW TODAY", value: 56, desc: "Total ingested 24h", color: "text-primary" },
    { label: "RESOLVED", value: "1.2k", desc: "94% resolution rate", color: "text-risk-low" },
  ];

  const handleAction = async (action: "DISMISSED" | "ESCALATED") => {
    if (!selectedAlert) return;
    await resolveAlert(selectedAlert.id, action);
    addToast(`Triage action completed successfully: marked as ${action}`, "success");
  };

  // Filter alerts dynamically
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (alert.riskScore < riskRange) return false;

      if (severityFilter !== "ALL") {
        const isCritical = alert.riskScore >= 90;
        const isHigh = alert.riskScore >= 70 && alert.riskScore < 90;
        const isMedium = alert.riskScore >= 40 && alert.riskScore < 70;
        
        if (severityFilter === "CRITICAL" && !isCritical) return false;
        if (severityFilter === "HIGH" && !isHigh) return false;
        if (severityFilter === "MEDIUM" && !isMedium) return false;
      }

      if (statusFilter !== "ALL" && alert.status !== statusFilter) return false;

      // Mock bank mapping just for visual presentation
      if (bankFilter !== "ALL") {
        if (bankFilter === "GENEVA" && !alert.sourceAccount.includes("ACC")) return false;
      }

      return true;
    });
  }, [alerts, riskRange, severityFilter, statusFilter, bankFilter]);

  // Sort filtered alerts
  const sortedAlerts = useMemo(() => {
    const sorted = [...filteredAlerts];
    sorted.sort((a, b) => {
      return sortAsc ? a.riskScore - b.riskScore : b.riskScore - a.riskScore;
    });
    return sorted;
  }, [filteredAlerts, sortAsc]);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-on-surface">Alert Operations Queue</h2>
          <span className="px-2.5 py-0.5 bg-risk-low/10 border border-risk-low/20 text-risk-low text-[10px] font-label-mono uppercase tracking-wider rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-risk-low animate-pulse"></span>
            Ingest Active
          </span>
        </div>
      </div>

      {/* KPI Stats Block */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low/60 hover:bg-surface-container-low transition-colors space-y-1.5"
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
            <div className="text-[9px] font-semibold text-on-surface-variant/80">
              {stat.desc}
            </div>
          </div>
        ))}
      </section>

      {/* Filters Bar */}
      <section className="flex flex-wrap items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 text-body-sm">
        <div className="flex items-center gap-1.5 text-on-surface font-semibold">
          <span className="material-symbols-outlined text-base">filter_alt</span>
          Filters
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary/50"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical (&gt;= 90)</option>
          <option value="HIGH">High (70-89)</option>
          <option value="MEDIUM">Medium (40-69)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary/50"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">NEW / PENDING</option>
          <option value="ESCALATED">ESCALATED</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>

        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs">
          <span className="text-on-surface-variant">RISK SCORES:</span>
          <input
            type="range"
            min="40"
            max="95"
            value={riskRange}
            onChange={(e) => setRiskRange(Number(e.target.value))}
            className="w-20 h-1 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
          />
          <span className="font-label-mono text-primary font-semibold">{riskRange}-100</span>
        </div>

        <select
          value={bankFilter}
          onChange={(e) => setBankFilter(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary/50"
        >
          <option value="ALL">All Banks</option>
          <option value="GENEVA">Bank of Geneva</option>
        </select>

        <button
          onClick={() => {
            setSeverityFilter("ALL");
            setStatusFilter("ALL");
            setRiskRange(50);
            setBankFilter("ALL");
          }}
          className="text-on-surface-variant hover:text-on-surface text-xs font-semibold ml-auto transition-colors"
        >
          Clear All
        </button>
      </section>

      {/* Main content split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Alerts Table (Left) */}
        <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-low overflow-y-auto max-h-[620px]">
          <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
            <thead className="sticky top-0 bg-surface-container-low/95 backdrop-blur-md z-10 border-b border-outline-variant/20">
              <tr className="text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest">
                <th className="px-4 py-4 w-28">Severity</th>
                <th
                  onClick={() => setSortAsc(!sortAsc)}
                  className="px-4 py-4 text-center cursor-pointer hover:text-on-surface w-20"
                >
                  <div className="flex items-center justify-center gap-1">
                    Score
                    <span className="material-symbols-outlined text-xs">
                      {sortAsc ? "arrow_upward" : "arrow_downward"}
                    </span>
                  </div>
                </th>
                <th className="px-4 py-4 w-32">Source Account</th>
                <th className="px-4 py-4 w-32">Customer</th>
                <th className="px-4 py-4">Rule Trigger</th>
                <th className="px-4 py-4 text-center w-24">SHAP</th>
                <th className="px-4 py-4 text-right w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {sortedAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-on-surface-variant">
                    No matching alerts found in active queue.
                  </td>
                </tr>
              ) : (
                sortedAlerts.map((alert) => {
                  const isSelected = selectedAlertId === alert.id;
                  const isCritical = alert.riskScore >= 90;
                  const isHigh = alert.riskScore >= 70 && alert.riskScore < 90;

                  return (
                    <tr
                      key={alert.id}
                      onClick={() => setSelectedAlertId(alert.id)}
                      className={`cursor-pointer transition-colors text-xs hover:bg-surface-container-high/40 ${
                        isSelected ? "bg-primary-container/10 border-l-2 border-l-primary" : ""
                      }`}
                    >
                      <td className="px-4 py-4 font-bold uppercase truncate">
                        <div className="flex items-center gap-2">
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
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-on-surface font-label-mono">
                        {alert.riskScore}
                      </td>
                      <td className="px-4 py-4 font-label-mono text-on-surface truncate">
                        {alert.sourceAccount}
                      </td>
                      <td className="px-4 py-4 font-semibold text-on-surface truncate">
                        {alert.entityDetails?.name}
                      </td>
                      <td className="px-4 py-4 truncate text-on-surface-variant font-medium">
                        {alert.tippingPoint?.split(":")[0]}
                      </td>
                      <td className="px-4 py-4 text-center font-label-mono text-on-surface-variant/80">
                        {alert.shapExplanation ? Object.values(alert.shapExplanation)[0] : "0.50"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="px-2 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/20 text-[9px] font-label-mono uppercase text-on-surface-variant">
                          {alert.status === "PENDING" ? "NEW" : alert.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Right Sidebar Triage Sheet */}
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
                <h3 className="font-headline-sm text-xl font-bold text-on-surface">
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
            <div className="grid grid-cols-2 gap-4 items-center p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl">
              {/* Circular Score Gauge */}
              <div className="flex flex-col items-center justify-center relative w-24 h-24 mx-auto">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="38" stroke="rgba(67, 70, 85, 0.2)" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="48"
                    cy="48"
                    r="38"
                    stroke={selectedAlert.riskScore >= 90 ? "#DC2626" : selectedAlert.riskScore >= 70 ? "#F97316" : "#F59E0B"}
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray="238"
                    strokeDashoffset={238 - (238 * selectedAlert.riskScore) / 100}
                    className="transition-all duration-500 ease-out"
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
                <div className="space-y-0.5 text-left">
                  <div className="text-on-surface-variant font-label-mono uppercase tracking-wider">
                    Bank Context
                  </div>
                  <div className="text-on-surface font-semibold truncate">
                    Bank of Geneva (Branch 082)
                  </div>
                </div>
                <div className="space-y-0.5 text-left">
                  <div className="text-on-surface-variant font-label-mono uppercase tracking-wider">
                    Triggered At
                  </div>
                  <div className="text-on-surface font-semibold font-label-mono truncate">
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Contributors */}
            <div className="space-y-3">
              <h4 className="font-label-mono text-[9px] text-on-surface-variant uppercase font-bold tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">insights</span>
                Risk Contributors (SHAP)
              </h4>
              <div className="space-y-2">
                {selectedAlert.shapExplanation &&
                  Object.entries(selectedAlert.shapExplanation).map(([factor, weight]) => {
                    const percentage = Math.round(weight * 100);
                    return (
                      <div
                        key={factor}
                        className="flex justify-between items-center p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/10 text-xs"
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
              <div className="relative w-full aspect-[16/9] bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden flex items-center justify-center select-none">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#434655_1px,transparent_1px)] [background-size:12px_12px]"></div>
                {/* Clean CSS Network Node structure */}
                <div className="relative z-10 flex items-center gap-6 text-[9px] font-label-mono">
                  <div className="p-2 border border-outline-variant/35 rounded-lg bg-surface-container-low text-center">
                    <span className="material-symbols-outlined text-primary text-xs">account_balance_wallet</span>
                    <div className="text-[7px] text-on-surface-variant mt-1">SRC_ACC</div>
                  </div>
                  <div className="w-8 h-[1px] bg-primary/40 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-primary rounded-full animate-ping"></div>
                  </div>
                  <div className="p-3 border-2 border-risk-high/50 rounded-xl bg-surface-container-low text-center shadow-lg">
                    <span className="material-symbols-outlined text-risk-high text-sm">hub</span>
                    <div className="text-[8px] text-on-surface mt-1 font-bold">MULE_NODE</div>
                  </div>
                  <div className="w-8 h-[1px] bg-primary/40 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-primary rounded-full animate-ping"></div>
                  </div>
                  <div className="p-2 border border-outline-variant/35 rounded-lg bg-surface-container-low text-center">
                    <span className="material-symbols-outlined text-primary text-xs">person</span>
                    <div className="text-[7px] text-on-surface-variant mt-1">DEST_ACC</div>
                  </div>
                </div>
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
                <div className="flex justify-between items-center p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/10 text-xs">
                  <div>
                    <div className="font-semibold text-on-surface">SWIFT TRSF OUT</div>
                    <div className="text-[10px] text-on-surface-variant font-label-mono mt-0.5">TX-998812</div>
                  </div>
                  <div className="font-bold text-risk-critical">-${selectedAlert.amount.toLocaleString()}</div>
                </div>
              )}
              {activeTab === "Devices" && (
                <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/10 text-xs text-on-surface-variant leading-relaxed text-left">
                  Linked Hardware: <strong className="text-on-surface">{selectedAlert.entityDetails?.deviceId || "DEV-FNG-99812"}</strong>
                </div>
              )}
              {activeTab === "Geo-Location" && (
                <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/10 text-xs text-on-surface-variant leading-relaxed text-left">
                  Terminal IP: <strong className="text-on-surface">{selectedAlert.entityDetails?.ipAddress || "192.168.1.1"}</strong>
                </div>
              )}
            </div>

            {/* Action buttons grid */}
            <div className="space-y-3 pt-2 border-t border-outline-variant/10">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAction("ESCALATED")}
                  className="py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm font-semibold">assignment</span>
                  Escalate Case
                </button>
                <button
                  onClick={() => addToast("Assigned case to current analyst", "info")}
                  className="py-2.5 border border-outline-variant/30 text-on-surface font-bold rounded-xl text-xs hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm font-semibold">group_add</span>
                  Assign Me
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAction("ESCALATED")}
                  className="py-2.5 border border-outline-variant/30 text-on-surface font-bold rounded-xl text-xs hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm font-semibold">flag</span>
                  Mark Suspect
                </button>
                <button
                  onClick={() => handleAction("DISMISSED")}
                  className="py-2.5 border border-outline-variant/30 text-on-surface-variant hover:text-on-surface font-bold rounded-xl text-xs hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm font-semibold">delete_outline</span>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
