"use client";

import { useState, useMemo } from "react";
import { useAlertStore } from "../../store/useAlertStore";
import { useUIStore } from "../../store/useUIStore";
import { getRiskColorClass } from "../../types/alerts";

type SortField = "id" | "sourceAccount" | "amount" | "riskScore" | "timestamp";

export default function AlertTable() {
  const { alerts, selectedAlertId, setSelectedAlertId, filter, setFilter, resolveAlert } = useAlertStore();
  const { addToast } = useUIStore();

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    sourceAccount: true,
    destinationAccount: true,
    amount: true,
    riskScore: true,
    status: true,
    timestamp: true,
  });
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);

  // Sorting states
  const [sortField, setSortField] = useState<SortField>("riskScore");
  const [sortAsc, setSortAsc] = useState(false);

  // Row selection states
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Filter alerts by search query and risk range
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const searchLower = filter.search.toLowerCase();
      const matchesSearch =
        alert.id.toLowerCase().includes(searchLower) ||
        alert.sourceAccount.toLowerCase().includes(searchLower) ||
        alert.destinationAccount.toLowerCase().includes(searchLower) ||
        (alert.entityDetails?.name || "").toLowerCase().includes(searchLower);

      const matchesRisk = alert.riskScore >= filter.minRisk && alert.riskScore <= filter.maxRisk;

      return matchesSearch && matchesRisk;
    });
  }, [alerts, filter.search, filter.minRisk, filter.maxRisk]);

  // Sort matched alerts
  const sortedAlerts = useMemo(() => {
    const sorted = [...filteredAlerts];
    sorted.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Special comparison for amounts if they contain strings, but these are numbers in model
      if (sortField === "amount") {
        aVal = Number(a.amount);
        bVal = Number(b.amount);
      } else if (sortField === "timestamp") {
        aVal = new Date(a.timestamp).getTime();
        bVal = new Date(b.timestamp).getTime();
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredAlerts, sortField, sortAsc]);

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
      setSelectedRows(new Set(sortedAlerts.map((a) => a.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger row selection click
    const next = new Set(selectedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRows(next);
  };

  const handleBulkAction = async (action: "DISMISSED" | "ESCALATED") => {
    const ids = Array.from(selectedRows);
    setIsProcessing(true);
    try {
      for (const id of ids) {
        await resolveAlert(id, action);
      }
      addToast(`Successfully ${action === "ESCALATED" ? "escalated" : "dismissed"} ${ids.length} alerts`, "success");
      setSelectedRows(new Set());
    } catch (e) {
      addToast("Failed to run bulk actions", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="space-y-4 relative">
      {/* Table controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 justify-between">
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            type="text"
            value={filter.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            placeholder="Search accounts, IDs, or entities..."
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg pl-9 pr-4 py-2 text-body-sm focus:outline-none focus:border-primary/50 text-on-surface"
          />
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          {/* Column Visibility Selector */}
          <div className="relative">
            <button
              onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
              className="px-3.5 py-1.5 border border-outline-variant/30 bg-surface-container-lowest rounded-lg text-body-sm text-on-surface-variant hover:text-on-surface hover:border-primary/30 flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">view_week</span>
              Columns
            </button>
            {showVisibilityDropdown && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-outline-variant/30 bg-surface-container-high/95 backdrop-blur-md p-3 shadow-2xl space-y-2 z-20 text-left">
                <div className="text-[9px] font-label-mono uppercase tracking-wider text-on-surface-variant mb-1 font-bold">
                  Visible Fields
                </div>
                {Object.keys(visibleColumns).map((col) => (
                  <label key={col} className="flex items-center gap-2 text-xs font-medium cursor-pointer text-on-surface hover:text-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={visibleColumns[col as keyof typeof visibleColumns]}
                      onChange={(e) =>
                        setVisibleColumns({
                          ...visibleColumns,
                          [col]: e.target.checked,
                        })
                      }
                      className="rounded border-outline-variant/30 text-primary focus:ring-primary/30 bg-surface-container-lowest"
                    />
                    {col === "sourceAccount"
                      ? "Source"
                      : col === "destinationAccount"
                      ? "Destination"
                      : col === "riskScore"
                      ? "Risk"
                      : col === "timestamp"
                      ? "Time"
                      : col.charAt(0).toUpperCase() + col.slice(1)}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-body-sm text-on-surface-variant">Min Risk:</span>
            <select
              value={filter.minRisk}
              onChange={(e) => setFilter({ minRisk: Number(e.target.value) })}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-1.5 text-body-sm text-on-surface"
            >
              <option value="0">All</option>
              <option value="40">Medium (&gt;= 40)</option>
              <option value="70">High (&gt;= 70)</option>
              <option value="90">Critical (&gt;= 90)</option>
            </select>
          </div>

          <button
            onClick={() => setFilter({ search: "", minRisk: 0, maxRisk: 100 })}
            className="text-primary hover:text-primary-fixed text-body-sm font-semibold hover:underline"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Queue Table */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-low max-h-[600px] overflow-y-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
          <thead className="sticky top-0 bg-surface-container-low/95 backdrop-blur-md z-10 border-b border-outline-variant/30">
            <tr className="text-on-surface-variant font-label-mono text-caption uppercase tracking-wider">
              <th className="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={sortedAlerts.length > 0 && selectedRows.size === sortedAlerts.length}
                  className="rounded border-outline-variant/30 text-primary focus:ring-primary/20 bg-surface-container-lowest"
                />
              </th>
              {visibleColumns.id && (
                <th
                  onClick={() => handleSort("id")}
                  className="px-6 py-4 cursor-pointer hover:text-on-surface transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Alert ID
                    {sortField === "id" && (
                      <span className="material-symbols-outlined text-xs">
                        {sortAsc ? "arrow_upward" : "arrow_downward"}
                      </span>
                    )}
                  </div>
                </th>
              )}
              {visibleColumns.sourceAccount && (
                <th
                  onClick={() => handleSort("sourceAccount")}
                  className="px-6 py-4 cursor-pointer hover:text-on-surface transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Source
                    {sortField === "sourceAccount" && (
                      <span className="material-symbols-outlined text-xs">
                        {sortAsc ? "arrow_upward" : "arrow_downward"}
                      </span>
                    )}
                  </div>
                </th>
              )}
              {visibleColumns.destinationAccount && (
                <th className="px-6 py-4">Destination</th>
              )}
              {visibleColumns.amount && (
                <th
                  onClick={() => handleSort("amount")}
                  className="px-6 py-4 cursor-pointer hover:text-on-surface transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Amount
                    {sortField === "amount" && (
                      <span className="material-symbols-outlined text-xs">
                        {sortAsc ? "arrow_upward" : "arrow_downward"}
                      </span>
                    )}
                  </div>
                </th>
              )}
              {visibleColumns.riskScore && (
                <th
                  onClick={() => handleSort("riskScore")}
                  className="px-6 py-4 cursor-pointer hover:text-on-surface text-center transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    Risk
                    {sortField === "riskScore" && (
                      <span className="material-symbols-outlined text-xs">
                        {sortAsc ? "arrow_upward" : "arrow_downward"}
                      </span>
                    )}
                  </div>
                </th>
              )}
              {visibleColumns.status && <th className="px-6 py-4">Status</th>}
              {visibleColumns.timestamp && (
                <th
                  onClick={() => handleSort("timestamp")}
                  className="px-6 py-4 cursor-pointer hover:text-on-surface text-right transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Time
                    {sortField === "timestamp" && (
                      <span className="material-symbols-outlined text-xs">
                        {sortAsc ? "arrow_upward" : "arrow_downward"}
                      </span>
                    )}
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {sortedAlerts.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16 text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
                      inbox
                    </span>
                    <div>
                      <p className="font-semibold text-on-surface">No alerts match these filters</p>
                      <p className="text-caption text-on-surface-variant mt-1">
                        Try resetting your search query or adjusting the risk threshold.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedAlerts.map((alert) => {
                const isSelected = selectedAlertId === alert.id;
                const isChecked = selectedRows.has(alert.id);
                return (
                  <tr
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    className={`cursor-pointer transition-all duration-150 text-body-sm hover:bg-surface-container-high/40 ${
                      isSelected ? "bg-primary-container/10 border-l-2 border-l-primary" : ""
                    } ${isChecked ? "bg-primary-container/5" : ""}`}
                  >
                    <td className="px-6 py-4" onClick={(e) => handleSelectRow(alert.id, e)}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-outline-variant/30 text-primary focus:ring-primary/20 bg-surface-container-lowest"
                      />
                    </td>
                    {visibleColumns.id && (
                      <td className="px-6 py-4 font-bold text-on-surface truncate">{alert.id}</td>
                    )}
                    {visibleColumns.sourceAccount && (
                      <td className="px-6 py-4 font-label-mono text-on-surface-variant truncate">
                        {alert.sourceAccount}
                      </td>
                    )}
                    {visibleColumns.destinationAccount && (
                      <td className="px-6 py-4 font-label-mono text-on-surface-variant truncate">
                        {alert.destinationAccount}
                      </td>
                    )}
                    {visibleColumns.amount && (
                      <td className="px-6 py-4 font-bold text-on-surface truncate">
                        {alert.amount.toLocaleString()} {alert.currency}
                      </td>
                    )}
                    {visibleColumns.riskScore && (
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span
                            className={`px-2.5 py-0.5 border rounded-full text-caption font-bold ${getRiskColorClass(
                              alert.riskScore
                            )}`}
                          >
                            {alert.riskScore}
                          </span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            alert.status === "PENDING"
                              ? "bg-surface-container-highest text-on-surface-variant border border-outline-variant/35"
                              : alert.status === "ESCALATED"
                              ? "bg-risk-high/15 border border-risk-high/35 text-risk-high"
                              : "bg-risk-low/15 border border-risk-low/35 text-risk-low"
                          }`}
                        >
                          {alert.status}
                        </span>
                      </td>
                    )}
                    {visibleColumns.timestamp && (
                      <td className="px-6 py-4 text-right text-on-surface-variant text-caption font-label-mono truncate">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedRows.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-container-high border border-outline-variant/40 rounded-xl px-6 py-3.5 shadow-2xl flex items-center gap-6 z-40 animate-fade-in pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
              {selectedRows.size}
            </span>
            <span className="text-body-sm font-semibold text-on-surface">Selected Alerts</span>
          </div>

          <div className="w-px h-5 bg-outline-variant/35" />

          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction("ESCALATED")}
              disabled={isProcessing}
              className="px-3.5 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-xs">assignment</span>
              Bulk Escalate
            </button>
            <button
              onClick={() => handleBulkAction("DISMISSED")}
              disabled={isProcessing}
              className="px-3.5 py-1.5 border border-outline-variant/30 hover:border-risk-high/30 bg-[#07090e] rounded-lg text-xs font-bold text-on-surface-variant hover:text-risk-high transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-xs">delete_outline</span>
              Bulk Dismiss
            </button>
            <button
              onClick={() => setSelectedRows(new Set())}
              className="px-3 py-1.5 text-xs text-on-surface-variant hover:text-on-surface hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
