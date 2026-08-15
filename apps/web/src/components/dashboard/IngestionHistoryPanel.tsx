"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, FileText, ChevronRight, Clock, Database, ChevronDown, ChevronUp, Trash2, Lock, ShieldCheck } from "lucide-react";
import { formatCurrency } from "../../utils/currency";
import { apiClient } from "../../services/api-client";
import { useAuthStore } from "../../store/useAuthStore";

interface IngestionItem {
  ingestion_id: string;
  transaction_count: number;
  total_volume: number;
  currency?: string;
  status: string;
  uploaded_at: string;
  duplicate_upload_count?: number;
  last_attempted_upload_at?: string;
  is_deleted?: boolean;
}

interface IngestionHistoryPanelProps {
  /** Currently active ingestion id (highlighted row) */
  activeIngestionId: string | null;
  onSelect: (ingestionId: string) => void;
}

export default function IngestionHistoryPanel({ activeIngestionId, onSelect }: IngestionHistoryPanelProps) {
  const { user } = useAuthStore();
  const [items, setItems] = useState<IngestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [userIsolated, setUserIsolated] = useState(true);

  const fetchList = async () => {
    setLoading(true);
    try {
      const uploaderParam = user?.id ? `uploader_id=${user.id}` : "";
      const isolatedParam = userIsolated ? "isolated_only=true" : "isolated_only=false";
      const queryStr = [uploaderParam, isolatedParam].filter(Boolean).join("&");
      const res = await apiClient.get<any>(`/api/v1/ingestion/list${queryStr ? `?${queryStr}` : ""}`);
      if (res && res.success && Array.isArray(res.data)) {
        setItems(res.data);
        if (res.data.length > 0 && !activeIngestionId) {
          onSelect(res.data[0].ingestion_id);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ingestionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this statement from history? (Transactions and audit logs will be preserved for compliance audits.)")) return;
    
    try {
      const res = await apiClient.delete<any>(`/api/v1/ingestion/${ingestionId}`);
      if (res.success) {
        if (activeIngestionId === ingestionId) {
          onSelect(""); // Clear selection if the active one was soft deleted
        }
        await fetchList();
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchList();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIngestionId, userIsolated]);

  if (loading) {
    return (
      <div className="p-5 bg-surface-container-low border border-outline-variant/30 rounded-2xl flex items-center gap-3 text-xs text-on-surface-variant">
        <RefreshCw size={14} className="animate-spin text-primary" />
        Loading statement ingestion history...
        <button
          onClick={fetchList}
          className="ml-auto text-primary hover:underline font-bold text-[10px]"
        >
          Refresh
        </button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="p-5 bg-surface-container-low border border-outline-variant/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 text-xs text-on-surface-variant flex-1">
          <Database size={14} className="text-on-surface-variant/50 flex-shrink-0" />
          No statements have been uploaded yet in this user data isolation scope. Use{" "}
          <strong className="text-primary">Upload Statement</strong> to begin ingesting bank records.
        </div>
        <div className="flex items-center gap-2">
          {userIsolated && (
            <button
              onClick={() => setUserIsolated(false)}
              className="px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/10 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors"
            >
              Show System Records
            </button>
          )}
          <button
            onClick={fetchList}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-high hover:bg-surface-container-highest text-[10px] font-bold text-on-surface-variant hover:text-primary transition-colors flex-shrink-0"
          >
            <RefreshCw size={10} />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl overflow-hidden shadow-md">
      {/* Header */}
      <div
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/20 hover:bg-surface-container-high/30 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <FileText size={14} className="text-primary" />
          <span className="text-[10px] font-label-mono font-bold uppercase tracking-wider text-on-surface">
            Statement Ingestion History
          </span>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary font-label-mono">
            {items.length}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setUserIsolated(!userIsolated);
            }}
            className={`inline-flex items-center gap-1 text-[9px] font-bold font-label-mono px-2.5 py-0.5 rounded-full border transition-all ${
              userIsolated
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
                : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
            }`}
            title="Click to toggle user data isolation mode for confidential bank statement records"
          >
            <Lock size={10} />
            {userIsolated ? "USER DATA ISOLATED (CONFIDENTIAL)" : "SYSTEM AUDIT MODE"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); fetchList(); }}
            className="p-1 hover:bg-surface-container-high rounded transition-colors text-on-surface-variant hover:text-primary"
            title="Refresh list"
          >
            <RefreshCw size={12} />
          </button>
          {collapsed ? <ChevronDown size={14} className="text-on-surface-variant" /> : <ChevronUp size={14} className="text-on-surface-variant" />}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto scrollbar-thin divide-y divide-outline-variant/10">
              {items.map((item) => {
                const isActive = item.ingestion_id === activeIngestionId;
                const date = item.uploaded_at
                  ? new Date(item.uploaded_at).toLocaleString(undefined, {
                      month: "short", day: "numeric", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })
                  : "Unknown";

                return (
                  <div
                    key={item.ingestion_id}
                    onClick={() => onSelect(item.ingestion_id)}
                    className={`w-full flex items-center justify-between px-5 py-3 text-left cursor-pointer transition-all hover:bg-surface-container-high/40 group ${
                      isActive ? "bg-primary/5 border-l-2 border-primary" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? "bg-primary/15 text-primary" : "bg-surface-container-highest text-on-surface-variant"}`}>
                        <FileText size={13} />
                      </div>
                      <div className="space-y-0.5">
                        <p className={`text-[10px] font-bold font-label-mono ${isActive ? "text-primary" : "text-on-surface"}`}>
                          {item.ingestion_id.substring(0, 8).toUpperCase()}…
                        </p>
                        <div className="flex items-center gap-2 text-[9px] font-label-mono text-on-surface-variant">
                          <Clock size={9} />
                          {date}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-[9px] font-label-mono text-on-surface-variant uppercase">Transactions</p>
                        <p className="text-xs font-black text-on-surface font-label-mono">{item.transaction_count.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-label-mono text-on-surface-variant uppercase">Volume</p>
                        <p className="text-sm font-black text-primary font-label-mono leading-none">
                          {formatCurrency(item.total_volume, item.currency || "USD")}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded border text-[8px] font-bold font-label-mono uppercase bg-emerald-500/10 border-emerald-500/30 text-emerald-400 flex items-center gap-1" title="Confidential statement data isolated per tenant user context">
                        <Lock size={8} />
                        Isolated
                      </span>
                      <span className={`px-2 py-0.5 rounded border text-[8px] font-bold font-label-mono uppercase ${
                        item.status === "CONFIRMED"
                          ? "bg-risk-low/10 border-risk-low/30 text-risk-low"
                          : "bg-risk-medium/10 border-risk-medium/30 text-risk-medium"
                      }`}>
                        {item.status}
                      </span>
                      {item.duplicate_upload_count != null && item.duplicate_upload_count > 0 && (
                        <span className="px-2 py-0.5 rounded border text-[8px] font-bold font-label-mono uppercase bg-primary/10 border-primary/30 text-primary" title={`Re-attempted ${item.duplicate_upload_count} time(s)`}>
                          {item.duplicate_upload_count} Dup{item.duplicate_upload_count > 1 ? "s" : ""}
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDelete(item.ingestion_id, e)}
                        className="p-1.5 ml-2 hover:bg-risk-high/20 rounded text-on-surface-variant hover:text-risk-high transition-colors"
                        title="Delete uploaded statement"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={12} className={`text-on-surface-variant group-hover:text-primary transition-colors ${isActive ? "text-primary" : ""}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
