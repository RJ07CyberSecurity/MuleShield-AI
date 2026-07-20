"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUIStore } from "../../store/useUIStore";

type SortField = "id" | "priority" | "status" | "assignedTo" | "sla" | "riskScore" | "created";

export default function CasesPage() {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [filterStatus, setFilterStatus] = useState("All Active");
  const [filterPriority, setFilterPriority] = useState("Critical, High");
  const [filterAssignee, setFilterAssignee] = useState("All");

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("riskScore");
  const [sortAsc, setSortAsc] = useState(false);

  // Row selection state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const stats = [
    { label: "Total Open Cases", value: "1,248", change: "↑ 12% vs last week", descColor: "text-risk-low", icon: "folder" },
    { label: "Critical Alerts", value: "42", change: "Northeast Node Surge", descColor: "text-risk-high", icon: "error" },
    { label: "Breached SLA", value: "14", change: "Avg delay: 4.2 hours", descColor: "text-risk-medium", icon: "hourglass_empty" },
    { label: "MTTR", value: "2.4h", change: "-8% from target", descColor: "text-risk-low", icon: "speed" },
  ];

  const initialCases = [
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
      targetId: "ACC-092281",
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

  // Filtering cases
  const filteredCases = useMemo(() => {
    return initialCases.filter((c) => {
      // Status filter
      if (filterStatus === "Closed" && c.status !== "Closed") return false;
      
      // Priority filter
      if (filterPriority === "Critical, High") {
        if (c.priority !== "CRITICAL" && c.priority !== "HIGH") return false;
      }
      
      // Assignee filter
      if (filterAssignee === "Me" && c.assignedTo !== "John Doe") return false;

      return true;
    });
  }, [filterStatus, filterPriority, filterAssignee]);

  // Sorting cases
  const sortedCases = useMemo(() => {
    const sorted = [...filteredCases];
    sorted.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "riskScore") {
        aVal = Number(a.riskScore.split("/")[0]);
        bVal = Number(b.riskScore.split("/")[0]);
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredCases, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(new Set(sortedCases.map((c) => c.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger redirect click
    const next = new Set(selectedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRows(next);
  };

  const handleBulkAction = (action: string) => {
    addToast(`Successfully triggered ${action} for ${selectedRows.size} cases`, "success");
    setSelectedRows(new Set());
  };

  return (
    <div className="space-y-6 relative">
      {/* Title Header */}
      <div className="text-left">
        <h2 className="text-xl font-bold text-on-surface">Case Registry Queue</h2>
        <p className="text-body-sm text-on-surface-variant mt-1">
          Managing active suspicious activity reports across the regional network.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low/60 flex justify-between items-start"
          >
            <div className="space-y-1.5 text-left">
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
      <section className="flex flex-wrap items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 text-body-sm">
        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant text-xs font-semibold">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2.5 py-1 text-xs text-on-surface focus:outline-none"
          >
            <option value="All Active">All Active</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant text-xs font-semibold">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2.5 py-1 text-xs text-on-surface focus:outline-none"
          >
            <option value="Critical, High">Critical, High</option>
            <option value="All">All Priorities</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant text-xs font-semibold">Assignee:</span>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2.5 py-1 text-xs text-on-surface focus:outline-none"
          >
            <option value="All">All Assignees</option>
            <option value="Me">Assigned to Me</option>
          </select>
        </div>

        <button
          onClick={() => addToast("Advanced filtering panel toggled", "info")}
          className="px-3.5 py-1.5 border border-outline-variant/30 bg-surface-container-lowest hover:border-primary/45 rounded-xl text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-xs">filter_list</span>
          Advanced Filters
        </button>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => handleBulkAction("Bulk Assign")}
            disabled={selectedRows.size === 0}
            className="px-3.5 py-1.5 border border-outline-variant/30 bg-surface-container-lowest rounded-xl text-xs font-semibold text-on-surface disabled:opacity-50 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-xs">group_add</span>
            Bulk Assign
          </button>
          <button
            onClick={() => {
              addToast("CSV Export completed successfully.", "success");
            }}
            className="px-3.5 py-1.5 border border-outline-variant/30 bg-surface-container-lowest rounded-xl text-xs font-semibold text-on-surface hover:border-primary/45 flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-xs">file_download</span>
            Export CSV
          </button>
        </div>
      </section>

      {/* Case queue Table list */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-low max-h-[600px] overflow-y-auto">
        <table className="w-full text-left border-collapse min-w-[900px] table-fixed">
          <thead className="sticky top-0 bg-surface-container-low/95 backdrop-blur-md z-10 border-b border-outline-variant/30">
            <tr className="text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest">
              <th className="px-4 py-4 w-12">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={sortedCases.length > 0 && selectedRows.size === sortedCases.length}
                  className="rounded border-outline-variant/30 text-primary focus:ring-primary/20 bg-surface-container-lowest"
                />
              </th>
              <th
                onClick={() => handleSort("id")}
                className="px-4 py-4 cursor-pointer hover:text-on-surface w-24"
              >
                <div className="flex items-center gap-1">
                  Case ID
                  {sortField === "id" && (
                    <span className="material-symbols-outlined text-xs">
                      {sortAsc ? "arrow_upward" : "arrow_downward"}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-4 py-4">Subject Info</th>
              <th
                onClick={() => handleSort("priority")}
                className="px-4 py-4 cursor-pointer hover:text-on-surface text-center w-28"
              >
                <div className="flex items-center justify-center gap-1">
                  Priority
                  {sortField === "priority" && (
                    <span className="material-symbols-outlined text-xs">
                      {sortAsc ? "arrow_upward" : "arrow_downward"}
                    </span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("status")}
                className="px-4 py-4 cursor-pointer hover:text-on-surface w-32"
              >
                <div className="flex items-center gap-1">
                  Status
                  {sortField === "status" && (
                    <span className="material-symbols-outlined text-xs">
                      {sortAsc ? "arrow_upward" : "arrow_downward"}
                    </span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("assignedTo")}
                className="px-4 py-4 cursor-pointer hover:text-on-surface w-40"
              >
                <div className="flex items-center gap-1">
                  Assigned To
                  {sortField === "assignedTo" && (
                    <span className="material-symbols-outlined text-xs">
                      {sortAsc ? "arrow_upward" : "arrow_downward"}
                    </span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("sla")}
                className="px-4 py-4 cursor-pointer hover:text-on-surface w-28"
              >
                <div className="flex items-center gap-1">
                  SLA
                  {sortField === "sla" && (
                    <span className="material-symbols-outlined text-xs">
                      {sortAsc ? "arrow_upward" : "arrow_downward"}
                    </span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("riskScore")}
                className="px-4 py-4 cursor-pointer hover:text-on-surface w-28"
              >
                <div className="flex items-center gap-1">
                  Risk
                  {sortField === "riskScore" && (
                    <span className="material-symbols-outlined text-xs">
                      {sortAsc ? "arrow_upward" : "arrow_downward"}
                    </span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("created")}
                className="px-4 py-4 cursor-pointer hover:text-on-surface text-right w-36"
              >
                <div className="flex items-center justify-end gap-1">
                  Created
                  {sortField === "created" && (
                    <span className="material-symbols-outlined text-xs">
                      {sortAsc ? "arrow_upward" : "arrow_downward"}
                    </span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {sortedCases.map((c, i) => {
              const isCritical = c.priority === "CRITICAL";
              const isHigh = c.priority === "HIGH";
              const isMedium = c.priority === "MEDIUM";
              const isChecked = selectedRows.has(c.id);

              return (
                <tr
                  key={i}
                  onClick={() => router.push(`/cases/${c.targetId}`)}
                  className={`cursor-pointer text-xs hover:bg-surface-container-high/40 transition-colors ${
                    isChecked ? "bg-primary-container/5" : ""
                  }`}
                >
                  <td className="px-4 py-4" onClick={(e) => handleSelectRow(c.id, e)}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded border-outline-variant/30 text-primary focus:ring-primary/20 bg-surface-container-lowest"
                    />
                  </td>
                  <td className="px-4 py-4 font-bold text-primary font-label-mono truncate">{c.id}</td>
                  <td className="px-4 py-4 truncate">
                    <div className="font-semibold text-on-surface truncate">{c.subject}</div>
                    <div className="text-[10px] text-on-surface-variant font-label-mono mt-0.5">
                      ACCT: {c.acct}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <span
                        className={`px-2.5 py-0.5 rounded border text-[9px] font-bold ${
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
                  <td className="px-4 py-4 font-semibold text-on-surface truncate">
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
                  <td className="px-4 py-4 text-on-surface-variant font-medium truncate">
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
                    className={`px-4 py-4 font-label-mono font-semibold truncate ${
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
                  <td className="px-4 py-4 text-right font-label-mono text-on-surface-variant truncate">
                    {c.created}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Floating Actions bar */}
      {selectedRows.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-container-high border border-outline-variant/40 rounded-xl px-6 py-3.5 shadow-2xl flex items-center gap-6 z-40 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
              {selectedRows.size}
            </span>
            <span className="text-body-sm font-semibold text-on-surface">Selected Cases</span>
          </div>
          <div className="w-px h-5 bg-outline-variant/35" />
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction("Escalate")}
              className="px-3.5 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-lg hover:opacity-90 transition-opacity"
            >
              Bulk Escalate
            </button>
            <button
              onClick={() => handleBulkAction("Close")}
              className="px-3.5 py-1.5 border border-outline-variant/30 hover:border-risk-high/30 bg-[#07090e] rounded-lg text-xs font-bold text-on-surface-variant hover:text-risk-high transition-colors"
            >
              Bulk Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
