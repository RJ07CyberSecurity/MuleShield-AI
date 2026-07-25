"use client";

import { Case } from "../../types/cases";
import { Archive, ArrowRightLeft, FileText, Lock, ShieldAlert, UserPlus } from "lucide-react";
import { useUIStore } from "../../store/useUIStore";

interface CaseActionBarProps {
  caseData: Case;
  onUpdateStatus: (id: string, status: Case["status"]) => void;
}

export default function CaseActionBar({ caseData, onUpdateStatus }: CaseActionBarProps) {
  const { addToast } = useUIStore();

  const handleAction = (action: string) => {
    addToast(`${action} action triggered for Case ${caseData.id}`, "success");
  };

  return (
    <div className="p-3 bg-surface-container-lowest border-b border-outline-variant/30 flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2">
        <button
          onClick={() => handleAction("Assign Investigator")}
          className="px-2.5 py-1.5 bg-surface-container-low hover:bg-surface-container-highest border border-outline-variant/30 rounded-lg text-[10px] font-bold text-on-surface flex items-center gap-1.5 whitespace-nowrap transition-colors"
        >
          <UserPlus size={12} className="text-primary" /> Assign
        </button>
        <button
          onClick={() => handleAction("Transfer Case")}
          className="px-2.5 py-1.5 bg-surface-container-low hover:bg-surface-container-highest border border-outline-variant/30 rounded-lg text-[10px] font-bold text-on-surface flex items-center gap-1.5 whitespace-nowrap transition-colors"
        >
          <ArrowRightLeft size={12} className="text-on-surface-variant" /> Transfer
        </button>
        <button
          onClick={() => handleAction("Generate Investigation Report")}
          className="px-2.5 py-1.5 bg-surface-container-low hover:bg-surface-container-highest border border-outline-variant/30 rounded-lg text-[10px] font-bold text-on-surface flex items-center gap-1.5 whitespace-nowrap transition-colors"
        >
          <FileText size={12} className="text-on-surface-variant" /> Report
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleAction("Freeze Recommendation")}
          className="px-2.5 py-1.5 bg-surface-container-low hover:bg-risk-high/10 border border-risk-high/30 rounded-lg text-[10px] font-bold text-risk-high flex items-center gap-1.5 whitespace-nowrap transition-colors"
        >
          <Lock size={12} /> Freeze
        </button>
        {caseData.status !== "CLOSED" ? (
          <button
            onClick={() => onUpdateStatus(caseData.id, "CLOSED")}
            className="px-3 py-1.5 bg-primary hover:bg-primary-fixed text-on-primary rounded-lg text-[10px] font-bold flex items-center gap-1.5 whitespace-nowrap shadow-md transition-all"
          >
            <Archive size={12} /> Close Case
          </button>
        ) : (
          <button
            onClick={() => onUpdateStatus(caseData.id, "INVESTIGATING")}
            className="px-3 py-1.5 bg-risk-medium hover:bg-risk-medium/90 text-[#07090e] rounded-lg text-[10px] font-bold flex items-center gap-1.5 whitespace-nowrap shadow-md transition-all"
          >
            <ShieldAlert size={12} /> Reopen Case
          </button>
        )}
      </div>
    </div>
  );
}
