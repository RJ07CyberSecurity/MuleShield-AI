"use client";

import { use, useState } from "react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useUIStore } from "../../../../store/useUIStore";

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
  const { addToast } = useUIStore();
  const [isMasked, setIsMasked] = useState(true);
  const [frozen, setFrozen] = useState(false);

  const handleExport = () => {
    addToast("Compliance Dossier: Behavioral Fingerprint exported successfully to local workspace.", "success");
  };

  const handleFreeze = () => {
    setFrozen(true);
    addToast("ACCOUNT ASSET FREEZE ENFORCED: Asset hold executed downstream.", "error");
    setTimeout(() => setFrozen(false), 3000);
  };

  return (
    <div className="space-y-6 text-left">
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
              <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                <span className="text-on-surface-variant font-medium">Impossible Travel Detected</span>
                <span className="font-bold text-risk-critical">+42.1</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                <span className="text-on-surface-variant font-medium">Recent SIM Swap</span>
                <span className="font-bold text-risk-high">+31.4</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                <span className="text-on-surface-variant font-medium">High Login Velocity</span>
                <span className="font-bold text-risk-high">+17.5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Digital Identity & Info */}
        <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
          <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
            Digital Identity
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex gap-3 items-center p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
              <span className="material-symbols-outlined text-primary text-xl">open_in_browser</span>
              <div>
                <div className="text-[8px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">Browser</div>
                <div className="text-on-surface font-semibold mt-0.5">Chrome 121.0.6</div>
              </div>
            </div>

            <div className="flex gap-3 items-center p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
              <span className="material-symbols-outlined text-primary text-xl">phone_android</span>
              <div>
                <div className="text-[8px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">Operating System</div>
                <div className="text-on-surface font-semibold mt-0.5">Android 14 (U)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Network Signature AreaChart */}
        <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
          <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
            Activity Timings
          </h3>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData} margin={{ left: -30, right: 0, top: 10, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#8d90a0" style={{ fontSize: "8px" }} />
                <YAxis stroke="#8d90a0" style={{ fontSize: "8px" }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2 bg-surface-container-high border border-outline-variant/30 rounded text-[9px] font-label-mono">
                          <p>Hour: {payload[0].payload.name}</p>
                          <p className="font-bold text-primary">Logins: {payload[0].value}</p>
                          <p className="font-bold text-risk-high">Txns: {payload[1]?.value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="logins" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.1)" strokeWidth={2} />
                <Area type="monotone" dataKey="transactions" stroke="#f97316" fill="rgba(249, 115, 22, 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
