"use client";

import { Filter, Save, Download, Group, Plus } from "lucide-react";
import { useUIStore } from "../../store/useUIStore";

interface FilterBarProps {
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterPriority: string;
  setFilterPriority: (val: string) => void;
  filterAssignee: string;
  setFilterAssignee: (val: string) => void;
  selectedCount: number;
  onBulkAssign: () => void;
}

export default function FilterBar({
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  filterAssignee,
  setFilterAssignee,
  selectedCount,
  onBulkAssign,
}: FilterBarProps) {
  const { addToast } = useUIStore();

  return (
    <section className="flex flex-wrap items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 text-body-sm">
      <div className="flex items-center gap-2">
        <span className="text-on-surface-variant text-xs font-semibold">Status:</span>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary/50"
        >
          <option value="All Active">All Active</option>
          <option value="NEW">New Alerts</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="SAR_DRAFTED">SAR Drafted</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-on-surface-variant text-xs font-semibold">Priority:</span>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary/50"
        >
          <option value="All">All Priorities</option>
          <option value="Critical, High">Critical & High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-on-surface-variant text-xs font-semibold">Assignee:</span>
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary/50"
        >
          <option value="All">All Assignees</option>
          <option value="Me">Assigned to Me</option>
          <option value="Unassigned">Unassigned</option>
        </select>
      </div>

      <button
        onClick={() => addToast("Advanced filtering panel opened", "info")}
        className="px-3.5 py-1.5 border border-outline-variant/30 bg-surface-container-lowest hover:border-primary/45 rounded-xl text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors"
      >
        <Filter size={14} />
        Advanced Filters
      </button>

      <button
        onClick={() => addToast("Filter view saved as default", "success")}
        className="px-3.5 py-1.5 border border-outline-variant/30 bg-surface-container-lowest hover:border-primary/45 rounded-xl text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors"
      >
        <Save size={14} />
        Save Filters
      </button>

      <div className="flex gap-2 ml-auto">
        <button
          onClick={onBulkAssign}
          disabled={selectedCount === 0}
          className="px-3.5 py-1.5 border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-high rounded-xl text-xs font-semibold text-on-surface disabled:opacity-50 disabled:hover:bg-surface-container-lowest flex items-center gap-1.5 transition-colors"
        >
          <Group size={14} />
          Bulk Assign {selectedCount > 0 && `(${selectedCount})`}
        </button>
        <button
          onClick={() => addToast("Registry Export completed successfully.", "success")}
          className="px-3.5 py-1.5 border border-outline-variant/30 bg-surface-container-lowest rounded-xl text-xs font-semibold text-on-surface hover:border-primary/45 flex items-center gap-1.5 transition-all"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>
    </section>
  );
}
