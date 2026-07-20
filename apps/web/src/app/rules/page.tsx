"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BarChart, Bar, ResponsiveContainer, Cell } from "recharts";
import { useUIStore } from "../../store/useUIStore";

const estVolumeData = [
  { name: "Week 1", value: 340 },
  { name: "Week 2", value: 410 },
  { name: "Week 3", value: 300 },
  { name: "Week 4", value: 520 },
];

type RulesSortField = "id" | "name" | "weight" | "date";

export default function RulesPage() {
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<"catalog" | "builder" | "simulation">("catalog");
  
  // Catalog States
  const [rules, setRules] = useState([
    { id: "R-1092-B", name: "Rapid In-Out Flow", desc: "Detects cyclic fund movement within 24h", category: "Velocity", active: true, threshold: "> 500% baseline", weight: 85, date: "2023-10-24 14:22" },
    { id: "R-2204-A", name: "Dormant Reactivation", desc: "High volume after 6+ months inactivity", category: "Behavior", active: true, threshold: "> $10,000.00", weight: 95, date: "2023-11-01 09:10" },
    { id: "R-4011-G", name: "Sanctioned Geo Hop", desc: "Triangulated login from high-risk zones", category: "Geography", active: false, threshold: "Tier-3 List Match", weight: 60, date: "2023-10-30 18:45" },
    { id: "R-9982-M", name: "Structured Deposits", desc: "Recurring amounts < $10k threshold", category: "Velocity", active: true, threshold: "4x in 72hrs", weight: 92, date: "2023-11-02 11:30" },
  ]);

  // Builder States
  const [severity, setSeverity] = useState("HIGH");
  const [weightContribution, setWeightContribution] = useState(75);
  const [simRunning, setSimRunning] = useState(false);

  // Table selections
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Sorting State
  const [sortField, setSortField] = useState<RulesSortField>("weight");
  const [sortAsc, setSortAsc] = useState(false);

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
    const target = rules.find(r => r.id === id);
    if (target) {
      addToast(`Rule ${id} is now ${!target.active ? "Enabled" : "Disabled"}.`, "success");
    }
  };

  const handleSimTrigger = () => {
    setSimRunning(true);
    setTimeout(() => {
      setSimRunning(false);
      addToast("Simulation completed successfully across 5,000,000 historical transactions.", "success");
    }, 2000);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(new Set(rules.map((r) => r.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRows(next);
  };

  const handleBulkAction = (action: "ENABLE" | "DISABLE" | "DELETE") => {
    const list = Array.from(selectedRows);
    if (action === "ENABLE" || action === "DISABLE") {
      const activeState = action === "ENABLE";
      setRules(rules.map(r => list.includes(r.id) ? { ...r, active: activeState } : r));
      addToast(`Successfully ${action === "ENABLE" ? "enabled" : "disabled"} ${list.length} rules.`, "success");
    } else {
      setRules(rules.filter(r => !list.includes(r.id)));
      addToast(`Successfully deleted ${list.length} rules.`, "success");
    }
    setSelectedRows(new Set());
  };

  // Sorting
  const sortedRules = useMemo(() => {
    const sorted = [...rules];
    sorted.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [rules, sortField, sortAsc]);

  const handleSort = (field: RulesSortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Main Workspaces Tabs Bar */}
      <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
        <div className="flex gap-6">
          {["catalog", "builder", "simulation"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-2 font-label-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab === "catalog" ? "Rule Catalog" : tab === "builder" ? "Rule Builder" : "Simulation"}
            </button>
          ))}
        </div>

        {/* Global Save/Deploy Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => addToast("Draft successfully archived.", "success")}
            className="px-4 py-2 border border-outline-variant/30 hover:border-primary/50 text-xs font-bold text-on-surface rounded-xl hover:bg-white/5 transition-all animate-fade-in"
          >
            Save Draft
          </button>
          <button
            onClick={() => addToast("Logic successfully pushed to AML detection engine.", "success")}
            className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-xs">rocket_launch</span>
            Deploy Changes
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          <div className="text-left">
            <h2 className="text-xl font-bold text-on-surface">Rule Catalog</h2>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Manage and monitor automated AML detection logic.
            </p>
          </div>

          {/* Table container */}
          <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-low max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
              <thead className="sticky top-0 bg-surface-container-low/95 backdrop-blur-md z-10 border-b border-outline-variant/30">
                <tr className="text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest">
                  <th className="px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={sortedRules.length > 0 && selectedRows.size === sortedRules.length}
                      className="rounded border-outline-variant/30 text-primary focus:ring-primary/20 bg-surface-container-lowest"
                    />
                  </th>
                  <th
                    onClick={() => handleSort("id")}
                    className="px-4 py-4 cursor-pointer hover:text-on-surface w-24"
                  >
                    <div className="flex items-center gap-1">
                      Rule ID
                      {sortField === "id" && (
                        <span className="material-symbols-outlined text-xs">
                          {sortAsc ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("name")}
                    className="px-4 py-4 cursor-pointer hover:text-on-surface"
                  >
                    <div className="flex items-center gap-1">
                      Name
                      {sortField === "name" && (
                        <span className="material-symbols-outlined text-xs">
                          {sortAsc ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-4 w-28">Category</th>
                  <th className="px-4 py-4 text-center w-24">Status</th>
                  <th className="px-4 py-4 w-40">Threshold</th>
                  <th
                    onClick={() => handleSort("weight")}
                    className="px-4 py-4 cursor-pointer hover:text-on-surface w-36"
                  >
                    <div className="flex items-center gap-1">
                      Weight
                      {sortField === "weight" && (
                        <span className="material-symbols-outlined text-xs">
                          {sortAsc ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("date")}
                    className="px-4 py-4 cursor-pointer hover:text-on-surface w-36"
                  >
                    <div className="flex items-center gap-1">
                      Modified
                      {sortField === "date" && (
                        <span className="material-symbols-outlined text-xs">
                          {sortAsc ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-4 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {sortedRules.map((rule) => {
                  const isChecked = selectedRows.has(rule.id);
                  return (
                    <tr
                      key={rule.id}
                      className={`text-xs hover:bg-surface-container-high/40 transition-colors ${
                        isChecked ? "bg-primary-container/5" : ""
                      }`}
                    >
                      <td className="px-4 py-4" onClick={(e) => handleSelectRow(rule.id, e)}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-outline-variant/30 text-primary focus:ring-primary/20 bg-surface-container-lowest"
                        />
                      </td>
                      <td className="px-4 py-4 font-bold text-primary font-label-mono truncate">{rule.id}</td>
                      <td className="px-4 py-4 truncate">
                        <div className="font-semibold text-on-surface truncate">{rule.name}</div>
                        <div className="text-[10px] text-on-surface-variant truncate mt-0.5">{rule.desc}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 bg-surface-container-lowest border border-outline-variant/20 rounded font-label-mono text-[9px]">
                          {rule.category}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => toggleRule(rule.id)}
                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                              rule.active ? "bg-primary" : "bg-surface-container-highest"
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                rule.active ? "translate-x-5.5" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-on-surface truncate">{rule.threshold}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface font-label-mono w-6">{rule.weight}</span>
                          <div className="w-16 h-1 bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                rule.weight >= 90
                                  ? "bg-risk-critical"
                                  : rule.weight >= 70
                                  ? "bg-risk-high"
                                  : "bg-risk-medium"
                              }`}
                              style={{ width: `${rule.weight}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-label-mono text-on-surface-variant truncate">{rule.date}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-3.5 text-on-surface-variant">
                          <button
                            onClick={() => {
                              setActiveTab("builder");
                              addToast(`Loaded rule settings for: ${rule.id}`, "info");
                            }}
                            className="material-symbols-outlined text-base hover:text-primary transition-colors"
                            title="Edit Logic Configuration"
                          >
                            edit
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab("simulation");
                              addToast(`Running simulation instance: ${rule.id}`, "info");
                            }}
                            className="material-symbols-outlined text-base hover:text-primary transition-colors"
                            title="Test Rule logic"
                          >
                            science
                          </button>
                          <button
                            onClick={() => addToast(`Fetched audit change history for ${rule.id}`, "info")}
                            className="material-symbols-outlined text-base hover:text-primary transition-colors"
                            title="Changelog Audit History"
                          >
                            history
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Floating Actions bar for catalog */}
          {selectedRows.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-container-high border border-outline-variant/40 rounded-xl px-6 py-3.5 shadow-2xl flex items-center gap-6 z-40 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
                  {selectedRows.size}
                </span>
                <span className="text-body-sm font-semibold text-on-surface">Selected Rules</span>
              </div>
              <div className="w-px h-5 bg-outline-variant/35" />
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction("ENABLE")}
                  className="px-3.5 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-lg hover:opacity-90 transition-opacity"
                >
                  Bulk Enable
                </button>
                <button
                  onClick={() => handleBulkAction("DISABLE")}
                  className="px-3.5 py-1.5 border border-outline-variant/30 bg-[#07090e] rounded-lg text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Bulk Disable
                </button>
                <button
                  onClick={() => handleBulkAction("DELETE")}
                  className="px-3.5 py-1.5 border border-outline-variant/30 bg-[#1a0c0e] border-risk-critical/30 rounded-lg text-xs font-bold text-risk-critical hover:bg-risk-critical/10 transition-colors"
                >
                  Bulk Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-left">
          {/* Column 1: Logic Builder Workflow */}
          <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                Logic Builder
              </h3>
              <button
                onClick={() => addToast("Added condition layer block.", "success")}
                className="px-2.5 py-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 rounded text-[9px] font-label-mono uppercase tracking-wider text-on-surface flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-[10px]">add</span>
                Add Node
              </button>
            </div>

            {/* Workflow cards sequence */}
            <div className="space-y-4 relative pl-4 border-l border-outline-variant/20 ml-2">
              {/* Trigger */}
              <div className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest space-y-2 relative">
                <div className="absolute left-[-21px] top-4 w-2 h-2 rounded-full bg-primary" />
                <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[8px] font-bold rounded font-label-mono">
                  IF
                </span>
                <h5 className="font-bold text-xs text-on-surface">Trigger Event</h5>
                <select className="w-full bg-surface-container-low border border-outline-variant/20 rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none">
                  <option>incoming_transaction</option>
                </select>
              </div>

              {/* Conditions Layer */}
              <div className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest space-y-2 relative">
                <div className="absolute left-[-21px] top-4 w-2 h-2 rounded-full bg-primary" />
                <span className="px-2 py-0.5 bg-primary/15 border border-primary/20 text-primary text-[8px] font-bold rounded font-label-mono">
                  AND
                </span>
                <h5 className="font-bold text-xs text-on-surface">Condition Layer 01</h5>
                <div className="space-y-1.5 font-label-mono text-[10px]">
                  <div className="p-2 bg-surface-container-low rounded border border-outline-variant/10 text-on-surface-variant">
                    amount &gt; threshold_limit
                  </div>
                  <div className="p-2 bg-surface-container-low rounded border border-outline-variant/10 text-on-surface-variant">
                    velocity &gt; avg_30d * 2.5
                  </div>
                </div>
              </div>

              {/* Risk Factor */}
              <div className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest space-y-2 relative">
                <div className="absolute left-[-21px] top-4 w-2 h-2 rounded-full bg-primary" />
                <span className="px-2 py-0.5 bg-primary/15 border border-primary/20 text-primary text-[8px] font-bold rounded font-label-mono">
                  AND
                </span>
                <h5 className="font-bold text-xs text-on-surface">Risk Factor</h5>
                <div className="flex justify-between items-center p-2 bg-surface-container-low rounded border border-outline-variant/10 font-label-mono text-[10px]">
                  <span className="text-on-surface-variant">jurisdiction_risk_rating</span>
                  <span className="text-risk-high font-bold">&gt;= HIGH</span>
                </div>
              </div>

              {/* Action Output */}
              <div className="p-4 rounded-xl border-2 border-risk-high/30 bg-surface-container-lowest space-y-2 relative">
                <div className="absolute left-[-21px] top-4 w-2 h-2 rounded-full bg-risk-high" />
                <span className="px-2 py-0.5 bg-risk-high/15 border border-risk-high/35 text-risk-high text-[8px] font-bold rounded font-label-mono">
                  THEN
                </span>
                <h5 className="font-bold text-xs text-on-surface">Output Action</h5>
                <div className="p-2 bg-surface-container-low rounded border border-outline-variant/10 text-primary font-bold text-[9px] font-label-mono text-center">
                  GENERATE_INVESTIGATION
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Configuration inputs */}
          <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Rule Configuration
            </h3>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-medium">Rule Identification</label>
                <input
                  type="text"
                  defaultValue="RT-MULE-049: Structural Layering taking inputs"
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-medium">Description</label>
                <textarea
                  rows={3}
                  defaultValue="Identifies patterns associated with smurfing or structural transfers designed to evade AML reporting thresholds."
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-on-surface-variant font-medium">Category</label>
                  <select className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface focus:outline-none">
                    <option>Money Laundering</option>
                    <option>Transaction Velocity</option>
                    <option>Device Takeover</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-on-surface-variant font-medium block">Risk Severity</label>
                  <div className="flex bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-1">
                    {["LOW", "MEDIUM", "HIGH"].map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setSeverity(sev)}
                        className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-all ${
                          severity === sev
                            ? "bg-risk-high text-white shadow-sm"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                <div className="flex justify-between items-center">
                  <label className="text-on-surface-variant font-medium">Threshold Constraints</label>
                  <button
                    onClick={() => addToast("Reverted rule defaults", "info")}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Reset to Default
                  </button>
                </div>

                <div className="p-4 bg-surface-container-lowest border border-outline-variant/10 rounded-xl space-y-3">
                  <div className="space-y-1.5">
                    <div className="text-[9px] font-label-mono text-on-surface-variant uppercase">Primary Transaction Volume</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue="$ 9500.00"
                        className="bg-surface-container-low border border-outline-variant/20 rounded px-2.5 py-1.5 text-xs font-semibold text-on-surface w-full focus:outline-none"
                      />
                      <input
                        type="text"
                        defaultValue="± 2.5%"
                        className="bg-surface-container-low border border-outline-variant/20 rounded px-2.5 py-1.5 text-xs font-semibold text-on-surface w-20 text-center focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[9px] font-label-mono text-on-surface-variant uppercase">Aggregation Time Window</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue="72 Hours"
                        className="bg-surface-container-low border border-outline-variant/20 rounded px-2.5 py-1.5 text-xs font-semibold text-on-surface w-full focus:outline-none"
                      />
                      <input
                        type="text"
                        defaultValue="5 Hits"
                        className="bg-surface-container-low border border-outline-variant/20 rounded px-2.5 py-1.5 text-xs font-semibold text-on-surface w-20 text-center focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Impact Analysis */}
          <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Impact Analysis
            </h3>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-label-mono uppercase tracking-wider text-on-surface-variant">
                <span>Score Weight Contribution</span>
                <span className="font-bold text-primary">{weightContribution}/100 PTS</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={weightContribution}
                onChange={(e) => setWeightContribution(Number(e.target.value))}
                className="w-full h-1 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Volume charts bar */}
            <div className="p-4 bg-surface-container-lowest border border-outline-variant/10 rounded-xl space-y-4">
              <div className="flex justify-between items-center text-[10px] font-label-mono uppercase">
                <span>Estimated Alert Volume</span>
              </div>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={estVolumeData} margin={{ left: -30, right: 0, top: 0, bottom: 0 }}>
                    <Bar dataKey="value" fill="#2a2d3d" radius={[2, 2, 0, 0]}>
                      <Cell fill="#002a78" />
                      <Cell fill="#002a78" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#002a78" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between items-baseline pt-2">
                <div>
                  <div className="text-xs font-bold text-risk-low">-12%</div>
                  <div className="text-[8px] font-label-mono text-on-surface-variant uppercase">False Positives</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-on-surface">1,402</div>
                  <div className="text-[8px] font-label-mono text-on-surface-variant uppercase">Alerts / Mo</div>
                </div>
              </div>
            </div>

            {/* backtest sample matches list */}
            <div className="space-y-3">
              <div className="text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
                Sample Matches (Backtest)
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                  <div>
                    <div className="font-semibold text-on-surface">Acme Crypto Holding</div>
                    <div className="text-[9px] font-label-mono text-on-surface-variant mt-0.5">UID-9402-AB</div>
                  </div>
                  <span
                    onClick={() => addToast("Navigating to entity profile", "info")}
                    className="material-symbols-outlined text-on-surface-variant text-sm cursor-pointer hover:text-primary transition-colors"
                  >
                    open_in_new
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                  <div>
                    <div className="font-semibold text-on-surface">Global Trade LTD</div>
                    <div className="text-[9px] font-label-mono text-on-surface-variant mt-0.5">UID-1182-CC</div>
                  </div>
                  <span
                    onClick={() => addToast("Navigating to entity profile", "info")}
                    className="material-symbols-outlined text-on-surface-variant text-sm cursor-pointer hover:text-primary transition-colors"
                  >
                    open_in_new
                  </span>
                </div>
              </div>
            </div>

            {/* Run simulation button */}
            <button
              onClick={handleSimTrigger}
              disabled={simRunning}
              className="w-full py-3.5 bg-surface-container-high border border-outline-variant/20 hover:border-primary/45 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 text-on-surface"
            >
              <span className="material-symbols-outlined text-sm font-semibold">science</span>
              {simRunning ? "Running Simulation..." : "Run Full Simulation"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "simulation" && (
        <div className="space-y-6 text-left">
          <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider mb-4">
              Simulation Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-1.5 text-xs">
                <label className="text-on-surface-variant font-medium">Date Range</label>
                <input
                  type="date"
                  defaultValue="2023-01-01"
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-on-surface-variant font-medium">Sample Size</label>
                <select className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface focus:outline-none">
                  <option>5,000,000 Transactions</option>
                  <option>10,000,000 Transactions</option>
                </select>
              </div>

              <button
                onClick={handleSimTrigger}
                disabled={simRunning}
                className="py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                {simRunning ? "Simulating..." : "Run Simulation"}
              </button>
            </div>
          </div>

          {/* Results specs metrics row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-1.5">
              <div className="text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
                Precision
              </div>
              <div className="text-3xl font-extrabold text-risk-low font-display-kpi flex items-baseline gap-2">
                94.2%
                <span className="text-[10px] font-semibold text-risk-low">↑1.2%</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-1.5">
              <div className="text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
                Recall
              </div>
              <div className="text-3xl font-extrabold text-on-surface font-display-kpi flex items-baseline gap-2">
                82.7%
                <span className="text-[10px] font-semibold text-on-surface-variant">-0.0%</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-1.5">
              <div className="text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
                False Positive Rate
              </div>
              <div className="text-3xl font-extrabold text-risk-high font-display-kpi flex items-baseline gap-2">
                0.04%
                <span className="text-[10px] font-semibold text-risk-high">↑0.01%</span>
              </div>
            </div>
          </div>

          {/* flow details table */}
          <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Simulation Hits (Sample)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
              <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                <thead className="bg-surface-container-high/40 border-b border-outline-variant/30">
                  <tr className="text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest">
                    <th className="px-4 py-3 w-32">Txn ID</th>
                    <th className="px-4 py-3">Entity Name</th>
                    <th className="px-4 py-3 w-40">Amount</th>
                    <th className="px-4 py-3 w-28 text-center">Score</th>
                    <th className="px-4 py-3 text-right w-36">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  <tr className="text-xs hover:bg-surface-container-high/20 transition-colors">
                    <td className="px-4 py-4 font-label-mono text-primary truncate">TXN-9821-XP</td>
                    <td className="px-4 py-4 font-semibold text-on-surface truncate">Global Logistics Ltd.</td>
                    <td className="px-4 py-4 font-bold text-on-surface truncate">$12,450.00</td>
                    <td className="px-4 py-4 font-bold text-risk-high font-label-mono text-center">0.92</td>
                    <td className="px-4 py-4 text-right font-bold text-risk-low uppercase truncate">True Positive</td>
                  </tr>
                  <tr className="text-xs hover:bg-surface-container-high/20 transition-colors">
                    <td className="px-4 py-4 font-label-mono text-primary truncate">TXN-4421-QA</td>
                    <td className="px-4 py-4 font-semibold text-on-surface truncate">Elena Richardson</td>
                    <td className="px-4 py-4 font-bold text-on-surface truncate">$4,800.00</td>
                    <td className="px-4 py-4 font-bold text-risk-high font-label-mono text-center">0.88</td>
                    <td className="px-4 py-4 text-right font-bold text-risk-low uppercase truncate">True Negative</td>
                  </tr>
                  <tr className="text-xs hover:bg-surface-container-high/20 transition-colors">
                    <td className="px-4 py-4 font-label-mono text-primary truncate">TXN-1002-LK</td>
                    <td className="px-4 py-4 font-semibold text-on-surface truncate">Skyline Consulting</td>
                    <td className="px-4 py-4 font-bold text-on-surface truncate">$2,100.00</td>
                    <td className="px-4 py-4 font-bold text-risk-medium font-label-mono text-center">0.45</td>
                    <td className="px-4 py-4 text-right font-bold text-risk-high uppercase truncate">False Positive</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
