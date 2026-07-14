"use client";

import { useState } from "react";

export default function ReportsPage() {
  const [loadingReport, setLoadingReport] = useState<string | null>(null);

  const reportCards = [
    {
      title: "Executive Report",
      desc: "High-level summary of entity risk exposure, system performance, and threat trends for leadership.",
      lastGen: "2023-10-24 09:12",
      status: "READY",
      statusColor: "text-risk-low bg-risk-low/10 border-risk-low/20",
      icon: "insert_chart",
    },
    {
      title: "SAR Report",
      desc: "Standardized Suspicious Activity Reports prepared for FinCEN or equivalent regulatory filing.",
      lastGen: "2023-10-25 14:05",
      status: "PENDING REVIEW",
      statusColor: "text-risk-medium bg-risk-medium/10 border-risk-medium/20",
      icon: "rate_review",
    },
    {
      title: "Investigation Report",
      desc: "Granular deep-dive into specific entities, graph traversals, and flagged transaction chains.",
      lastGen: "2023-10-25 16:45",
      status: "READY",
      statusColor: "text-risk-low bg-risk-low/10 border-risk-low/20",
      icon: "travel_explore",
    },
    {
      title: "Risk Report",
      desc: "Aggregated risk scoring analysis across the entire ecosystem with network heatmaps.",
      lastGen: "2023-10-24 10:00",
      status: "READY",
      statusColor: "text-risk-low bg-risk-low/10 border-risk-low/20",
      icon: "network_check",
    },
    {
      title: "Case Report",
      desc: "End-to-end case progression summaries, from initial alert to final adjudication status.",
      lastGen: "2023-10-23 11:30",
      status: "READY",
      statusColor: "text-risk-low bg-risk-low/10 border-risk-low/20",
      icon: "folder_shared",
    },
    {
      title: "Transaction Report",
      desc: "Raw and processed transaction logs filtered by time-frames or specific ledger types.",
      lastGen: "2023-10-25 17:10",
      status: "PROCESSING",
      statusColor: "text-primary bg-primary/10 border-primary/20 animate-pulse",
      icon: "receipt_long",
    },
  ];

  const automations = [
    {
      name: "Weekly Risk Digest",
      type: "Risk Report",
      recipients: "Compliance Lead + 3",
      frequency: "Every Monday, 08:00",
      lastRun: "2023-10-23",
      status: "ACTIVE",
      statusColor: "text-risk-low",
    },
    {
      name: "Daily SAR Batch Export",
      type: "SAR Report",
      recipients: "Compliance Team",
      frequency: "Daily, 23:59",
      lastRun: "2023-10-25",
      status: "ACTIVE",
      statusColor: "text-risk-low",
    },
    {
      name: "Monthly Board Summary",
      type: "Executive Report",
      recipients: "Board of Directors",
      frequency: "1st of Month",
      lastRun: "2023-10-01",
      status: "PAUSED",
      statusColor: "text-on-surface-variant/40",
    },
  ];

  const history = [
    {
      name: "REP-INTEL-2023-1025-A",
      type: "Investigation",
      author: "A. Vance",
      date: "2023-10-25 16:45",
      status: "Complete",
      statusColor: "text-risk-low bg-risk-low/10 border-risk-low/20",
    },
    {
      name: "SAR-FILING-US-00921",
      type: "SAR Report",
      author: "M. Chen",
      date: "2023-10-25 14:05",
      status: "Pending",
      statusColor: "text-risk-medium bg-risk-medium/10 border-risk-medium/20",
    },
    {
      name: "TX-AUDIT-Q3-23-FIN",
      type: "Transaction",
      author: "System (Auto)",
      date: "2023-10-25 09:12",
      status: "Complete",
      statusColor: "text-risk-low bg-risk-low/10 border-risk-low/20",
    },
    {
      name: "CASE-8821-EVIDENCE",
      type: "Case Report",
      author: "L. Rodriguez",
      date: "2023-10-24 17:30",
      status: "Complete",
      statusColor: "text-risk-low bg-risk-low/10 border-risk-low/20",
    },
    {
      name: "RISK-EVAL-GLOBAL-33",
      type: "Risk Report",
      author: "A. Vance",
      date: "2023-10-24 11:15",
      status: "Complete",
      statusColor: "text-risk-low bg-risk-low/10 border-risk-low/20",
    },
  ];

  const handleGenerate = (title: string) => {
    setLoadingReport(title);
    setTimeout(() => {
      setLoadingReport(null);
      alert(`Report compilation successful: "${title}" exported to compliance folders.`);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-outline-variant/30">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-on-surface">Reports Center</h2>
          <p className="text-body-sm text-on-surface-variant">
            Intelligence synthesis and regulatory compliance exports.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => alert("Report generation history exported.")}
            className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 rounded-xl text-body-sm font-semibold transition-colors flex items-center gap-2 text-on-surface"
          >
            <span className="material-symbols-outlined text-sm">history</span>
            Export History
          </button>

          <button
            onClick={() => handleGenerate("Custom Synthetic Report")}
            className="px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-body-sm hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Generate Custom Report
          </button>
        </div>
      </div>

      {/* Grid of Report Cards (3x2) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map((card, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex flex-col justify-between h-64 hover:border-outline-variant/60 transition-all"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-primary text-2xl p-2 bg-primary/10 rounded-xl border border-primary/20">
                  {card.icon}
                </span>
                <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold border ${card.statusColor}`}>
                  {card.status}
                </span>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-base text-on-surface">{card.title}</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                  {card.desc}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-outline-variant/10 text-[10px] font-label-mono">
              <span className="text-on-surface-variant">Last Gen: {card.lastGen}</span>
              <button
                disabled={loadingReport !== null}
                onClick={() => handleGenerate(card.title)}
                className="text-primary font-bold hover:underline"
              >
                {loadingReport === card.title ? "Compiling..." : "Generate"}
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Scheduled Automations list */}
      <section className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-base">schedule</span>
            Scheduled Automations
          </h3>
          <button
            onClick={() => alert("Configure recurring export trigger.")}
            className="px-3.5 py-1.5 border border-outline-variant/30 bg-[#07090e] rounded-xl text-xs font-semibold text-on-surface flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-xs">add</span>
            Create Schedule
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest bg-surface-container-high/20">
                <th className="px-4 py-3">Schedule Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Recipients</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3">Last Run</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {automations.map((a, i) => (
                <tr
                  key={i}
                  className="border-b border-outline-variant/10 text-xs hover:bg-surface-container-high/20 transition-colors"
                >
                  <td className="px-4 py-4 font-bold text-on-surface">{a.name}</td>
                  <td className="px-4 py-4 text-on-surface-variant font-medium">{a.type}</td>
                  <td className="px-4 py-4 text-on-surface-variant">{a.recipients}</td>
                  <td className="px-4 py-4 font-label-mono text-on-surface-variant">{a.frequency}</td>
                  <td className="px-4 py-4 font-label-mono text-on-surface-variant">{a.lastRun}</td>
                  <td className={`px-4 py-4 text-right font-bold ${a.statusColor}`}>{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Generation History */}
      <section className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-base">restore</span>
            Recent Generation History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest bg-surface-container-high/20">
                <th className="px-4 py-3">Report Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Generated By</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr
                  key={i}
                  className="border-b border-outline-variant/10 text-xs hover:bg-surface-container-high/20 transition-colors"
                >
                  <td className="px-4 py-4 font-bold text-primary font-label-mono">{h.name}</td>
                  <td className="px-4 py-4 text-on-surface-variant font-medium">{h.type}</td>
                  <td className="px-4 py-4 text-on-surface-variant">{h.author}</td>
                  <td className="px-4 py-4 font-label-mono text-on-surface-variant">{h.date}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${h.statusColor}`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-3 text-on-surface-variant">
                      <button
                        onClick={() => alert(`Reviewing report: ${h.name}`)}
                        className="material-symbols-outlined text-base hover:text-primary"
                      >
                        visibility
                      </button>
                      <button
                        onClick={() => alert(`Downloading report: ${h.name}`)}
                        className="material-symbols-outlined text-base hover:text-primary"
                      >
                        download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
