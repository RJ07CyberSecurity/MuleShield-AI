"use client";

import { useAlertStore } from "../../store/useAlertStore";
import { getRiskColorClass } from "../../types/alerts";

export default function AlertTable() {
  const { alerts, selectedAlertId, setSelectedAlertId, filter, setFilter } = useAlertStore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ search: e.target.value });
  };

  // Filter alerts by search query and active status PENDING
  const filteredAlerts = alerts.filter((alert) => {
    const searchLower = filter.search.toLowerCase();
    const matchesSearch =
      alert.id.toLowerCase().includes(searchLower) ||
      alert.sourceAccount.toLowerCase().includes(searchLower) ||
      alert.destinationAccount.toLowerCase().includes(searchLower) ||
      (alert.entityDetails?.name || "").toLowerCase().includes(searchLower);

    const matchesRisk = alert.riskScore >= filter.minRisk && alert.riskScore <= filter.maxRisk;

    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            type="text"
            value={filter.search}
            onChange={handleSearchChange}
            placeholder="Search account, ID, or entity..."
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg pl-9 pr-4 py-2 text-body-sm focus:outline-none focus:border-primary/50 text-on-surface"
          />
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
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
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-low">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-mono text-caption uppercase tracking-wider bg-surface-container-high/40">
              <th className="px-6 py-4">Alert ID</th>
              <th className="px-6 py-4">Source Account</th>
              <th className="px-6 py-4">Destination</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4 text-center">Risk Score</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-on-surface-variant">
                  No matching alerts found in the queue.
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alert) => {
                const isSelected = selectedAlertId === alert.id;
                return (
                  <tr
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    className={`cursor-pointer transition-colors border-b border-outline-variant/10 text-body-sm hover:bg-surface-container-high/50 ${
                      isSelected ? "bg-primary-container/10 border-l-2 border-l-primary" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-semibold text-on-surface">{alert.id}</td>
                    <td className="px-6 py-4 font-label-mono text-on-surface-variant">{alert.sourceAccount}</td>
                    <td className="px-6 py-4 font-label-mono text-on-surface-variant">{alert.destinationAccount}</td>
                    <td className="px-6 py-4 font-bold text-on-surface">
                      {alert.amount.toLocaleString()} {alert.currency}
                    </td>
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
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          alert.status === "PENDING"
                            ? "bg-surface-container-highest text-on-surface-variant"
                            : alert.status === "ESCALATED"
                            ? "bg-risk-high/20 text-risk-high"
                            : "bg-risk-low/20 text-risk-low"
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-on-surface-variant text-caption font-label-mono">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
