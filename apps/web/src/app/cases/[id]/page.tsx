"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CaseDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isFrozen, setIsFrozen] = useState(false);
  const [assigned, setAssigned] = useState(false);

  const handleFreeze = () => {
    setIsFrozen(true);
    alert("CRITICAL RESPONSE TRIGGERED: Host node and linked accounts assets frozen successfully.");
    setTimeout(() => setIsFrozen(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 text-body-sm text-primary hover:text-primary-fixed font-semibold hover:underline"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Case Registry
        </Link>
      </div>

      {/* Dossier Header Info */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-outline-variant/30">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
              Dossier: Account Forensic
            </span>
            <span className="px-2.5 py-0.5 bg-risk-critical/15 border border-risk-critical/30 text-risk-critical text-[10px] font-label-mono uppercase tracking-wider rounded">
              Critical Threat
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="font-display-kpi text-4xl font-extrabold text-on-surface tracking-tight">
              {id === "ACC-092281" ? "ACC-092281" : id}
            </h1>
            <span className="text-xl text-on-surface-variant font-light">/ Bank of Geneva</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-risk-low flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-risk-low animate-pulse"></span>
              Active
            </span>
            <span className="text-risk-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">visibility</span>
              Under Review
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setAssigned(true);
              alert("Case successfully assigned to Sarah Chambers (CCO).");
            }}
            className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 rounded-xl text-body-sm font-semibold transition-colors flex items-center gap-2 text-on-surface"
          >
            <span className="material-symbols-outlined text-sm">assignment_ind</span>
            {assigned ? "Assigned (Chambers)" : "Assign Analyst"}
          </button>

          <button
            onClick={() => alert("Forensic Dossier PDF exported successfully.")}
            className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 rounded-xl text-body-sm font-semibold transition-colors flex items-center gap-2 text-on-surface"
          >
            <span className="material-symbols-outlined text-sm">description</span>
            Generate Report
          </button>

          <Link
            href={`/cases/${id}/fingerprint`}
            className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 rounded-xl text-body-sm font-semibold transition-colors flex items-center gap-2 text-on-surface"
          >
            <span className="material-symbols-outlined text-sm">fingerprint</span>
            Behavioral Fingerprint
          </Link>

          <button
            onClick={() => router.push("/explorer")}
            className="px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-xl text-body-sm font-bold text-primary transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">play_circle</span>
            Start Investigation
          </button>

          <button
            onClick={handleFreeze}
            className="px-4 py-2 bg-risk-critical text-white font-bold rounded-xl text-body-sm hover:bg-risk-critical/90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">emergency_home</span>
            {isFrozen ? "Account Frozen" : "Freeze Account"}
          </button>
        </div>
      </div>

      {/* Main 3-Column Core Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Column 1: Risk Intelligence */}
        <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
          <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
            Risk Intelligence
          </h3>

          <div className="flex gap-6 items-center">
            {/* Anomaly Gauge */}
            <div className="flex flex-col items-center justify-center relative w-24 h-24 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="38" stroke="rgba(67, 70, 85, 0.2)" strokeWidth="6" fill="transparent" />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  stroke="#DC2626"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="238"
                  strokeDashoffset={50}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-on-surface font-display-kpi leading-none">89</span>
                <span className="text-[7px] font-label-mono text-on-surface-variant uppercase tracking-wider mt-1">
                  Score
                </span>
              </div>
            </div>

            {/* Risk Trend Info */}
            <div className="space-y-1.5 flex-1">
              <div className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider font-semibold">
                30-Day Risk Trend
              </div>
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                Elevated risk trajectory detected. Score increased <strong className="text-risk-high">+14</strong> in last 48h.
              </p>
            </div>
          </div>

          {/* SHAP Contributors */}
          <div className="space-y-3 pt-4 border-t border-outline-variant/10">
            <div className="text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
              SHAP Contributors
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#07090e] border border-outline-variant/10">
                <span className="text-on-surface-variant font-medium">Rapid In-Out Flow</span>
                <span className="font-bold text-risk-critical">+42.2</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#07090e] border border-outline-variant/10">
                <span className="text-on-surface-variant font-medium">New Device (Lagos, NG)</span>
                <span className="font-bold text-risk-high">+15.1</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#07090e] border border-outline-variant/10">
                <span className="text-on-surface-variant font-medium">Unusual Nighttime Activity</span>
                <span className="font-bold text-risk-high">+12.4</span>
              </div>
            </div>
          </div>

          {/* Triggered Rules */}
          <div className="space-y-2.5 pt-4 border-t border-outline-variant/10">
            <div className="text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
              Triggered Rules
            </div>
            <div className="flex flex-wrap gap-2 text-[9px] font-label-mono">
              <span className="px-2.5 py-1 bg-risk-critical/15 border border-risk-critical/30 rounded text-risk-critical font-bold">
                R3: RAPID_IN_OUT
              </span>
              <span className="px-2.5 py-1 bg-risk-high/15 border border-risk-high/30 rounded text-risk-high font-bold">
                R14: IMP_TRAVEL
              </span>
              <span className="px-2.5 py-1 bg-surface-container-high border border-outline-variant/30 rounded text-on-surface-variant">
                R82: HIGH_VAL_ROUND
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Subject Profile Card (Vasily Kandinsky) */}
        <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
          <div className="flex justify-between items-start">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Subject Profile
            </h3>
            <span className="material-symbols-outlined text-on-surface-variant text-base">open_in_new</span>
          </div>

          <div className="flex gap-4 items-center">
            {/* Avatar placeholder */}
            <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center border border-outline-variant/30 overflow-hidden flex-shrink-0">
              <img
                className="w-full h-full object-cover"
                alt="Vasily Kandinsky avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1vmxBiK08u2KMyW_AgKQAKFTMxxMGvxlgk-c7IZwrQlOb9w0qwj7TlrNIMpQdT492sBN9RRQ2sjdEegZrNM72WOYySC6N_kyDmbbh86ln22aIpSmDviDiTyvDKNuULnoT3v-a8YgAF5S4gvL8kOQ2FCquD3GJg5gGhTxpNwgpGCdF3I9aiI8_yniPtcp_cE3RXm4xqzM2kWu6XLUJWfpoyuw47WQpY4Nv8KfsuulzYzNu5_ZDZ0h5"
              />
            </div>
            <div>
              <h4 className="font-bold text-base text-on-surface">Vasily Kandinsky</h4>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Art Dealer • Kandinsky Fine Arts
              </p>
            </div>
          </div>

          {/* Profiler list info */}
          <div className="space-y-4 pt-4 border-t border-outline-variant/10 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-medium">Annual Income</span>
              <span className="text-primary font-bold font-label-mono">$500k+ USD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-medium">Onboarding Date</span>
              <span className="text-on-surface font-semibold font-label-mono">12 MAR 2021</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-medium">Country Risk</span>
              <span className="px-2 py-0.5 bg-risk-low/10 border border-risk-low/20 rounded font-bold text-risk-low font-label-mono text-[10px]">
                LOW
              </span>
            </div>
          </div>

          {/* KYC validation stats */}
          <div className="pt-6 border-t border-outline-variant/10 space-y-4">
            <div className="flex items-center gap-2 text-risk-low text-xs font-bold">
              <span className="material-symbols-outlined text-base">verified</span>
              KYC FULLY VERIFIED
            </div>

            {/* Quick action icons */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-[#07090e] border border-outline-variant/20 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-base">contact_page</span>
              </div>
              <div className="p-3 bg-[#07090e] border border-outline-variant/20 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-base">location_on</span>
              </div>
              <div className="p-3 bg-[#07090e] border border-outline-variant/20 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-base">account_balance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Financial Telemetry */}
        <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
          <div className="flex justify-between items-baseline">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Financial Telemetry
            </h3>
            <span className="font-label-mono text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">
              Updated: Just Now
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
              Current Balance
            </div>
            <div className="text-3xl font-extrabold text-on-surface tracking-tight font-display-kpi">
              $1,248,500.00
            </div>
          </div>

          {/* Progress bars (Inflow vs Outflow) */}
          <div className="space-y-4 pt-4 border-t border-outline-variant/10 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between font-label-mono uppercase tracking-wider">
                <span className="text-on-surface-variant">Total Inflow</span>
                <span className="text-risk-low font-bold">$2.4M</span>
              </div>
              <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden w-full">
                <div className="bg-risk-low h-full rounded-full w-[80%]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-label-mono uppercase tracking-wider">
                <span className="text-on-surface-variant">Total Outflow</span>
                <span className="text-risk-critical font-bold">$1.15M</span>
              </div>
              <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden w-full">
                <div className="bg-risk-critical h-full rounded-full w-[45%]" />
              </div>
            </div>
          </div>

          {/* Velocity Analysis */}
          <div className="pt-4 border-t border-outline-variant/10 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-label-mono uppercase tracking-wider">
              <span className="text-on-surface-variant">Velocity Analysis</span>
              <span className="text-risk-high font-bold">+245%</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#07090e] border border-outline-variant/10">
                <div className="text-lg font-bold text-on-surface">84</div>
                <div className="text-[8px] font-label-mono text-on-surface-variant uppercase tracking-wider mt-1">
                  Txns / 24H
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#07090e] border border-outline-variant/10">
                <div className="text-lg font-bold text-on-surface">12</div>
                <div className="text-[8px] font-label-mono text-on-surface-variant uppercase tracking-wider mt-1">
                  Txns / Avg
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid Row (Network Intelligence & Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Network Intelligence (2/3 width) */}
        <section className="lg:col-span-2 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Network Intelligence (Hops: 2)
            </h3>
            <div className="flex items-center gap-4">
              <span className="px-2.5 py-0.5 bg-risk-critical/15 border border-risk-critical/30 text-risk-critical text-[9px] font-label-mono uppercase tracking-wider rounded">
                Suspicious Nodes (3)
              </span>
              <span className="material-symbols-outlined text-on-surface-variant hover:text-on-surface text-base cursor-pointer">
                fullscreen
              </span>
            </div>
          </div>

          {/* Custom node layout drawing */}
          <div className="relative w-full aspect-[16/6] border border-outline-variant/20 rounded-xl overflow-hidden bg-[#07090e] my-4 flex items-center justify-center">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#434655_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Simulated Nodes & Links */}
            <div className="relative flex items-center gap-24 z-10 font-label-mono text-[9px]">
              {/* Linked device */}
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 border border-outline-variant/30 rounded-xl bg-surface-container-low text-center">
                  <span className="material-symbols-outlined text-primary text-base">smartphone</span>
                  <div className="text-on-surface-variant mt-1.5 uppercase font-bold text-[8px]">LNK_DEV_4</div>
                </div>
              </div>

              {/* Arrow */}
              <div className="w-12 h-[2px] bg-primary/40 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-ping"></div>
              </div>

              {/* Subject Account */}
              <div className="flex flex-col items-center gap-2">
                <div className="p-4 border-2 border-risk-critical/50 rounded-xl bg-[#0d0f19] text-center shadow-lg shadow-risk-critical/10">
                  <span className="material-symbols-outlined text-risk-critical text-xl font-bold">account_balance</span>
                  <div className="text-on-surface mt-1.5 font-bold uppercase text-[9px]">Subject_Acc</div>
                </div>
              </div>

              {/* Arrow */}
              <div className="w-12 h-[2px] bg-primary/40 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-ping"></div>
              </div>

              {/* Beneficiary */}
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 border border-outline-variant/30 rounded-xl bg-surface-container-low text-center">
                  <span className="material-symbols-outlined text-primary text-base">person</span>
                  <div className="text-on-surface-variant mt-1.5 uppercase font-bold text-[8px]">Bene_211</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom count specifications */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-outline-variant/10 text-center font-label-mono text-[10px]">
            <div>
              <div className="text-on-surface font-bold text-base">08</div>
              <div className="text-on-surface-variant uppercase tracking-wider mt-1">Linked Devices</div>
            </div>
            <div className="border-l border-outline-variant/10">
              <div className="text-on-surface font-bold text-base">03</div>
              <div className="text-on-surface-variant uppercase tracking-wider mt-1">Shared IPs</div>
            </div>
            <div className="border-l border-outline-variant/10">
              <div className="text-on-surface font-bold text-base">12</div>
              <div className="text-on-surface-variant uppercase tracking-wider mt-1">Beneficiaries</div>
            </div>
          </div>
        </section>

        {/* Timeline (1/3 width) */}
        <section className="lg:col-span-1 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Timeline
            </h3>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant hover:text-on-surface text-base cursor-pointer">
                filter_alt
              </span>
              <span className="material-symbols-outlined text-on-surface-variant hover:text-on-surface text-base cursor-pointer">
                download
              </span>
            </div>
          </div>

          {/* Timeline events lists */}
          <div className="space-y-6 max-h-[310px] overflow-y-auto pr-1">
            {/* Item 1 */}
            <div className="relative pl-6 border-l border-outline-variant/20 space-y-1">
              <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-risk-critical animate-pulse" />
              <div className="flex justify-between items-baseline text-[9px] font-label-mono">
                <span className="font-bold text-risk-critical">Critical Alert Generated</span>
                <span className="text-on-surface-variant">14:02:11</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                System detected rapid fund dispersal to 4 high-risk jurisdictions.
              </p>
            </div>

            {/* Item 2 */}
            <div className="relative pl-6 border-l border-outline-variant/20 space-y-1">
              <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
              <div className="flex justify-between items-baseline text-[9px] font-label-mono">
                <span className="font-bold text-on-surface">Session Login</span>
                <span className="text-on-surface-variant">13:45:00</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                User logged in from Lagos, Nigeria. New IP Address detected.
              </p>
            </div>

            {/* Item 3 */}
            <div className="relative pl-6 border-l border-outline-variant/20 space-y-1">
              <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-risk-low" />
              <div className="flex justify-between items-baseline text-[9px] font-label-mono">
                <span className="font-bold text-risk-low">Diligence Update</span>
                <span className="text-on-surface-variant">09:12:33</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Analyst (ID: 022) updated PEP status to Negative.
              </p>
            </div>

            {/* Item 4 */}
            <div className="relative pl-6 space-y-1">
              <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-on-surface-variant/40" />
              <div className="flex justify-between items-baseline text-[9px] font-label-mono">
                <span className="font-bold text-on-surface-variant">Inbound Wire</span>
                <span className="text-on-surface-variant">YESTERDAY</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Transfer received: $450,000.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Restrict message */}
      <footer className="pt-8 border-t border-outline-variant/10 flex justify-between items-center text-[10px] font-label-mono text-on-surface-variant/40 uppercase tracking-widest">
        <span>© 2026 SENTINEL INTELLIGENCE SYSTEMS. RESTRICTED ACCESS.</span>
        <div className="flex gap-4 font-semibold">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span className="text-risk-low">Security Status: V.4.2 Active</span>
        </div>
      </footer>
    </div>
  );
}
