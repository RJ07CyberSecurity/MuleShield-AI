"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CasesPage() {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState("All Active");
  const [filterPriority, setFilterPriority] = useState("Critical, High");

  const stats = [
    { label: "Total Open Cases", value: "1,248", change: "+12% vs last week", descColor: "text-risk-low", icon: "folder" },
    { label: "Critical Alerts", value: "42", change: "High risk density in Northeast node", descColor: "text-risk-high", icon: "error" },
    { label: "Breached SLA", value: "14", change: "Avg delay: 4.2 hours", descColor: "text-risk-medium", icon: "hourglass_empty" },
    { label: "MTTR", value: "2.4h", change: "-8% from target", descColor: "text-risk-low", icon: "speed" },
  ];

  const cases = [
    {
      id: "#MS-84291",
      subject: "Elena S. Volkov",
      acct: "****5592",
      priority: "CRITICAL",
      status: "Escalated",
      assignedTo: "John Doe",
      sla: "-00:42:12",
      riskScore: "98/100",
      created: "2023-10-24 08:12",
      targetId: "ACC-092281", // Routes to Vasily's dynamic forensics page
    },
    {
      id: "#MS-84305",
      subject: "Global Trade Logistics",
      acct: "****1102",
      priority: "HIGH",
      status: "In Progress",
      assignedTo: "Sarah Miller",
      sla: "02:15:45",
      riskScore: "76/100",
      created: "2023-10-24 09:34",
      targetId: "ACC-092281",
    },
    {
      id: "#MS-84312",
      subject: "Marcus T. Rivera",
      acct: "****8821",
      priority: "MEDIUM",
      status: "New",
      assignedTo: "Unassigned",
      sla: "22:01:10",
      riskScore: "42/100",
      created: "2023-10-24 10:05",
      targetId: "ACC-092281",
    },
    {
      id: "#MS-84318",
      subject: "Crystal Holdings LLC",
      acct: "****3320",
      priority: "LOW",
      status: "Assigned",
      assignedTo: "Alex Brown",
      sla: "46:32:00",
      riskScore: "12/100",
      created: "2023-10-24 11:45",
      targetId: "ACC-092281",
    },
    {
      id: "#MS-84322",
      subject: "TechNode Solutions",
      acct: "****9942",
      priority: "HIGH",
      status: "Pending Review",
      assignedTo: "John Doe",
      sla: "01:55:20",
      riskScore: "81/100",
      created: "2023-10-24 13:02",
      targetId: "ACC-092281",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-bold text-on-surface">Case Queue</h2>
        <p className="text-body-sm text-on-surface-variant mt-1">
          Managing 1,248 active suspicious activity reports across the regional network.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex justify-between items-start"
          >
            <div className="space-y-1.5">
              <div className="text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
                {stat.label}
              </div>
              <div className="text-3xl font-extrabold text-on-surface font-display-kpi">
                {stat.value}
              </div>
              <div className={`text-[9px] font-semibold ${stat.descColor}`}>
                {stat.change}
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-xl">
              {stat.icon}
            </span>
          </div>
        ))}
      </section>

      {/* Filter Options Bar */}
      <section className="flex flex-wrap items-center gap-4 bg-[#0a0d17] p-4 rounded-xl border border-outline-variant/30 text-body-sm">
        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant text-xs">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-2.5 py-1 text-xs text-on-surface-variant"
          >
            <option>All Active</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant text-xs">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-2.5 py-1 text-xs text-on-surface-variant"
          >
            <option>Critical, High</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant text-xs">Assignee:</span>
          <select
            className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-2.5 py-1 text-xs text-on-surface-variant"
          >
            <option>Me</option>
          </select>
        </div>

        <button className="px-3.5 py-1.5 border border-outline-variant/30 bg-surface-container-low rounded-xl text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xs">filter_list</span>
          Advanced Filters
        </button>

        <div className="flex gap-2 ml-auto">
          <button className="px-3.5 py-1.5 border border-outline-variant/30 bg-surface-container-low rounded-xl text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs">group_add</span>
            Bulk Assign
          </button>
          <button
            onClick={() => alert("CSV Export completed successfully.")}
            className="px-3.5 py-1.5 border border-outline-variant/30 bg-surface-container-low rounded-xl text-xs font-semibold text-on-surface flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-xs">file_download</span>
            Export CSV
          </button>
        </div>
      </section>

      {/* Case queue Table list */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-low">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest bg-surface-container-high/20">
              <th className="px-4 py-4 w-10">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-4 py-4">Case ID</th>
              <th className="px-4 py-4">Subject</th>
              <th className="px-4 py-4 text-center">Priority</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Assigned To</th>
              <th className="px-4 py-4">SLA</th>
              <th className="px-4 py-4">Risk</th>
              <th className="px-4 py-4 text-right">Created</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c, i) => {
              const isCritical = c.priority === "CRITICAL";
              const isHigh = c.priority === "HIGH";
              const isMedium = c.priority === "MEDIUM";

              return (
                <tr
                  key={i}
                  onClick={() => router.push(`/cases/${c.targetId}`)}
                  className="cursor-pointer border-b border-outline-variant/10 text-xs hover:bg-surface-container-high/40 transition-colors"
                >
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-4 py-4 font-bold text-primary font-label-mono">{c.id}</td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-on-surface">{c.subject}</div>
                    <div className="text-[10px] text-on-surface-variant font-label-mono mt-0.5">
                      ACCT: {c.acct}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <span
                        className={`px-2 py-0.5 rounded border text-[9px] font-bold ${
                          isCritical
                            ? "text-risk-critical border-risk-critical/20 bg-risk-critical/10"
                            : isHigh
                            ? "text-risk-high border-risk-high/20 bg-risk-high/10"
                            : isMedium
                            ? "text-risk-medium border-risk-medium/20 bg-risk-medium/10"
                            : "text-risk-low border-risk-low/20 bg-risk-low/10"
                        }`}
                      >
                        {c.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-on-surface">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          c.status === "Escalated"
                            ? "bg-risk-critical animate-pulse"
                            : c.status === "In Progress" || c.status === "Pending Review"
                            ? "bg-primary"
                            : "bg-on-surface-variant/40"
                        }`}
                      ></span>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-on-surface-variant font-medium">
                    {c.assignedTo === "Unassigned" ? (
                      <span className="italic text-on-surface-variant/50">Unassigned</span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-secondary-container text-primary text-[8px] font-bold flex items-center justify-center border border-outline-variant/30">
                          {c.assignedTo.split(" ").map((n) => n[0]).join("")}
                        </span>
                        {c.assignedTo}
                      </span>
                    )}
                  </td>
                  <td
                    className={`px-4 py-4 font-label-mono font-semibold ${
                      c.sla.startsWith("-") ? "text-risk-critical" : "text-on-surface-variant"
                    }`}
                  >
                    {c.sla}
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-16">
                      <div className="flex justify-between items-baseline text-[9px] font-label-mono text-on-surface-variant">
                        <span>Score</span>
                        <span className="font-bold text-on-surface">{c.riskScore.split("/")[0]}</span>
                      </div>
                      <div className="h-1 bg-surface-container-high rounded-full overflow-hidden w-full mt-1">
                        <div
                          className={`h-full rounded-full ${
                            isCritical ? "bg-risk-critical" : isHigh ? "bg-risk-high" : "bg-risk-medium"
                          }`}
                          style={{ width: c.riskScore }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-label-mono text-on-surface-variant">
                    {c.created}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Table footer */}
        <div className="p-4 bg-surface-container-high/20 flex justify-between items-center text-caption text-on-surface-variant font-label-mono border-t border-outline-variant/20">
          <span>Showing 1 - 5 of 1,248 cases</span>
          <div className="flex gap-2">
            <button className="px-2 py-1 hover:text-on-surface">Previous</button>
            <button className="px-2.5 py-1 bg-primary text-on-primary font-bold rounded">1</button>
            <button className="px-2.5 py-1 hover:text-on-surface">2</button>
            <button className="px-2.5 py-1 hover:text-on-surface">3</button>
            <button className="px-2 py-1 hover:text-on-surface">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
