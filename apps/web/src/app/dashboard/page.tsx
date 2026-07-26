"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useUIStore } from "../../store/useUIStore";
import { AnimatePresence, motion } from "framer-motion";
import AccountDataUploader from "../../components/dashboard/AccountDataUploader";
import IngestionSummaryCard from "../../components/dashboard/IngestionSummaryCard";
import FlaggedAccountsTable from "../../components/dashboard/FlaggedAccountsTable";
import IngestionHistoryPanel from "../../components/dashboard/IngestionHistoryPanel";
import { apiClient } from "../../services/api-client";

export default function DashboardPage() {
  const { addToast, globalIngestionId, setGlobalIngestionId } = useUIStore();
  const [timeRange, setTimeRange] = useState("24H");
  const [freezeExecuted, setFreezeExecuted] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  const handleSetActiveIngestionId = (id: string | null) => {
    setGlobalIngestionId(id);
  };
  const [filterIngestionId, setFilterIngestionId] = useState<string | null>(globalIngestionId);
  const [previewIngestionId, setPreviewIngestionId] = useState<string | null>(null);

  const [statsLoading, setStatsLoading] = useState(true);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [liveTransactions, setLiveTransactions] = useState<any[]>([]);
  const [kpiStats, setKpiStats] = useState<any | null>(null);

  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  // Fetch real dashboard data — re-runs when a statement is selected
  const loadDashboard = async (ingestionId: string | null = null) => {
    setStatsLoading(true);
    try {
      const idParam = ingestionId ? `?ingestion_id=${ingestionId}` : "";
      const timelineParams = ingestionId ? `?ingestion_id=${ingestionId}&time_range=${timeRange}` : `?time_range=${timeRange}`;
      const [statsRes, timelineRes, txRes] = await Promise.allSettled([
        apiClient.get<any>(`/api/v1/dashboard/stats${idParam}`, { cache: "no-store" }),
        apiClient.get<any>(`/api/v1/dashboard/timeline${timelineParams}`, { cache: "no-store" }),
        apiClient.get<any>(`/api/v1/dashboard/critical-alerts${idParam}`, { cache: "no-store" }),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.data) {
        setKpiStats(statsRes.value.data);
      }
      if (timelineRes.status === "fulfilled" && Array.isArray(timelineRes.value?.data)) {
        setTimelineData(timelineRes.value.data);
      }
      if (txRes.status === "fulfilled" && Array.isArray(txRes.value?.data)) {
        setLiveTransactions(txRes.value.data);
        // Default to the highest risk transaction when new data loads
        if (txRes.value.data.length > 0) {
          const top = [...txRes.value.data].sort((a, b) => parseInt(b.score) - parseInt(a.score))[0];
          setSelectedTransactionId(top.id);
        } else {
          setSelectedTransactionId(null);
        }
      }
    } catch {
      // silently use fallback data
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(filterIngestionId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterIngestionId, timeRange]);

  const isFiltered = !!filterIngestionId;

  const stats = [
    {
      title: isFiltered ? "UNIQUE ACCOUNTS" : "TOTAL ACCOUNTS",
      value: statsLoading || !kpiStats ? "..." : kpiStats.total_accounts,
      change: isFiltered ? "In this statement" : "+12.4% vs last mo",
      isPositive: true,
      icon: "group",
      color: "text-primary bg-primary/10 border-primary/20",
      tooltip: isFiltered
        ? "Unique account endpoints involved in this statement batch."
        : "Total registered banking accounts indexed across compliance ledgers."
    },
    {
      title: isFiltered ? "FLAGGED MULES" : "CRITICAL ALERTS",
      value: statsLoading || !kpiStats ? "..." : kpiStats.critical_alerts,
      change: isFiltered ? "From this batch" : "High priority surge",
      isPositive: false,
      icon: "error",
      color: "text-risk-high bg-risk-high/10 border-risk-high/20",
      tooltip: isFiltered
        ? "Accounts flagged by the detection engine in this statement batch."
        : "Alerts exceeding threat score 90 requiring immediate remediation."
    },
    {
      title: isFiltered ? "STATEMENT VOLUME" : "MONEY LAUNDERED (EST)",
      value: statsLoading || !kpiStats ? "..." : kpiStats.suspected_laundered_volume,
      change: isFiltered ? "Confirmed transactions" : "AI cluster estimate",
      isPositive: true,
      icon: "payments",
      color: "text-risk-medium bg-risk-medium/10 border-risk-medium/20",
      tooltip: isFiltered
        ? "Total confirmed transaction volume in this ingested statement."
        : "Aggregated transaction volume flagged in suspicious loop configurations."
    },
    {
      title: "AI ACCURACY",
      value: statsLoading || !kpiStats ? "..." : kpiStats.ai_accuracy,
      change: "Verified last 500 cases",
      isPositive: true,
      icon: "auto_awesome",
      color: "text-risk-low bg-risk-low/10 border-risk-low/20",
      tooltip: "Ratio of true positive model predictions verified by forensic audits."
    },
  ];

  const transactions = liveTransactions;

  const handleExecuteFreeze = () => {
    setFreezeExecuted(true);
    addToast("DOWNSTREAM ACTION ENFORCED: Hold placed on assets of ACC-72948-X.", "info");
    setTimeout(() => setFreezeExecuted(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-outline-variant/10 text-left">
        <div>
          <h1 className="font-display-kpi text-3xl font-extrabold text-on-surface tracking-tight">
            Compliance Command Center
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Real-time transaction surveillance and suspicious financial activity auditing dashboard.
          </p>
        </div>
        <div className="flex gap-2">
          {filterIngestionId && (
            <button
              onClick={() => {
                setFilterIngestionId(null);
                setPreviewIngestionId(null);
                handleSetActiveIngestionId(null);
              }}
              className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 rounded-xl text-xs font-semibold text-on-surface transition-colors"
            >
              Clear Filter
            </button>
          )}
          <button
            onClick={() => setShowUploader(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-fixed text-on-primary text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 hover:scale-[1.01]"
          >
            <span className="material-symbols-outlined text-xs">upload_file</span>
            Upload Statement
          </button>
        </div>
      </div>

      <IngestionHistoryPanel
        activeIngestionId={previewIngestionId}
        onSelect={(id) => {
          setPreviewIngestionId(id);
          setFilterIngestionId(id);
          handleSetActiveIngestionId(id);
        }}
      />

      {/* Ingestion summary stats card — shows when a statement is selected in history */}
      {previewIngestionId && (
        <IngestionSummaryCard
          ingestionId={previewIngestionId}
          onViewFlagged={(id) => {
            setFilterIngestionId(id);
            handleSetActiveIngestionId(id);
            addToast("Filtering dashboard tables to the current statement ingestion run.", "info");
            setTimeout(() => {
              document.getElementById("flagged-table-section")?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }}
        />
      )}

      {/* 1. Top KPI Stats Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex items-center justify-between group relative hover:border-primary/20 transition-all select-none"
          >
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-1.5 text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
                {stat.title}
                <span className="material-symbols-outlined text-xs cursor-help opacity-40 hover:opacity-100 transition-opacity" title={stat.tooltip}>
                  info
                </span>
              </div>
              <div className="text-3xl font-extrabold text-on-surface leading-tight font-display-kpi">
                {stat.value}
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`text-[10px] font-semibold flex items-center gap-1 ${
                    stat.isPositive ? "text-risk-low" : "text-risk-high"
                  }`}
                >
                  {stat.isPositive ? (
                    <span className="material-symbols-outlined text-xs">trending_up</span>
                  ) : (
                    <span className="material-symbols-outlined text-xs">warning</span>
                  )}
                  {stat.change}
                </div>
                <span className="text-[9px] text-on-surface-variant/50">• Just updated</span>
              </div>
            </div>
            <span
              className={`material-symbols-outlined w-12 h-12 rounded-xl flex items-center justify-center border text-2xl group-hover:scale-105 transition-transform ${stat.color}`}
            >
              {stat.icon}
            </span>
          </div>
        ))}
      </section>

      {/* 2. Middle Row (Velocity Timeline & Geo-Risk Heatmap) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction Velocity Timeline */}
        <section className="lg:col-span-2 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex flex-col justify-between text-left">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider">
                Transaction Velocity Timeline
              </h3>
              <p className="text-[10px] text-on-surface-variant">Real-time model score aggregation index</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/20">
                {["24H", "7D", "30D"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-[10px] font-label-mono uppercase tracking-wider rounded transition-all ${
                      timeRange === range
                        ? "bg-primary text-on-primary font-bold"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <button
                onClick={() => addToast("Report compiled. Graphic downloaded.", "success")}
                className="material-symbols-outlined text-on-surface-variant hover:text-on-surface p-1.5 border border-outline-variant/20 rounded hover:bg-surface-container-high transition-colors"
                title="Download Graph Data"
              >
                download
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="time"
                  stroke="#8d90a0"
                  tickLine={false}
                  axisLine={false}
                  style={{ fontSize: "9px", fontFamily: "JetBrains Mono" }}
                />
                <YAxis
                  stroke="#8d90a0"
                  tickLine={false}
                  axisLine={false}
                  style={{ fontSize: "9px", fontFamily: "JetBrains Mono" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(67, 70, 85, 0.1)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 bg-surface-container-high border border-outline-variant/30 rounded-xl shadow-2xl text-[11px] font-label-mono text-left">
                          <p className="text-on-surface-variant uppercase">Time slot: {payload[0].payload.time}</p>
                          <p className="font-bold text-primary mt-1">Velocity: {payload[0].value} operations</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {timelineData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.time === "06:00" ? "#F97316" : "#2a2d3d"} // Highlight anomaly peak bar in orange
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Geo-Risk Heatmap */}
        <section className="lg:col-span-1 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex flex-col justify-between text-left">
          <div>
            <h3 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider">
              Geo-Risk Heatmap
            </h3>
            <p className="text-[10px] text-on-surface-variant">Live login geolocation tracing</p>
          </div>

          {/* Interactive Scanning Map Visual */}
          <div className="relative w-full aspect-[16/9] border border-outline-variant/20 rounded-xl overflow-hidden bg-[#07090e] my-4 flex items-center justify-center">
            {/* Map Placeholder Graphic */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#434655_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <span className="material-symbols-outlined text-primary text-5xl absolute animate-ping duration-[3000ms] opacity-35">
              public
            </span>
            <span className="material-symbols-outlined text-primary text-5xl z-10">public</span>
            <div className="absolute bottom-4 left-4 z-10 px-2.5 py-1 bg-risk-high/15 border border-risk-high/30 rounded-lg flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-risk-high"></span>
              <span className="text-[9px] font-label-mono text-risk-high uppercase font-semibold tracking-wider">
                Active Scanning
              </span>
            </div>
          </div>

          {/* Cluster Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-label-mono uppercase tracking-wider">
              <span className="text-on-surface">{isFiltered ? "Active Batch Scan" : "Global Network"}</span>
              <span className={`font-bold ${transactions.length > 0 ? "text-risk-critical" : "text-risk-low"}`}>
                {transactions.length > 0 ? "High Activity" : "Monitoring"}
              </span>
            </div>
            <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden w-full">
              <div className={`${transactions.length > 0 ? "bg-risk-critical" : "bg-risk-low"} h-full rounded-full`} style={{ width: transactions.length > 0 ? "92%" : "25%" }} />
            </div>
          </div>
        </section>
      </div>

      {/* 3. Bottom Row (Live Ingress Stream & AI Recommendation) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Intelligence Stream */}
        <section className="lg:col-span-2 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex flex-col justify-between text-left">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider">
                  Live Intelligence Stream
                </h3>
                <p className="text-[10px] text-on-surface-variant">Real-time incoming transaction ledger checks</p>
              </div>
              <button
                onClick={() => addToast("Advanced log filters toggled", "info")}
                className="px-3.5 py-1.5 border border-outline-variant/30 hover:border-primary/50 bg-[#07090e] rounded-xl text-caption font-label-mono uppercase tracking-wider text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-xs">filter_list</span>
                Filter
              </button>
            </div>

            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse table-fixed min-w-[500px]">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest bg-surface-container-high/20">
                    <th className="px-4 py-3 w-32">Entity ID</th>
                    <th className="px-4 py-3">Transaction Type</th>
                    <th className="px-4 py-3 w-36">Amount</th>
                    <th className="px-4 py-3 text-center w-24">Risk Score</th>
                    <th className="px-4 py-3 text-right w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {statsLoading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={`sk-${i}`} className="animate-pulse">
                        <td className="px-4 py-4 w-32">
                          <div className="h-3 bg-surface-container-high rounded w-20 mb-1.5"></div>
                          <div className="h-2 bg-surface-container-high rounded w-16"></div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-3 bg-surface-container-high rounded w-28"></div>
                        </td>
                        <td className="px-4 py-4 w-36">
                          <div className="h-3 bg-surface-container-high rounded w-16"></div>
                        </td>
                        <td className="px-4 py-4 w-24">
                          <div className="h-5 bg-surface-container-high rounded w-12 mx-auto"></div>
                        </td>
                        <td className="px-4 py-4 text-right w-28">
                          <div className="h-3 bg-surface-container-high rounded w-16 ml-auto"></div>
                        </td>
                      </tr>
                    ))
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-on-surface-variant text-xs">
                        No transactions detected in this statement run.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setSelectedTransactionId(tx.id)}
                        className={`text-body-sm transition-colors cursor-pointer ${
                          selectedTransactionId === tx.id
                            ? "bg-primary/10 border-l-2 border-primary"
                            : "hover:bg-surface-container-high/30"
                        }`}
                      >
                        <td className="px-4 py-3 font-semibold text-on-surface font-label-mono truncate">
                          <div>{tx.id}</div>
                          <div className="text-[10px] text-on-surface-variant font-normal tracking-tight truncate">{tx.entity_name || "Unknown Entity"}</div>
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant truncate">{tx.type}</td>
                        <td className="px-4 py-3 font-bold text-on-surface truncate">{tx.amount}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <span
                              className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                                tx.riskLevel === "critical"
                                  ? "text-risk-critical border-risk-critical/30 bg-risk-critical/10"
                                  : tx.riskLevel === "high"
                                  ? "text-risk-high border-risk-high/30 bg-risk-high/10"
                                  : "text-risk-medium border-risk-medium/30 bg-risk-medium/10"
                              }`}
                            >
                              {tx.score}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right truncate">
                          <div className="flex items-center justify-end gap-3">
                            <span className="inline-flex items-center gap-1.5 text-xs text-on-surface">
                              {tx.status === "Investigating" && (
                                <span className="w-1.5 h-1.5 rounded-full bg-risk-critical animate-pulse"></span>
                              )}
                              {tx.status}
                            </span>
                            {tx.status === "Investigating" && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  
                                  const { useCaseStore } = require("../../store/useCaseStore");
                                  await useCaseStore.getState().createCase({
                                    title: `Investigation: ${tx.id}`,
                                    description: `Suspicious transaction of type ${tx.type} detected with a risk score of ${tx.score}.`,
                                    customerName: tx.id,
                                    priority: tx.riskLevel === "critical" ? "CRITICAL" : tx.riskLevel === "high" ? "HIGH" : "MEDIUM",
                                    riskScore: parseInt(tx.score.split("/")[0], 10) || 75
                                  });
                                  
                                  window.location.href = "/cases";
                                }}
                                className="px-2 py-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-on-primary rounded text-[10px] font-bold transition-all"
                              >
                                Escalate Case
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-outline-variant/10">
                {statsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={`sk-m-${i}`} className="p-4 space-y-3 animate-pulse">
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-surface-container-high rounded w-32"></div>
                        <div className="h-5 bg-surface-container-high rounded w-12"></div>
                      </div>
                      <div className="h-3 bg-surface-container-high rounded w-24"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-surface-container-high rounded w-20"></div>
                        <div className="h-4 bg-surface-container-high rounded w-16"></div>
                      </div>
                    </div>
                  ))
                ) : transactions.length === 0 ? (
                  <div className="p-6 text-center text-on-surface-variant text-xs">
                    No transactions detected in this statement run.
                  </div>
                ) : (
                  transactions.map((tx, idx) => (
                    <div
                      key={`m-${idx}`}
                      onClick={() => setSelectedTransactionId(tx.id)}
                      className={`p-4 text-body-sm transition-colors cursor-pointer space-y-3 ${
                        selectedTransactionId === tx.id
                          ? "bg-primary/10 border-l-2 border-primary"
                          : "hover:bg-surface-container-high/30 border-l-2 border-transparent"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-semibold text-on-surface font-label-mono truncate">
                          {tx.id}
                          <div className="text-[10px] text-on-surface-variant font-normal tracking-tight truncate mt-0.5">
                            {tx.entity_name || "Unknown Entity"}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                            tx.riskLevel === "critical"
                              ? "text-risk-critical border-risk-critical/30 bg-risk-critical/10"
                              : tx.riskLevel === "high"
                              ? "text-risk-high border-risk-high/30 bg-risk-high/10"
                              : "text-risk-medium border-risk-medium/30 bg-risk-medium/10"
                          }`}
                        >
                          {tx.score}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-on-surface-variant text-xs">{tx.type}</div>
                        <div className="font-bold text-on-surface text-sm">{tx.amount}</div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10">
                        <span className="inline-flex items-center gap-1.5 text-xs text-on-surface">
                          {tx.status === "Investigating" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-risk-critical animate-pulse"></span>
                          )}
                          {tx.status}
                        </span>
                        {tx.status === "Investigating" && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const { useCaseStore } = require("../../store/useCaseStore");
                              await useCaseStore.getState().createCase({
                                title: `Investigation: ${tx.id}`,
                                description: `Suspicious transaction of type ${tx.type} detected with a risk score of ${tx.score}.`,
                                customerName: tx.id,
                                priority: tx.riskLevel === "critical" ? "CRITICAL" : tx.riskLevel === "high" ? "HIGH" : "MEDIUM",
                                riskScore: parseInt(tx.score.split("/")[0], 10) || 75
                              });
                              window.location.href = "/cases";
                            }}
                            className="px-2 py-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-on-primary rounded text-[10px] font-bold transition-all"
                          >
                            Escalate Case
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* AI Recommendation Sidebar & Suspicious Hops */}
        <section className="lg:col-span-1 space-y-6 text-left">
          {/* AI Recommendation Box */}
          {/* AI Recommendation Box */}
          {transactions.length > 0 && selectedTransactionId ? (() => {
            const topTx = transactions.find(t => t.id === selectedTransactionId) || transactions[0];
            const riskValue = parseInt(topTx.score) || 0;
            return (
              <div className="p-6 rounded-2xl border-2 border-risk-high/30 bg-surface-container-low space-y-6">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-risk-high text-3xl font-semibold">
                    smart_toy
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface uppercase tracking-wide">
                      AI Recommendation
                    </h4>
                    <p className="text-[10px] font-label-mono text-on-surface-variant uppercase mt-0.5">
                      Case {topTx.id}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-outline-variant/15">
                  <div className="flex justify-between items-center text-[10px] font-label-mono uppercase tracking-wider text-on-surface-variant">
                    <span>Risk Score</span>
                    <span className="font-bold text-risk-high">{topTx.score}</span>
                  </div>
                  <div className="h-2 bg-surface-container-high rounded-full overflow-hidden w-full">
                    <div className="bg-risk-high h-full rounded-full" style={{ width: `${riskValue}%` }} />
                  </div>
                </div>

                {/* Explanations List */}
                <div className="space-y-4 pt-2">
                  <div className="text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
                    Explainable AI Factors
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <span className="material-symbols-outlined text-risk-high text-base mt-0.5">bolt</span>
                      <div>
                        <h5 className="font-semibold text-xs text-on-surface">{topTx.type}</h5>
                        <p className="text-[10px] text-on-surface-variant">Detected anomaly pattern.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={handleExecuteFreeze}
                  disabled={freezeExecuted}
                  className="w-full py-3.5 rounded-xl bg-risk-critical text-white font-bold text-body-sm hover:bg-risk-critical/90 transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <span className="material-symbols-outlined text-base">emergency_home</span>
                  {freezeExecuted ? "Freeze Executed" : "Execute Freeze"}
                </button>
              </div>
            );
          })() : (
            <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low text-center flex flex-col items-center justify-center gap-3 h-full">
              <span className="material-symbols-outlined text-on-surface-variant text-4xl">check_circle</span>
              <div className="text-on-surface-variant text-sm font-semibold">No Critical Recommendations</div>
              <p className="text-[10px] text-on-surface-variant max-w-[200px]">Your systems are currently secure. No flagged entities require attention.</p>
            </div>
          )}

          {/* Suspicious Hops node diagram wrapper */}
          <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">
                Suspicious Hops
              </h4>
              <Link href="/explorer" className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-sm">
                open_in_new
              </Link>
            </div>

            {/* Visual Node Diagram simulation */}
            <div className="p-6 bg-[#07090e] border border-outline-variant/20 rounded-xl flex flex-col items-center justify-center gap-3 relative">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#434655_1px,transparent_1px)] [background-size:12px_12px]"></div>
              <span className={`material-symbols-outlined ${transactions.length > 0 ? "text-primary animate-pulse" : "text-on-surface-variant"} text-3xl`}>hub</span>
              <div className="text-center z-10">
                <div className={`text-[9px] font-label-mono ${transactions.length > 0 ? "text-risk-high" : "text-on-surface-variant"} uppercase font-bold tracking-widest`}>
                  {transactions.length > 0 ? "Potential Mule Ring" : "No active rings"}
                </div>
                <div className="font-bold text-xs text-on-surface mt-0.5">{transactions.length > 0 ? `${transactions.length * 2} Linked Entities` : "0 Linked Entities"}</div>
              </div>
            </div>

            {transactions.length > 0 && (
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-[#0d0f19] border border-outline-variant/20 rounded text-[9px] font-label-mono text-on-surface-variant">
                  Layer 2 Cluster
                </span>
                <span className="px-2 py-0.5 bg-[#0d0f19] border border-outline-variant/20 rounded text-[9px] font-label-mono text-on-surface-variant">
                  IP Conflict
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Flagged accounts registry table */}
      <div id="flagged-table-section">
        <FlaggedAccountsTable ingestionId={filterIngestionId} />
      </div>

      {/* Account Data Uploader Modal Dialog */}
      <AnimatePresence>
        {showUploader && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl flex justify-center"
            >
              <AccountDataUploader
                onClose={() => setShowUploader(false)}
                onSuccess={(ingestionId) => {
                  handleSetActiveIngestionId(ingestionId);
                  setFilterIngestionId(ingestionId);
                  setPreviewIngestionId(ingestionId);
                  setShowUploader(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="pt-12 border-t border-outline-variant/10 grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary font-bold text-3xl">shield</span>
            <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
              MuleShield AI
            </span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Securing the financial frontier with precision intelligence. Our proprietary AI models detect money laundering networks in milliseconds.
          </p>
        </div>

        <div>
          <h5 className="font-bold text-xs mb-4 text-on-background uppercase tracking-wider">Platform</h5>
          <ul className="space-y-2 text-xs text-on-surface-variant">
            <li><a className="hover:text-primary transition-colors" href="#">Investigations</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Network Analysis</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Compliance Engine</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">API Docs</a></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-xs mb-4 text-on-background uppercase tracking-wider">Company</h5>
          <ul className="space-y-2 text-xs text-on-surface-variant">
            <li><a className="hover:text-primary transition-colors" href="#">About</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Careers</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Security</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Contact</a></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-xs mb-4 text-on-background uppercase tracking-wider">Legal</h5>
          <ul className="space-y-2 text-xs text-on-surface-variant">
            <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Legal Notice</a></li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
