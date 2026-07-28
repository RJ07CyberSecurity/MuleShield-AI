"use client";

import { useState, useRef, useEffect } from "react";
import { Case } from "../../types/cases";
import { Archive, ArrowRightLeft, FileText, Lock, ShieldAlert, UserPlus, ChevronDown, Check } from "lucide-react";
import { useUIStore } from "../../store/useUIStore";
import { useCaseStore } from "../../store/useCaseStore";
import { apiClient } from "../../services/api-client";
import { AuthUser } from "../../store/useAuthStore";
import ReportGenerator from "../dashboard/ReportGenerator";

interface CaseActionBarProps {
  caseData: Case;
  onUpdateStatus: (id: string, status: Case["status"]) => void;
}

export default function CaseActionBar({ caseData, onUpdateStatus }: CaseActionBarProps) {
  const { addToast } = useUIStore();
  const { assignCase } = useCaseStore();
  
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeStatement, setCloseStatement] = useState("");
  const { addCaseNote } = useCaseStore();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const transferDropdownRef = useRef<HTMLDivElement>(null);

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

  const handleTransferClick = async () => {
    setIsTransferOpen(!isTransferOpen);
    if (!isTransferOpen && users.length === 0) {
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

  const handleTransfer = async (userId: string, userName: string) => {
    setIsTransferOpen(false);
    try {
      await assignCase(caseData.id, userId, userName);
      addToast("Case transferred successfully", "success");
    } catch (err) {
      addToast("Failed to transfer case", "error");
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAssignOpen(false);
      }
      if (transferDropdownRef.current && !transferDropdownRef.current.contains(event.target as Node)) {
        setIsTransferOpen(false);
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

        <div className="relative" ref={transferDropdownRef}>
          <button
            onClick={handleTransferClick}
            className="px-2.5 py-1.5 bg-surface-container-low hover:bg-surface-container-highest border border-outline-variant/30 rounded-lg text-[10px] font-bold text-on-surface flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <ArrowRightLeft size={12} className="text-on-surface-variant" /> Transfer <ChevronDown size={10} className="text-on-surface-variant" />
          </button>
          
          {isTransferOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-surface-container rounded-lg border border-outline-variant/30 shadow-lg overflow-hidden z-50">
              <div className="p-2 border-b border-outline-variant/30 bg-surface-container-low">
                <h4 className="text-xs font-semibold text-on-surface">Transfer Case</h4>
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
                        onClick={() => handleTransfer(user.id, `${user.first_name} ${user.last_name}`)}
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
          onClick={() => setIsReportModalOpen(true)}
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
            onClick={() => setIsCloseModalOpen(true)}
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

      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container border border-outline-variant/30 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-outline-variant/20 bg-surface-container-high/50">
              <h3 className="font-bold text-on-surface">Mandatory Case Report</h3>
              <p className="text-xs text-on-surface-variant mt-1">Please provide a final statement or resolution report before closing this case.</p>
            </div>
            <div className="p-4">
              <textarea 
                value={closeStatement}
                onChange={(e) => setCloseStatement(e.target.value)}
                placeholder="Enter final statement/report here..."
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 text-sm text-on-surface focus:outline-none focus:border-primary min-h-[100px] resize-y"
              />
            </div>
            <div className="p-4 border-t border-outline-variant/20 bg-surface-container-high/30 flex justify-end gap-2">
              <button 
                onClick={() => { setIsCloseModalOpen(false); setCloseStatement(""); }}
                className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (closeStatement.trim().length < 10) {
                    addToast("Statement must be at least 10 characters", "error");
                    return;
                  }
                  setIsCloseModalOpen(false);
                  try {
                    await addCaseNote(caseData.id, `Final Resolution Report:\n${closeStatement}`);
                    onUpdateStatus(caseData.id, "CLOSED");
                    addToast("Case closed and report saved", "success");
                    setCloseStatement("");
                  } catch (err) {
                    addToast("Failed to close case", "error");
                  }
                }}
                disabled={closeStatement.trim().length < 10}
                className="px-4 py-2 text-xs font-bold bg-primary text-on-primary hover:bg-primary-fixed rounded-lg transition-colors disabled:opacity-50"
              >
                Submit & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md">
            <button 
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-2 right-2 text-outline-variant hover:text-on-surface transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <ReportGenerator accountId={caseData.muleNodes?.[0] || caseData.id} caseId={caseData.id} />
          </div>
        </div>
      )}
    </div>
  );
}
