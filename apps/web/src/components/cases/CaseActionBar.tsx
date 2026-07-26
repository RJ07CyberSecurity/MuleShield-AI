"use client";

import { useState, useRef, useEffect } from "react";
import { Case } from "../../types/cases";
import { Archive, ArrowRightLeft, FileText, Lock, ShieldAlert, UserPlus, ChevronDown, Check } from "lucide-react";
import { useUIStore } from "../../store/useUIStore";
import { useCaseStore } from "../../store/useCaseStore";
import { apiClient } from "../../services/api-client";
import { AuthUser } from "../../store/useAuthStore";

interface CaseActionBarProps {
  caseData: Case;
  onUpdateStatus: (id: string, status: Case["status"]) => void;
}

export default function CaseActionBar({ caseData, onUpdateStatus }: CaseActionBarProps) {
  const { addToast } = useUIStore();
  const { assignCase } = useCaseStore();
  
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleAction = (action: string) => {
    addToast(`${action} action triggered for Case ${caseData.id}`, "success");
  };

  const handleAssignClick = async () => {
    setIsAssignOpen(!isAssignOpen);
    if (!isAssignOpen && users.length === 0) {
      setIsLoadingUsers(true);
      try {
        const res = await apiClient.get<any>("/api/v1/auth/users");
        if (res.success && res.data) {
          setUsers(res.data);
        }
      } catch (err) {
        addToast("Failed to load users", "error");
      } finally {
        setIsLoadingUsers(false);
      }
    }
  };

  const handleAssign = async (userId: string, userName: string) => {
    setIsAssignOpen(false);
    try {
      await assignCase(caseData.id, userId, userName);
      addToast("Case assigned successfully", "success");
    } catch (err) {
      addToast("Failed to assign case", "error");
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAssignOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative z-10 p-3 bg-surface-container-lowest border-b border-outline-variant/30 flex items-center justify-between gap-2 overflow-visible">
      <div className="flex gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleAssignClick}
            className="px-2.5 py-1.5 bg-surface-container-low hover:bg-surface-container-highest border border-outline-variant/30 rounded-lg text-[10px] font-bold text-on-surface flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <UserPlus size={12} className="text-primary" /> Assign <ChevronDown size={10} className="text-on-surface-variant" />
          </button>
          
          {isAssignOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-surface-container rounded-lg border border-outline-variant/30 shadow-lg overflow-hidden z-50">
              <div className="p-2 border-b border-outline-variant/30 bg-surface-container-low">
                <h4 className="text-xs font-semibold text-on-surface">Assign Case</h4>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {isLoadingUsers ? (
                  <div className="p-3 text-xs text-on-surface-variant text-center">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="p-3 text-xs text-on-surface-variant text-center">No users found.</div>
                ) : (
                  users.map((user) => {
                    const isAssigned = caseData.assignee_id === user.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleAssign(user.id, `${user.first_name} ${user.last_name}`)}
                        disabled={isAssigned}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-surface-container-highest transition-colors ${isAssigned ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-on-surface">{user.first_name} {user.last_name}</span>
                          <span className="text-[10px] text-on-surface-variant capitalize">{user.roles?.map(r => typeof r === 'string' ? r : (r as any).name).join(', ')}</span>
                        </div>
                        {isAssigned && <Check size={12} className="text-primary" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

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
