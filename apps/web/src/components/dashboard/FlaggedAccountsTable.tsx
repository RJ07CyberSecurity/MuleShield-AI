"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowUpDown, ChevronRight, Activity, HelpCircle, RefreshCw } from "lucide-react";
import { apiClient } from "../../services/api-client";
import { useUIStore } from "../../store/useUIStore";

interface Factor {
  rule: string;
  reason: string;
  weight: number;
}

interface FlaggedAccount {
  account_id: string;
  account_number: string;
  risk_score: number;
  severity: string;
  factors: Factor[];
  balance: number;
  currency: string;
  status: string;
}

interface FlaggedAccountsTableProps {
  ingestionId: string | null;
}

export default function FlaggedAccountsTable({ ingestionId }: FlaggedAccountsTableProps) {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<FlaggedAccount[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  useEffect(() => {
    const fetchFlagged = async () => {
      setLoading(true);
      try {
        const url = ingestionId
          ? `/api/v1/detection/flagged?ingestion_id=${ingestionId}`
          : "/api/v1/detection/flagged";
          
        const response = await apiClient.get<any>(url);
        if (response.success) {
          setAccounts(response.data);
        } else {
          addToast(response.message || "Failed to load flagged accounts.", "error");
        }
      } catch (err: any) {
        addToast(err.message || "Error fetching flagged accounts list.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchFlagged();
  }, [ingestionId, sortOrder, addToast]);

  const toggleSort = () => {
    const order = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(order);
    setAccounts((prev) =>
      [...prev].sort((a, b) =>
        order === "asc" ? a.risk_score - b.risk_score : b.risk_score - a.risk_score
      )
    );
  };

  const filteredAccounts = accounts.filter((acct) => {
    const matchesSearch = acct.account_number.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === "ALL" || acct.severity.toUpperCase() === severityFilter.toUpperCase();
    return matchesSearch && matchesSeverity;
  });

  if (loading) {
    return (
      <div className="p-10 bg-surface-container-low border border-outline-variant/30 rounded-3xl flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-3 text-on-surface-variant text-sm">
          <RefreshCw className="animate-spin text-primary" size={18} />
          Compiling suspicious transactions and threat scores...
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="p-10 bg-surface-container-low border border-outline-variant/30 rounded-3xl flex flex-col items-center justify-center text-on-surface-variant min-h-[300px] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center text-on-surface-variant/40">
          <Activity size={24} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-on-surface">No Mule Anomalies Flagged</p>
          <p className="text-xs max-w-sm">
            All accounts in this batch have cleared the lightweight score criteria. No active alerts triggered.
          </p>
        </div>
      </div>
    );
  }

  const getSeverityBadge = (severity: string) => {
    const styles = {
      CRITICAL: "bg-risk-critical/15 border-risk-critical/30 text-risk-critical",
      HIGH: "bg-risk-high/10 border-risk-high/30 text-risk-high",
      MEDIUM: "bg-risk-medium/10 border-risk-medium/20 text-risk-medium",
      LOW: "bg-risk-low/10 border-risk-low/20 text-risk-low",
    };
    return styles[severity.toUpperCase() as keyof typeof styles] || "bg-surface-container-high border-outline-variant/20 text-on-surface";
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl overflow-hidden shadow-lg text-left space-y-4">
      {/* Table Header */}
      <div className="p-6 pb-2 flex items-center justify-between border-b border-outline-variant/20">
        <div>
          <h3 className="text-lg font-black text-on-surface flex items-center gap-2">
            <ShieldAlert className="text-primary" size={20} />
            Suspicious Mule Accounts Registry
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Accounts flagged by compliance filters, ranked by explainable machine heuristics threat risk scores.
          </p>
        </div>
        
        <button
          onClick={toggleSort}
          className="px-3.5 py-2 bg-surface-container-high border border-outline-variant/20 rounded-xl text-xs font-semibold hover:bg-surface-container-highest text-on-surface flex items-center gap-2 transition-colors"
        >
          Sort by Score
          <ArrowUpDown size={14} />
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="px-6 py-2 flex flex-wrap items-center gap-3 border-b border-outline-variant/15 bg-surface-container-high/10">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search account number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 bg-surface-container-high text-xs text-on-surface border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/50"
          />
        </div>
        <div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3.5 py-2 bg-surface-container-high text-xs text-on-surface border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary cursor-pointer transition-colors"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/20 bg-surface-container-low text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider font-bold">
              <th className="p-4 text-left">Account Number</th>
              <th className="p-4 text-center">Threat Severity</th>
              <th className="p-4 text-center" onClick={toggleSort}>
                <span className="flex items-center justify-center gap-1 cursor-pointer hover:text-on-surface">
                  Risk Score
                  <ArrowUpDown size={12} />
                </span>
              </th>
              <th className="p-4 text-left">Trigger Factor details</th>
              <th className="p-4 text-right">Ledger Balance</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((acct) => (
              <tr
                key={acct.account_id}
                className="border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors text-xs text-on-surface align-middle"
              >
                {/* Account Number */}
                <td className="p-4 font-label-mono font-bold">
                  <Link
                    href={`/cases/${acct.account_id}`}
                    className="text-primary hover:underline hover:text-primary-fixed"
                  >
                    {acct.account_number}
                  </Link>
                </td>

                {/* Severity badge */}
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-0.5 border text-[10px] font-bold font-label-mono rounded-full uppercase tracking-wider ${getSeverityBadge(acct.severity)}`}>
                    {acct.severity}
                  </span>
                </td>

                {/* Score gauge */}
                <td className="p-4 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <span className="font-extrabold font-label-mono text-sm leading-none">
                      {acct.risk_score}
                    </span>
                    <span className="text-[8px] text-on-surface-variant font-label-mono mt-0.5">/100</span>
                  </div>
                </td>

                {/* Flag factors */}
                <td className="p-4 max-w-sm">
                  <div className="space-y-1">
                    {acct.factors.map((factor, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        <div className="text-[10px] text-on-surface-variant leading-tight">
                          <span className="font-bold text-on-surface mr-1">
                            [{factor.rule.replace("R1_", "").replace("R2_", "").replace("R3_", "").replace("R4_", "")}]
                          </span>
                          {factor.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </td>

                {/* Balance */}
                <td className="p-4 text-right font-bold font-label-mono text-primary">
                  ${acct.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-[9px] font-normal text-on-surface-variant ml-1 font-label-mono uppercase">
                    {acct.currency}
                  </span>
                </td>

                {/* Actions click-through */}
                <td className="p-4 text-center">
                  <Link
                    href={`/cases/${acct.account_id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 rounded-xl text-[10px] font-bold text-on-surface transition-colors"
                  >
                    Open Dossier
                    <ChevronRight size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
