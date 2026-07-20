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
import { apiClient } from "../../services/api-client";

const FALLBACK_TIMELINE = [
  { time: "00:00", value: 340 },
  { time: "02:00", value: 210 },
  { time: "04:00", value: 430 },
  { time: "06:00", value: 580 },
  { time: "08:00", value: 310 },
  { time: "10:00", value: 390 },
  { time: "12:00", value: 180 },
  { time: "14:00", value: 480 },
  { time: "16:00", value: 610 },
  { time: "18:00", value: 410 },
];

export default function DashboardPage() {
  const { addToast } = useUIStore();
  const [timeRange, setTimeRange] = useState("24H");
  const [freezeExecuted, setFreezeExecuted] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [activeIngestionId, setActiveIngestionId] = useState<string | null>(null);
  const [filterIngestionId, setFilterIngestionId] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [timelineData, setTimelineData] = useState(FALLBACK_TIMELINE);
  const [liveTransactions, setLiveTransactions] = useState<any[]>([]);
  const [kpiStats, setKpiStats] = useState({
    total_accounts: "42,892",
    critical_alerts: "124",
    suspected_laundered_volume: "$3.2M",
    ai_accuracy: "99.2%",
  });

  // Fetch real dashboard data on mount
  useEffect(() => {
    async function loadDashboard() {
      setStatsLoading(true);
      try {
        const [statsRes, timelineRes, txRes] = await Promise.allSettled([
          apiClient.get<any>("/api/v1/dashboard/stats"),
          apiClient.get<any>("/api/v1/dashboard/timeline"),
          apiClient.get<any>("/api/v1/dashboard/critical-alerts"),
        ]);

        if (statsRes.status === "fulfilled" && statsRes.value?.data) {
          setKpiStats(statsRes.value.data);
        }
        if (timelineRes.status === "fulfilled" && Array.isArray(timelineRes.value?.data)) {
          setTimelineData(timelineRes.value.data);
        }
        if (txRes.status === "fulfilled" && Array.isArray(txRes.value?.data)) {
          setLiveTransactions(txRes.value.data);
        }
      } catch {
        // silently use fallback data
      } finally {
        setStatsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const stats = [
    {
      title: "TOTAL ACCOUNTS",
      value: statsLoading ? "..." : kpiStats.total_accounts,
      change: "+12.4% vs last mo",
      isPositive: true,
      icon: "group",
      color: "text-primary bg-primary/10 border-primary/20",
      tooltip: "Total registered banking accounts indexed across compliance ledgers."
    },
    {
      title: "CRITICAL ALERTS",
      value: statsLoading ? "..." : kpiStats.critical_alerts,
      change: "High priority surge",
      isPositive: false,
      icon: "error",
      color: "text-risk-high bg-risk-high/10 border-risk-high/20",
      tooltip: "Alerts exceeding threat score 90 requiring immediate remediation."
    },
    {
      title: "MONEY LAUNDERED (EST)",
      value: statsLoading ? "..." : kpiStats.suspected_laundered_volume,
      change: "AI cluster estimate",
      isPositive: true,
      icon: "payments",
      color: "text-risk-medium bg-risk-medium/10 border-risk-medium/20",
      tooltip: "Aggregated transaction volume flagged in suspicious loop configurations."
    },
    {
      title: "AI ACCURACY",
      value: statsLoading ? "..." : kpiStats.ai_accuracy,
      change: "Verified last 500 cases",
      isPositive: true,
      icon: "auto_awesome",
      color: "text-risk-low bg-risk-low/10 border-risk-low/20",
      tooltip: "Ratio of true positive model predictions verified by forensic audits."
    },
  ];

  // Determine transactions to display: prefer real data from API, else static fallback
  const transactions = liveTransactions.length > 0 ? liveTransactions : [
    {
      id: "ACC-72948-X",
      type: "SWIFT / International",
      amount: "$45,200.00",
      score: "89/100",
      status: "Investigating",
      riskLevel: "critical",
    },
    {
      id: "ACC-11023-B",
      type: "P2P Transfer",
      amount: "$2,150.00",
      score: "54/100",
      status: "In Queue",
      riskLevel: "medium",
    },
    {
      id: "ACC-99211-L",
      type: "Cash Deposit",
      amount: "$9,999.00",
      score: "72/100",
      status: "Flagged",
      riskLevel: "high",
    },
  ];

  const handleExecuteFreeze = () => {
    setFreezeExecuted(true);
    addToast("DOWNSTREAM ACTION ENFORCED: Hold placed on assets of ACC-72948-X.", "error");
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
              onClick={() => setFilterIngestionId(null)}
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

      {/* Ingestion summary stats card */}
      {activeIngestionId && (
        <IngestionSummaryCard
          ingestionId={activeIngestionId}
          onViewFlagged={(id) => {
            setFilterIngestionId(id);
            addToast("Filtering dashboard tables to the current statement ingestion run.", "info");
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

          {/* Singapore Cluster Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-label-mono uppercase tracking-wider">
              <span className="text-on-surface">Singapore Cluster</span>
              <span className="text-risk-critical font-bold">Critical</span>
            </div>
            <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden w-full">
              <div className="bg-risk-critical h-full rounded-full w-[92%]" />
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

            <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
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
                  {transactions.map((tx, idx) => (
                    <tr
                      key={idx}
                      className="text-body-sm hover:bg-surface-container-high/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-on-surface font-label-mono truncate">{tx.id}</td>
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
                        <span className="inline-flex items-center gap-1.5 text-xs text-on-surface">
                          {tx.status === "Investigating" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-risk-critical animate-pulse"></span>
                          )}
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* AI Recommendation Sidebar & Suspicious Hops */}
        <section className="lg:col-span-1 space-y-6 text-left">
          {/* AI Recommendation Box */}
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
                  Case #882-Alpha
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-outline-variant/15">
              <div className="flex justify-between items-center text-[10px] font-label-mono uppercase tracking-wider text-on-surface-variant">
                <span>Risk Score</span>
                <span className="font-bold text-risk-high">89/100</span>
              </div>
              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden w-full">
                <div className="bg-risk-high h-full rounded-full w-[89%]" />
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
                    <h5 className="font-semibold text-xs text-on-surface">Rapid In-Out Flow</h5>
                    <p className="text-[10px] text-on-surface-variant">Funds moved &lt; 4 min from deposit.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-risk-high text-base mt-0.5">share</span>
                  <div>
                    <h5 className="font-semibold text-xs text-on-surface">Device Sharing</h5>
                    <p className="text-[10px] text-on-surface-variant">Linked to 4 other flagged accounts.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-risk-high text-base mt-0.5">layers</span>
                  <div>
                    <h5 className="font-semibold text-xs text-on-surface">Layering Pattern</h5>
                    <p className="text-[10px] text-on-surface-variant">Obfuscated via 5 shell proxies.</p>
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
              <span className="material-symbols-outlined text-primary text-3xl animate-pulse">hub</span>
              <div className="text-center z-10">
                <div className="text-[9px] font-label-mono text-risk-high uppercase font-bold tracking-widest">
                  Potential Mule Ring
                </div>
                <div className="font-bold text-xs text-on-surface mt-0.5">8 Linked Entities</div>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-[#0d0f19] border border-outline-variant/20 rounded text-[9px] font-label-mono text-on-surface-variant">
                Layer 2 Cluster
              </span>
              <span className="px-2 py-0.5 bg-[#0d0f19] border border-outline-variant/20 rounded text-[9px] font-label-mono text-on-surface-variant">
                IP Conflict
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Flagged accounts registry table */}
      <FlaggedAccountsTable ingestionId={filterIngestionId} />

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
                  setActiveIngestionId(ingestionId);
                  setFilterIngestionId(ingestionId);
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
