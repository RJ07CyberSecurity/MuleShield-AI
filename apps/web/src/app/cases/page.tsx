"use client";

import { useState, useMemo, useEffect } from "react";
import { useUIStore } from "../../store/useUIStore";
import { useCaseStore } from "../../store/useCaseStore";
import KPIStats from "../../components/cases/KPIStats";
import FilterBar from "../../components/cases/FilterBar";
import InvestigationTable from "../../components/cases/InvestigationTable";
import CaseDetailsPanel from "../../components/cases/CaseDetailsPanel";

export default function CasesPage() {
  const { addToast } = useUIStore();
  const { cases, fetchCases, isLoading, updateCaseStatus } = useCaseStore();

  const [filterStatus, setFilterStatus] = useState("All Active");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterAssignee, setFilterAssignee] = useState("All");

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (filterStatus === "Closed" && c.status !== "CLOSED") return false;
      if (filterStatus === "NEW" && c.status !== "NEW") return false;
      if (filterStatus === "INVESTIGATING" && c.status !== "INVESTIGATING") return false;
      if (filterStatus === "SAR_DRAFTED" && c.status !== "SAR_DRAFTED") return false;
      
      if (filterPriority === "Critical, High") {
        if (c.priority !== "CRITICAL" && c.priority !== "HIGH") return false;
      } else if (filterPriority !== "All" && c.priority !== filterPriority) {
        return false;
      }
      
      if (filterAssignee === "Me" && !c.assignedTo.includes("Active")) return false;
      if (filterAssignee === "Unassigned" && c.assignedTo !== "Unassigned") return false;

      return true;
    });
  }, [cases, filterStatus, filterPriority, filterAssignee]);

  const activeCaseData = useMemo(() => {
    return cases.find((c) => c.id === activeCaseId) || null;
  }, [cases, activeCaseId]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, visibleCases: any[]) => {
    if (e.target.checked) {
      setSelectedRows(new Set(visibleCases.map((c) => c.id)));
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

  const handleBulkAssign = () => {
    addToast(`Successfully assigned ${selectedRows.size} cases to you.`, "success");
    setSelectedRows(new Set());
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col space-y-6 relative overflow-hidden pb-4">
      <div className="flex-shrink-0 space-y-6 pt-4">
        <div className="text-left">
          <h2 className="text-xl font-bold text-on-surface">Investigation Case Registry</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Centralised Investigation Workspace for Suspicious Banking Activities
          </p>
        </div>

        <KPIStats cases={cases} />

        <FilterBar
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
          filterAssignee={filterAssignee}
          setFilterAssignee={setFilterAssignee}
          selectedCount={selectedRows.size}
          onBulkAssign={handleBulkAssign}
        />
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
        <InvestigationTable
          cases={filteredCases}
          isLoading={isLoading}
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          onRowClick={(id) => setActiveCaseId(id)}
          activeCaseId={activeCaseId}
        />

        {activeCaseId && (
          <CaseDetailsPanel
            caseData={activeCaseData}
            onClose={() => setActiveCaseId(null)}
            onUpdateStatus={updateCaseStatus}
          />
        )}
      </div>
    </div>
  );
}
