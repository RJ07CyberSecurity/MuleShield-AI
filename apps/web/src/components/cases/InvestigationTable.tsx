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
      let aVal: any = (a as any)[sortField];
      let bVal: any = (b as any)[sortField];

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

  const getStageBadgeStyles = (stage?: string) => {
    switch (stage?.toLowerCase()) {
      case "alert triage": return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
      case "escalated": return "bg-orange-500/10 text-orange-500 border border-orange-500/20";
      case "investigation started": return "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20";
      case "evidence collection": return "bg-purple-500/10 text-purple-500 border border-purple-500/20";
      case "transaction analysis": return "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20";
      case "network analysis": return "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20";
      case "risk assessment": return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";
      case "supervisor review": return "bg-pink-500/10 text-pink-500 border border-pink-500/20";
      case "closed": return "bg-green-500/10 text-green-500 border border-green-500/20";
      case "rejected": return "bg-red-500/10 text-red-500 border border-red-500/20";
      default: return "bg-primary/10 text-primary border border-primary/20";
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
      <div className="hidden md:block">
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
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold ${getStageBadgeStyles(c.currentStage)}`}>{c.currentStage}</span>
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
      
      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-outline-variant/10">
        {sortedCases.length === 0 && !isLoading && (
          <div className="px-4 py-16 text-center text-on-surface-variant text-sm">
            No active investigations matching the current filters.
          </div>
        )}
        {sortedCases.map((c) => {
          const isChecked = selectedRows.has(c.id);
          const isActive = activeCaseId === c.id;

          return (
            <div
              key={`m-${c.id}`}
              onClick={() => onRowClick(c.id)}
              className={`p-4 space-y-4 cursor-pointer transition-colors border-l-2 ${
                isActive
                  ? "bg-surface-container-high border-l-primary"
                  : isChecked
                  ? "bg-primary-container/5 border-l-transparent"
                  : "hover:bg-surface-container-high/40 border-l-transparent"
              }`}
            >
              {/* Header: Checkbox + ID + Priority */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    onClick={(e) => { e.stopPropagation(); onSelectRow(c.id, e); }}
                    className="rounded border-outline-variant/30 text-primary focus:ring-primary/20 bg-surface-container-lowest cursor-pointer"
                  />
                  <span className="font-bold text-primary font-label-mono text-sm">{c.id}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded border text-[9px] font-bold ${getPriorityColor(c.priority)}`}>
                  {c.priority}
                </span>
              </div>

              {/* Customer Info */}
              <div>
                <div className="font-semibold text-on-surface truncate">{c.customerName}</div>
                <div className="text-[10px] text-on-surface-variant font-label-mono mt-0.5">
                  {c.muleNodes?.[0]} • {c.bank}
                </div>
              </div>

              {/* Status & SLA */}
              <div className="flex justify-between items-center bg-surface-container-highest/30 p-2 rounded-lg border border-outline-variant/10">
                <div className="flex flex-col">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold ${getStageBadgeStyles(c.currentStage)}`}>{c.currentStage}</span>
                  <span className="text-[9px] text-on-surface-variant font-normal mt-0.5 ml-3">{c.evidenceCount} Evidences</span>
                </div>
                <div className={`font-label-mono font-semibold text-xs ${c.slaRemaining?.startsWith("-") ? "text-risk-critical" : "text-on-surface-variant"}`}>
                  {c.slaRemaining}
                </div>
              </div>

              {/* Assignment & Risk Score */}
              <div className="flex justify-between items-end">
                <div>
                  {c.assignedTo === "Unassigned" ? (
                    <span className="italic text-[10px] text-on-surface-variant/50">Unassigned</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <span className="w-4 h-4 rounded-full bg-secondary-container text-primary text-[7px] font-bold flex items-center justify-center border border-outline-variant/30">
                        {c.assignedTo.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                      </span>
                      {c.assignedTo}
                    </span>
                  )}
                </div>
                <div className="w-24 text-right">
                  <div className="flex justify-between items-baseline text-[9px] font-label-mono text-on-surface-variant mb-1">
                    <span>Score</span>
                    <span className="font-bold text-on-surface">{c.riskScore}</span>
                  </div>
                  <div className="h-1 bg-surface-container-high rounded-full overflow-hidden w-full mb-1">
                    <div
                      className={`h-full rounded-full ${c.riskScore >= 90 ? "bg-risk-critical" : c.riskScore >= 70 ? "bg-risk-high" : "bg-risk-medium"}`}
                      style={{ width: `${c.riskScore}%` }}
                    />
                  </div>
                  <div className="text-[8px] text-primary font-label-mono">
                    {c.aiConfidence}% AI CONF
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
