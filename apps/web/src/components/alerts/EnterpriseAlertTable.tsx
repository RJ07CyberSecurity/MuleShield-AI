"use client";

import React from "react";
import { Alert } from "../../types/alerts";

interface EnterpriseAlertTableProps {
  alerts: Alert[];
  selectedAlertId: string | null;
  onSelectAlert: (id: string) => void;
  sortAsc: boolean;
  onToggleSort: () => void;
}

export default function EnterpriseAlertTable({
  alerts,
  selectedAlertId,
  onSelectAlert,
  sortAsc,
  onToggleSort
}: EnterpriseAlertTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-low overflow-y-auto max-h-[800px] shadow-lg">
      <div className="hidden md:block">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
        <thead className="sticky top-0 bg-surface-container-low/95 backdrop-blur-md z-10 border-b border-outline-variant/20 shadow-sm">
          <tr className="text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest bg-surface-container-highest/20">
            <th className="px-4 py-4 w-12 text-center">Pri</th>
            <th className="px-4 py-4 cursor-pointer hover:text-on-surface transition-colors" onClick={onToggleSort}>
              <div className="flex items-center gap-1">
                Risk Score
                <span className="material-symbols-outlined text-[10px]">
                  {sortAsc ? "arrow_upward" : "arrow_downward"}
                </span>
              </div>
            </th>
            <th className="px-4 py-4">Customer</th>
            <th className="px-4 py-4">Account / Bank</th>
            <th className="px-4 py-4">Amount / Velocity</th>
            <th className="px-4 py-4">Triggered Rules</th>
            <th className="px-4 py-4 text-center">AI Confidence</th>
            <th className="px-4 py-4 text-right">Status / Assignee</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          {alerts.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-16 text-on-surface-variant text-sm">
                No alerts match the current filter criteria.
              </td>
            </tr>
          ) : (
            alerts.map((alert) => {
              const isSelected = selectedAlertId === alert.id;
              const isCritical = alert.riskScore >= 90;
              const isHigh = alert.riskScore >= 70 && alert.riskScore < 90;
              
              const rowClass = isSelected 
                ? "bg-primary/5 border-l-2 border-l-primary" 
                : isCritical
                ? "hover:bg-risk-critical/5 border-l-2 border-l-transparent hover:border-l-risk-critical"
                : isHigh
                ? "hover:bg-risk-high/5 border-l-2 border-l-transparent hover:border-l-risk-high"
                : "hover:bg-surface-container-highest/30 border-l-2 border-l-transparent hover:border-l-risk-medium";

              return (
                <tr
                  key={alert.id}
                  onClick={() => onSelectAlert(alert.id)}
                  className={`cursor-pointer transition-colors text-xs ${rowClass}`}
                >
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        isCritical
                          ? "bg-risk-critical animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"
                          : isHigh
                          ? "bg-risk-high"
                          : "bg-risk-medium"
                      }`}
                    ></span>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className={`font-bold font-display-kpi text-lg leading-tight ${isCritical ? 'text-risk-critical' : isHigh ? 'text-risk-high' : 'text-risk-medium'}`}>
                        {alert.riskScore}
                      </span>
                      <span className="text-[9px] font-label-mono text-on-surface-variant uppercase">{alert.id}</span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-on-surface truncate max-w-[150px]">
                        {alert.entityDetails?.name || "Unknown Entity"}
                      </span>
                      <span className="text-[10px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[10px]">badge</span>
                        {alert.entityDetails?.category || "Retail"}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-label-mono text-on-surface font-semibold">
                        {alert.sourceAccount}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">Internal Bank</span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-risk-critical">
                        ${alert.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-label-mono">
                        TX: {alert.transactionId.substring(0, 8)}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                      <span className="px-1.5 py-0.5 rounded bg-risk-high/10 border border-risk-high/20 text-risk-high text-[9px] font-bold uppercase truncate max-w-[120px]">
                        {alert.tippingPoint?.split(":")[0] || "Anomaly"}
                      </span>
                      {alert.shapExplanation && Object.keys(alert.shapExplanation).slice(0, 1).map((key) => (
                        <span key={key} className="px-1.5 py-0.5 rounded bg-risk-medium/10 border border-risk-medium/20 text-risk-medium text-[9px] font-bold uppercase truncate max-w-[80px]">
                          {key}
                        </span>
                      ))}
                    </div>
                  </td>
                  
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(alert.riskScore + 5, 99)}%` }}></div>
                      </div>
                      <span className="text-[9px] font-label-mono text-primary font-bold">{Math.min(alert.riskScore + 5, 99)}%</span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-label-mono uppercase font-bold border ${
                        alert.status === "PENDING" ? "bg-surface-container-highest border-outline-variant/30 text-on-surface" :
                        alert.status === "ESCALATED" ? "bg-risk-high/10 border-risk-high/30 text-risk-high" :
                        "bg-risk-low/10 border-risk-low/30 text-risk-low"
                      }`}>
                        {alert.status === "PENDING" ? "Unassigned" : alert.status}
                      </span>
                      {alert.status !== "PENDING" && (
                        <span className="text-[9px] text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px]">person</span>
                          Investigator_4
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-outline-variant/10">
        {alerts.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant text-sm">
            No alerts match the current filter criteria.
          </div>
        ) : (
          alerts.map((alert) => {
            const isSelected = selectedAlertId === alert.id;
            const isCritical = alert.riskScore >= 90;
            const isHigh = alert.riskScore >= 70 && alert.riskScore < 90;

            const rowClass = isSelected
              ? "bg-primary/5 border-l-2 border-l-primary"
              : isCritical
              ? "hover:bg-risk-critical/5 border-l-2 border-l-transparent hover:border-l-risk-critical"
              : isHigh
              ? "hover:bg-risk-high/5 border-l-2 border-l-transparent hover:border-l-risk-high"
              : "hover:bg-surface-container-highest/30 border-l-2 border-l-transparent hover:border-l-risk-medium";

            return (
              <div
                key={`m-${alert.id}`}
                onClick={() => onSelectAlert(alert.id)}
                className={`p-4 space-y-4 cursor-pointer transition-colors text-xs ${rowClass}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        isCritical
                          ? "bg-risk-critical animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"
                          : isHigh
                          ? "bg-risk-high"
                          : "bg-risk-medium"
                      }`}
                    ></span>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-label-mono text-on-surface-variant uppercase">{alert.id}</span>
                      <span className="font-bold text-on-surface truncate">
                        {alert.entityDetails?.name || "Unknown Entity"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`font-bold font-display-kpi text-lg leading-tight ${isCritical ? 'text-risk-critical' : isHigh ? 'text-risk-high' : 'text-risk-medium'}`}>
                      {alert.riskScore}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-surface-container-highest/30 p-2 rounded-lg border border-outline-variant/10">
                  <div className="flex flex-col">
                    <span className="font-label-mono text-on-surface font-semibold">
                      {alert.sourceAccount}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">Internal Bank</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="font-bold text-risk-critical">
                      ${alert.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-label-mono">
                      TX: {alert.transactionId.substring(0, 8)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-risk-high/10 border border-risk-high/20 text-risk-high text-[9px] font-bold uppercase">
                    {alert.tippingPoint?.split(":")[0] || "Anomaly"}
                  </span>
                  {alert.shapExplanation && Object.keys(alert.shapExplanation).slice(0, 1).map((key) => (
                    <span key={key} className="px-1.5 py-0.5 rounded bg-risk-medium/10 border border-risk-medium/20 text-risk-medium text-[9px] font-bold uppercase">
                      {key}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-end pt-2 border-t border-outline-variant/10">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-label-mono uppercase font-bold border w-fit ${
                      alert.status === "PENDING" ? "bg-surface-container-highest border-outline-variant/30 text-on-surface" :
                      alert.status === "ESCALATED" ? "bg-risk-high/10 border-risk-high/30 text-risk-high" :
                      "bg-risk-low/10 border-risk-low/30 text-risk-low"
                    }`}>
                      {alert.status === "PENDING" ? "Unassigned" : alert.status}
                    </span>
                    {alert.status !== "PENDING" && (
                      <span className="text-[9px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">person</span>
                        Investigator_4
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.min(alert.riskScore + 5, 99)}%` }}></div>
                    </div>
                    <span className="text-[9px] font-label-mono text-primary font-bold">AI CONF {Math.min(alert.riskScore + 5, 99)}%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
