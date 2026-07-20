"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, ShieldAlert, DollarSign, Calendar, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react";
import { apiClient } from "../../services/api-client";
import { useUIStore } from "../../store/useUIStore";

interface SummaryData {
  ingestion_id: string;
  total_accounts: int;
  total_transactions: int;
  total_volume: float;
  start_date: string;
  end_date: string;
  flagged_accounts_count: int;
}

interface IngestionSummaryCardProps {
  ingestionId: string;
  onViewFlagged: (ingestionId: string) => void;
}

export default function IngestionSummaryCard({ ingestionId, onViewFlagged }: IngestionSummaryCardProps) {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SummaryData | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<any>(`/api/v1/ingestion/${ingestionId}/summary`);
        if (response.success) {
          setData(response.data);
        } else {
          addToast(response.message || "Failed to load summary stats.", "error");
        }
      } catch (err: any) {
        addToast(err.message || "Failed to query summary API.", "error");
      } finally {
        setLoading(false);
      }
    };

    if (ingestionId) {
      fetchSummary();
    }
  }, [ingestionId, addToast]);

  if (loading) {
    return (
      <div className="p-6 bg-surface-container-low border border-outline-variant/30 rounded-2xl flex items-center justify-center min-h-[140px]">
        <div className="flex items-center gap-3 text-on-surface-variant text-xs">
          <RefreshCw className="animate-spin text-primary" size={16} />
          Loading Ingestion Summary Statistics...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 bg-surface-container-low border border-outline-variant/30 rounded-2xl flex flex-col items-center justify-center text-on-surface-variant text-xs min-h-[140px] gap-2">
        <AlertTriangle className="text-risk-high" size={20} />
        Failed to compile summary for ingestion batch {ingestionId.substring(0, 8)}.
      </div>
    );
  }

  const startFormatted = new Date(data.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const endFormatted = new Date(data.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-surface-container-low border border-outline-variant/30 rounded-3xl text-left space-y-6 relative overflow-hidden shadow-xl"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/2 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider font-bold">Statement Ingest Influx</span>
          <h3 className="text-base font-black text-on-surface mt-0.5">Ingestion Batch Summary</h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full border border-outline-variant/30 bg-surface-container-high font-label-mono text-[9px] font-bold text-on-surface">
          ID: {data.ingestion_id.substring(0, 8)}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total volume */}
        <div className="p-4 bg-surface-container-highest border border-outline-variant/20 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <DollarSign size={18} />
          </div>
          <div>
            <span className="text-[8px] font-label-mono text-on-surface-variant uppercase tracking-wider block font-bold">Total Volume</span>
            <span className="text-base font-black text-on-surface font-label-mono leading-none">
              ${data.total_volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-on-surface-variant font-label-mono">{data.total_transactions} txs</span>
          </div>
        </div>

        {/* Total Accounts */}
        <div className="p-4 bg-surface-container-highest border border-outline-variant/20 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/15 border border-secondary/20 flex items-center justify-center text-secondary-fixed flex-shrink-0">
            <Activity size={18} />
          </div>
          <div>
            <span className="text-[8px] font-label-mono text-on-surface-variant uppercase tracking-wider block font-bold">Unique Nodes</span>
            <span className="text-base font-black text-on-surface font-label-mono leading-none">
              {data.total_accounts}
            </span>
            <span className="text-[9px] text-on-surface-variant block font-label-mono">Account endpoints</span>
          </div>
        </div>

        {/* Date Range */}
        <div className="p-4 bg-surface-container-highest border border-outline-variant/20 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-outline-variant/10 flex items-center justify-center text-on-surface-variant flex-shrink-0">
            <Calendar size={18} />
          </div>
          <div>
            <span className="text-[8px] font-label-mono text-on-surface-variant uppercase tracking-wider block font-bold">Chronology Span</span>
            <span className="text-[10px] font-black text-on-surface font-label-mono leading-tight block">
              {startFormatted}
            </span>
            <span className="text-[8px] text-on-surface-variant block font-label-mono">to {endFormatted}</span>
          </div>
        </div>

        {/* Mules Flagged Alert */}
        <div className={`p-4 border rounded-2xl flex items-center gap-3 transition-colors ${data.flagged_accounts_count > 0
            ? "bg-risk-critical/10 border-risk-critical/30 text-risk-critical"
            : "bg-surface-container-highest border-outline-variant/20 text-on-surface-variant"
          }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${data.flagged_accounts_count > 0
              ? "bg-risk-critical/15 text-risk-critical"
              : "bg-surface-container-low text-on-surface-variant"
            }`}>
            <ShieldAlert size={18} className={data.flagged_accounts_count > 0 ? "animate-pulse" : ""} />
          </div>
          <div>
            <span className="text-[8px] font-label-mono uppercase tracking-wider block font-bold">Flagged Mules</span>
            <span className={`text-base font-black font-label-mono leading-none block ${data.flagged_accounts_count > 0 ? "text-risk-critical font-extrabold" : "text-on-surface"
              }`}>
              {data.flagged_accounts_count}
            </span>
            <span className="text-[9px] block font-label-mono">Flagged anomalies</span>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-outline-variant/10">
        <p className="text-[10px] text-on-surface-variant flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-risk-low animate-ping" />
          Ingested ledger transaction indices successfully updated in local SQLite registry.
        </p>

        <button
          onClick={() => onViewFlagged(data.ingestion_id)}
          className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary-fixed text-on-primary text-xs font-bold rounded-xl shadow-md hover:scale-102 transition-all flex items-center justify-center gap-2 group"
        >
          View Flagged Mule Accounts
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}
