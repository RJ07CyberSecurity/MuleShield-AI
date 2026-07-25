"use client";

import { useMemo, useState } from "react";
import { Case } from "../../types/cases";
import { ArrowDown, ArrowUp } from "lucide-react";

type SortField = "id" | "priority" | "status" | "assignedTo" | "sla" | "riskScore" | "created" | "customer";

interface InvestigationTableProps {
  cases: Case[];
  isLoading: boolean;
  selectedRows: Set<string>;
  onSelectRow: (id: string, e: React.MouseEvent) => void;
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>, visibleCases: Case[]) => void;
  onRowClick: (id: string) => void;
  activeCaseId: string | null;
}

export default function InvestigationTable({
  cases,
  isLoading,
  selectedRows,
  onSelectRow,
  onSelectAll,
  onRowClick,
  activeCaseId,
}: InvestigationTableProps) {
  const [sortField, setSortField] = useState<SortField>("riskScore");
  const [sortAsc, setSortAsc] = useState(false);

  const sortedCases = useMemo(() => {
    const sorted = [...cases];
    sorted.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      switch (sortField) {
        case "customer":
          aVal = a.customerName;
          bVal = b.customerName;
          break;
        case "created":
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case "sla":
          aVal = a.slaRemaining;
          bVal = b.slaRemaining;
          break;
        default:
          break;
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [cases, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getPriorityColor = (priority: string = "LOW") => {
    if (priority === "CRITICAL") return "text-risk-critical border-risk-critical/20 bg-risk-critical/10";
    if (priority === "HIGH") return "text-risk-high border-risk-high/20 bg-risk-high/10";
    if (priority === "MEDIUM") return "text-risk-medium border-risk-medium/20 bg-risk-medium/10";
    return "text-risk-low border-risk-low/20 bg-risk-low/10";
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortAsc ? <ArrowUp size={12} className="ml-1 inline" /> : <ArrowDown size={12} className="ml-1 inline" />;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-low max-h-[700px] overflow-y-auto relative flex-1">
      {isLoading && (
        <div className="absolute inset-0 bg-surface-container-low/50 backdrop-blur-sm z-20 flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-primary text-3xl">autorenew</span>
        </div>
      )}
      <table className="w-full text-left border-collapse min-w-[1100px] table-fixed">
        <thead className="sticky top-0 bg-surface-container-low/95 backdrop-blur-md z-10 border-b border-outline-variant/30 select-none">
          <tr className="text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest">
            <th className="px-4 py-4 w-12 text-center">
              <input
                type="checkbox"
                onChange={(e) => onSelectAll(e, sortedCases)}
                checked={sortedCases.length > 0 && selectedRows.size === sortedCases.length}
                className="rounded border-outline-variant/30 text-primary focus:ring-primary/20 bg-surface-container-lowest cursor-pointer"
              />
            </th>
            <th onClick={() => handleSort("id")} className="px-4 py-4 cursor-pointer hover:text-on-surface w-24">
              Case ID <SortIcon field="id" />
            </th>
            <th onClick={() => handleSort("customer")} className="px-4 py-4 cursor-pointer hover:text-on-surface">
              Customer / Account <SortIcon field="customer" />
            </th>
            <th onClick={() => handleSort("priority")} className="px-4 py-4 cursor-pointer hover:text-on-surface text-center w-28">
              Priority <SortIcon field="priority" />
            </th>
            <th onClick={() => handleSort("status")} className="px-4 py-4 cursor-pointer hover:text-on-surface w-36">
              Stage <SortIcon field="status" />
            </th>
            <th onClick={() => handleSort("assignedTo")} className="px-4 py-4 cursor-pointer hover:text-on-surface w-40">
              Investigator <SortIcon field="assignedTo" />
            </th>
            <th onClick={() => handleSort("sla")} className="px-4 py-4 cursor-pointer hover:text-on-surface w-24">
              SLA Time <SortIcon field="sla" />
            </th>
            <th onClick={() => handleSort("riskScore")} className="px-4 py-4 cursor-pointer hover:text-on-surface w-32">
              Risk & AI Conf <SortIcon field="riskScore" />
            </th>
            <th onClick={() => handleSort("created")} className="px-4 py-4 cursor-pointer hover:text-on-surface text-right w-36">
              Created Date <SortIcon field="created" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          {sortedCases.length === 0 && !isLoading && (
            <tr>
              <td colSpan={9} className="px-4 py-16 text-center text-on-surface-variant text-sm">
                No active investigations matching the current filters.
              </td>
            </tr>
          )}
          {sortedCases.map((c) => {
            const isChecked = selectedRows.has(c.id);
            const isActive = activeCaseId === c.id;

            return (
              <tr
                key={c.id}
                onClick={() => onRowClick(c.id)}
                className={`text-xs transition-colors cursor-pointer border-l-2 ${
                  isActive
                    ? "bg-surface-container-high border-l-primary"
                    : isChecked
                    ? "bg-primary-container/5 border-l-transparent"
                    : "hover:bg-surface-container-high/40 border-l-transparent"
                }`}
              >
                <td className="px-4 py-4 text-center" onClick={(e) => { e.stopPropagation(); onSelectRow(c.id, e); }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="rounded border-outline-variant/30 text-primary focus:ring-primary/20 bg-surface-container-lowest cursor-pointer pointer-events-none"
                  />
                </td>
                <td className="px-4 py-4 font-bold text-primary font-label-mono truncate">{c.id}</td>
                <td className="px-4 py-4 truncate">
                  <div className="font-semibold text-on-surface truncate">{c.customerName}</div>
                  <div className="text-[10px] text-on-surface-variant font-label-mono mt-0.5">
                    {c.muleNodes?.[0]} • {c.bank}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-center">
                    <span className={`px-2.5 py-0.5 rounded border text-[9px] font-bold ${getPriorityColor(c.priority)}`}>
                      {c.priority}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 font-semibold text-on-surface truncate">
                  <div className="flex flex-col">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${c.status === "CLOSED" ? "bg-on-surface-variant/40" : c.status === "INVESTIGATING" ? "bg-risk-high animate-pulse" : "bg-primary"}`}></span>
                      {c.currentStage}
                    </span>
                    <span className="text-[9px] text-on-surface-variant ml-3 font-normal mt-0.5">{c.evidenceCount} Evidences</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-on-surface-variant font-medium truncate">
                  {c.assignedTo === "Unassigned" ? (
                    <span className="italic text-on-surface-variant/50">Unassigned</span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-secondary-container text-primary text-[8px] font-bold flex items-center justify-center border border-outline-variant/30">
                        {c.assignedTo.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                      </span>
                      {c.assignedTo}
                    </span>
                  )}
                </td>
                <td className={`px-4 py-4 font-label-mono font-semibold truncate ${c.slaRemaining?.startsWith("-") ? "text-risk-critical" : "text-on-surface-variant"}`}>
                  {c.slaRemaining}
                </td>
                <td className="px-4 py-4">
                  <div className="w-full">
                    <div className="flex justify-between items-baseline text-[9px] font-label-mono text-on-surface-variant">
                      <span>Score</span>
                      <span className="font-bold text-on-surface">{c.riskScore}/100</span>
                    </div>
                    <div className="h-1 bg-surface-container-high rounded-full overflow-hidden w-full mt-1 mb-1">
                      <div
                        className={`h-full rounded-full ${c.riskScore >= 90 ? "bg-risk-critical" : c.riskScore >= 70 ? "bg-risk-high" : "bg-risk-medium"}`}
                        style={{ width: `${c.riskScore}%` }}
                      />
                    </div>
                    <div className="text-[8px] text-primary font-label-mono text-right">
                      {c.aiConfidence}% AI CONFIDENCE
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-label-mono text-on-surface-variant truncate">
                  {new Date(c.createdAt).toLocaleString(undefined, {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
