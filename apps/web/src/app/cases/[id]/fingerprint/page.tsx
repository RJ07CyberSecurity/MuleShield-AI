"use client";

import { use, useState } from "react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface PageProps {
  params: Promise<{ id: string }>;
}

const velocityData = [
  { name: "00:00", logins: 2, transactions: 1 },
  { name: "04:00", logins: 4, transactions: 2 },
  { name: "08:00", logins: 12, transactions: 8 },
  { name: "12:00", logins: 28, transactions: 22 }, // Peak intersecting activity
  { name: "16:00", logins: 15, transactions: 19 },
  { name: "20:00", logins: 8, transactions: 7 },
  { name: "23:59", logins: 3, transactions: 2 },
];

export default function BehavioralFingerprintPage({ params }: PageProps) {
  const { id } = use(params);
  const [isMasked, setIsMasked] = useState(true);
  const [frozen, setFrozen] = useState(false);

  const handleExport = () => {
    alert("Compliance Dossier: Behavioral Fingerprint exported successfully to local workspace.");
  };

  const handleFreeze = () => {
    setFrozen(true);
    alert("ACCOUNT ASSET FREEZE ENFORCED: Vasily Kandinsky asset transfer hold executed downstream.");
    setTimeout(() => setFrozen(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href={`/cases/${id}`}
          className="inline-flex items-center gap-1.5 text-body-sm text-primary hover:text-primary-fixed font-semibold hover:underline"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Forensics Dossier
        </Link>
      </div>

      {/* Header bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-outline-variant/30">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 bg-risk-critical/15 border border-risk-critical/30 text-risk-critical text-[10px] font-label-mono uppercase tracking-wider rounded font-bold">
              Critical Alert
            </span>
            <span className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
              Case Ref: #AML-9023-F
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="font-display-kpi text-3xl font-extrabold text-on-surface tracking-tight leading-tight">
              Behavioral Fingerprint: Vasily Kandinsky
            </h1>
            <div className="flex items-center gap-1 text-[10px] font-label-mono text-on-surface-variant">
              <span className="material-symbols-outlined text-xs">fingerprint</span>
              ENTITY ID: VK-990-21-AX-00
            </div>
          </div>
        </div>

        {/* Header Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 rounded-xl text-body-sm font-semibold transition-colors flex items-center gap-2 text-on-surface"
          >
            <span className="material-symbols-outlined text-sm">download_done</span>
            Export Dossier
          </button>

          <button
            onClick={handleFreeze}
            className="px-4 py-2.5 bg-risk-critical text-white font-bold rounded-xl text-body-sm hover:bg-risk-critical/90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">emergency_home</span>
            {frozen ? "Account Frozen" : "Freeze Account"}
          </button>
        </div>
      </div>

      {/* Top row metrics panel (3-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Column 1: Risk Prediction */}
        <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
          <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
            Risk Prediction
          </h3>

          <div className="flex gap-6 items-center">
            {/* Risk Gauge square-box style */}
            <div className="w-24 h-24 rounded-2xl border-2 border-risk-critical flex flex-col items-center justify-center bg-[#180a0e] flex-shrink-0">
              <span className="text-3xl font-black text-risk-critical font-display-kpi">91</span>
              <span className="text-[8px] font-label-mono text-risk-critical uppercase font-bold tracking-widest mt-1">
                Critical
              </span>
            </div>

            <div className="space-y-1.5 flex-1">
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                Biometric login and spatial heuristics trigger high probability device farm takeover anomaly.
              </p>
            </div>
          </div>

          {/* Shap Explanation Factors */}
          <div className="space-y-3 pt-4 border-t border-outline-variant/10">
            <div className="text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
              SHAP Explainability Factors
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#07090e] border border-outline-variant/10">
                <span className="text-on-surface-variant font-medium">Impossible Travel Detected</span>
                <span className="font-bold text-risk-critical">+42.1</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#07090e] border border-outline-variant/10">
                <span className="text-on-surface-variant font-medium">Recent SIM Swap</span>
                <span className="font-bold text-risk-high">+31.4</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#07090e] border border-outline-variant/10">
                <span className="text-on-surface-variant font-medium">High Login Velocity</span>
                <span className="font-bold text-risk-high">+17.5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Digital Identity & Heatmap */}
        <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
          <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
            Digital Identity
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex gap-3 items-center p-3.5 rounded-xl bg-[#07090e] border border-outline-variant/20">
              <span className="material-symbols-outlined text-primary text-xl">open_in_browser</span>
              <div>
                <div className="text-[8px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">Browser</div>
                <div className="text-on-surface font-semibold mt-0.5">Chrome 121.0.6</div>
              </div>
            </div>

            <div className="flex gap-3 items-center p-3.5 rounded-xl bg-[#07090e] border border-outline-variant/20">
              <span className="material-symbols-outlined text-primary text-xl">phone_android</span>
              <div>
                <div className="text-[8px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">Operating System</div>
                <div className="text-on-surface font-semibold mt-0.5">Android 14 (U)</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#07090e]/40 border border-outline-variant/10 rounded-xl space-y-1">
            <div className="text-[8px] font-label-mono text-on-surface-variant uppercase tracking-wider font-bold">
              Device Fingerprint (SHA-256)
            </div>
            <div className="text-[9px] font-label-mono text-on-surface-variant truncate font-semibold">
              8f2b4c92c10a55d6f19988ff0d2c4f5a6b1c
            </div>
          </div>

          {/* 24H Activity heatmap text placeholder */}
          <div className="pt-2 border-t border-outline-variant/10 space-y-2">
            <div className="flex justify-between items-center text-[9px] font-label-mono uppercase tracking-wider text-on-surface-variant">
              <span>24H Login Activity Heatmap</span>
              <span>GMT +1</span>
            </div>
            <div className="h-2 bg-[#07090e] rounded-full overflow-hidden flex">
              <div className="bg-primary/20 h-full w-[25%]" />
              <div className="bg-risk-high h-full w-[20%]" />
              <div className="bg-risk-critical h-full w-[35%]" />
              <div className="bg-primary/30 h-full w-[20%]" />
            </div>
            <div className="flex justify-between text-[8px] font-label-mono text-on-surface-variant/60 pt-0.5">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:59</span>
            </div>
          </div>
        </div>

        {/* Column 3: Geo-Velocity Anomaly (London -> Lagos) */}
        <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
          <div className="flex justify-between items-baseline">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Geo-Velocity Anomaly
            </h3>
            <span className="text-risk-critical font-bold text-[9px] font-label-mono uppercase tracking-wider">
              Impossible Travel
            </span>
          </div>

          {/* Travel Schematic Vector diagram */}
          <div className="p-4 bg-[#07090e] border border-outline-variant/20 rounded-xl flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,#13080c_0%,transparent_70%)] opacity-30"></div>
            <div className="text-center z-10 space-y-1">
              <span className="material-symbols-outlined text-primary text-xl">location_on</span>
              <div className="text-[10px] font-bold text-on-surface font-label-mono">LDN</div>
            </div>

            {/* Dash line with warning indicator */}
            <div className="flex-1 flex items-center justify-center relative">
              <div className="w-full h-0.5 border-t-2 border-dashed border-outline-variant/50 relative"></div>
              <div className="absolute w-6 h-6 rounded-full bg-risk-critical/15 border border-risk-critical/30 flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-risk-critical text-xs font-semibold">warning</span>
              </div>
            </div>

            <div className="text-center z-10 space-y-1">
              <span className="material-symbols-outlined text-risk-critical text-xl">location_on</span>
              <div className="text-[10px] font-bold text-on-surface font-label-mono">LOS</div>
            </div>
          </div>

          {/* Metrics specifics */}
          <div className="space-y-4 pt-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-medium">Distance</span>
              <span className="text-on-surface font-bold font-label-mono">3,112 mi</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-medium">Time Delta</span>
              <span className="text-risk-high font-bold font-label-mono">01h 42m</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-medium">Required Speed</span>
              <span className="text-risk-critical font-bold font-label-mono">1,830 mph</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row layouts (Velocity Correlation chart & Security timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Velocity Correlation AreaChart (2/3 width) */}
        <section className="lg:col-span-2 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Velocity Correlation
            </h3>
            {/* Custom chart legend */}
            <div className="flex gap-4 text-[9px] font-label-mono uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span className="text-on-surface-variant">Logins</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="text-on-surface-variant">Transactions</span>
              </div>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData} margin={{ left: -30, right: 0, top: 10, bottom: 0 }}>
                <XAxis
                  dataKey="name"
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
                  contentStyle={{
                    backgroundColor: "#1c1e26",
                    borderColor: "#323545",
                    color: "#e1e2ed",
                    fontSize: "11px",
                  }}
                />
                <Area type="monotone" dataKey="logins" stroke="#ffffff" fill="rgba(255,255,255,0.02)" strokeWidth={2} />
                <Area type="monotone" dataKey="transactions" stroke="#3b82f6" fill="rgba(59,130,246,0.05)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Under stats cards */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/10">
            <div className="p-3.5 rounded-xl bg-[#07090e] border border-outline-variant/10 text-xs">
              <div className="flex justify-between items-center text-[9px] font-label-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
                <span>Failed vs Successful Logins</span>
                <span className="font-bold text-risk-critical">85% Fail</span>
              </div>
              <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden w-full">
                <div className="bg-risk-critical h-full rounded-full w-[85%]" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#07090e] border border-outline-variant/10 flex flex-col justify-between">
              <div className="text-[9px] font-label-mono uppercase tracking-wider text-on-surface-variant">
                Transaction Velocity
              </div>
              <div className="font-bold text-sm text-on-surface mt-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-risk-high text-base">trending_up</span>
                14 tx/min (Global Peak)
              </div>
            </div>
          </div>
        </section>

        {/* Security Events Timeline (1/3 width) */}
        <section className="lg:col-span-1 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Security Events Timeline
            </h3>
            <span className="material-symbols-outlined text-on-surface-variant text-base">schedule</span>
          </div>

          {/* Checklist events stream */}
          <div className="space-y-6 max-h-[290px] overflow-y-auto pr-1">
            <div className="relative pl-6 border-l border-outline-variant/20 space-y-1">
              <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-risk-critical" />
              <div className="text-[9px] font-label-mono text-on-surface-variant flex justify-between">
                <span>14:22:11 - NEW ACCOUNT</span>
              </div>
              <h5 className="font-bold text-xs text-on-surface">Beneficiary Added: 'MULE_RECEPTOR_09'</h5>
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                Account routing via high-risk jurisdiction (Seychelles).
              </p>
            </div>

            <div className="relative pl-6 border-l border-outline-variant/20 space-y-1">
              <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-risk-high" />
              <div className="text-[9px] font-label-mono text-on-surface-variant flex justify-between">
                <span>14:18:45 - SECURITY</span>
              </div>
              <h5 className="font-bold text-xs text-on-surface">Password Reset Requested</h5>
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                Attempt made from new IP address (45.12.9.231).
              </p>
            </div>

            <div className="relative pl-6 border-l border-outline-variant/20 space-y-1">
              <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-risk-critical" />
              <div className="text-[9px] font-label-mono text-on-surface-variant flex justify-between">
                <span>14:12:02 - LOGIN FAIL</span>
              </div>
              <h5 className="font-bold text-xs text-on-surface">9th Consecutive Failed Login</h5>
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                Brute force signature detected from Device ID 992-AK.
              </p>
            </div>

            <div className="relative pl-6 space-y-1">
              <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-[#e1e2ed]" />
              <div className="text-[9px] font-label-mono text-on-surface-variant flex justify-between">
                <span>12:30:00 - SESSION START</span>
              </div>
              <h5 className="font-bold text-xs text-on-surface">Successful Login</h5>
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                Location: London, UK (Home IP).
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/10 text-center font-label-mono text-[10px] uppercase font-bold">
            <span className="text-primary hover:underline cursor-pointer">View Full Audit Trail</span>
          </div>
        </section>
      </div>

      {/* PII Masking Footer Controls */}
      <footer className="p-4 bg-[#0a0d17] border border-outline-variant/30 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined text-on-surface-variant text-base">visibility_off</span>
          <span>
            Personally Identifiable Information (PII) is currently <strong className="text-on-surface">Masked</strong>. Authorized supervisors can toggle de-masking for active subpoena requests.
          </span>
        </div>
        <button
          onClick={() => {
            setIsMasked(!isMasked);
            alert(isMasked ? "PII Unmasked: compliance lead credentials verified." : "PII Masking re-applied successfully.");
          }}
          className="px-4 py-2 border border-outline-variant/50 hover:border-primary/50 text-on-surface font-semibold rounded-xl text-body-sm hover:bg-white/5 transition-all whitespace-nowrap"
        >
          {isMasked ? "Request De-Mask" : "Re-Mask PII"}
        </button>
      </footer>
    </div>
  );
}
