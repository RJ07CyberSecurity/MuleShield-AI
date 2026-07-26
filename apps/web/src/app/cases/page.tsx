"use client";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useUIStore } from "../../store/useUIStore";
import { useCaseStore } from "../../store/useCaseStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useInvestigationSocket } from "../../hooks/useInvestigationSocket";
import KPIStats from "../../components/cases/KPIStats";
import FilterBar from "../../components/cases/FilterBar";
import InvestigationTable from "../../components/cases/InvestigationTable";
import CaseDetailsPanel from "../../components/cases/CaseDetailsPanel";

export default function CasesPage() {
  const { addToast } = useUIStore();
  const { cases, fetchCases, isLoading, updateCaseStatus, presenceMap, connectedUsers } = useCaseStore();
  const { user, isAuthenticated } = useAuthStore();

  const [filterStatus, setFilterStatus] = useState("All Active");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterAssignee, setFilterAssignee] = useState("All");

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  // ── Real-time shared workspace ───────────────────────────────────────────
  // Mount the WebSocket hook — single instance for the entire Investigation page.
  // Handles connection, reconnection, presence, and dispatching remote events.
  const { notifyLeftCase } = useInvestigationSocket({
    activeCaseId,
    isAuthenticated,
  });

  // Initial fetch of shared cases on mount
  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // ── Filters ──────────────────────────────────────────────────────────────
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

  // Presence viewers for the currently active case
  const activePresenceViewers = useMemo(() => {
    if (!activeCaseId) return [];
    return (presenceMap[activeCaseId] || []).filter(
      (name) => name !== `${user?.first_name} ${user?.last_name}`.trim()
    );
  }, [presenceMap, activeCaseId, user]);

  // ── Handlers ─────────────────────────────────────────────────────────────
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

  const handleRowClick = (id: string) => {
    // All authenticated investigators can open any shared case (access-control
    // restriction removed per user confirmation — shared workspace).
    setActiveCaseId(id);
  };

  const handleCloseCase = () => {
    // Notify the server that this user has left the case view
    if (activeCaseId) {
      notifyLeftCase(activeCaseId);
    }
    setActiveCaseId(null);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] md:h-[calc(100vh-80px)] flex flex-col space-y-6 relative overflow-visible md:overflow-hidden pb-4">
      {!activeCaseId && (
        <div className="flex-shrink-0 space-y-6 pt-4">
          <div className="flex justify-between items-center text-left">
            <div>
              <h2 className="text-xl font-bold text-on-surface">Investigation Case Registry</h2>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Centralised Investigation Workspace for Suspicious Banking Activities
              </p>
            </div>
            <Link
              href="/cases/new"
              className="px-4 py-2 bg-primary text-on-primary hover:opacity-90 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              File New Case
            </Link>
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
      )}

      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
        {!activeCaseId && (
          <InvestigationTable
            cases={filteredCases}
            isLoading={isLoading}
            selectedRows={selectedRows}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
            onRowClick={handleRowClick}
            activeCaseId={activeCaseId}
          />
        )}

        {activeCaseId && (
          <CaseDetailsPanel
            caseData={activeCaseData}
            onClose={handleCloseCase}
            onUpdateStatus={updateCaseStatus}
            viewers={activePresenceViewers}
          />
        )}
      </div>
    </div>
  );
}
