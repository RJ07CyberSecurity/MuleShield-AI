"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUIStore } from "../../store/useUIStore";
import { apiClient } from "@/services/api-client";

export default function CustomerProfilePage() {
  const { addToast } = useUIStore();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const customerName = profileData ? `${profileData.first_name} ${profileData.last_name}` : "Ananya Sharma";
  const customerId = profileData ? `IND-${profileData.id.slice(0, 4).toUpperCase()}-XQ` : "IND-8842-XQ";
  const email = profileData?.email || "ananya.s***@gmail.com";
  const phone = profileData?.phone || "+91 98*** **341";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-label-mono text-on-surface-variant uppercase tracking-wider">Loading Customer Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-left">
      {/* Top Page Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-sm text-2xl font-bold text-on-surface tracking-tight">Customer Financial Profile</h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-xs">verified</span>
              Verified from Uploaded Statement
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 bg-surface-container-high border border-outline-variant/20 text-on-surface-variant text-[11px] font-label-mono font-bold rounded-lg">
            STMT: <span className="text-on-surface">#992-AX4</span>
          </span>
          <span className="px-3 py-1 bg-surface-container-high border border-outline-variant/20 text-on-surface-variant text-[11px] font-label-mono font-bold rounded-lg">
            Uploaded: <span className="text-on-surface">2hrs ago</span>
          </span>
          <span className="px-3 py-1 bg-risk-critical/15 border border-risk-critical/30 text-risk-critical text-[11px] font-label-mono font-bold rounded-lg uppercase tracking-wider">
            ⚠️ HIGH RISK
          </span>
        </div>
      </div>

      {/* Main 3-Column Profile Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMN 1: Customer Card, Contact Info, Documents (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Customer Main Card */}
          <div className="p-6 rounded-2xl border border-outline-variant/20 bg-surface-container-low/90 space-y-5 text-center relative overflow-hidden">
            <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-primary/30 shadow-xl bg-surface-container-high">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300"
                alt="Ananya Sharma"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 bg-primary text-on-primary p-1 rounded-md shadow">
                <span className="material-symbols-outlined text-xs font-bold">account_balance</span>
              </div>
            </div>

            <div>
              <h2 className="font-headline-sm text-lg font-bold text-on-surface">{customerName}</h2>
              <p className="text-xs font-label-mono text-on-surface-variant font-semibold mt-0.5">CID: {customerId}</p>
            </div>

            <div className="space-y-3 text-xs border-t border-outline-variant/15 pt-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant font-medium">Account Status</span>
                <span className="flex items-center gap-1.5 text-risk-low font-bold">
                  <span className="w-2 h-2 rounded-full bg-risk-low animate-pulse"></span>
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant font-medium">KYC Status</span>
                <span className="text-on-surface font-semibold">Verified</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant font-medium">Customer Since</span>
                <span className="text-on-surface font-semibold font-label-mono">Oct 2021</span>
              </div>
            </div>

            <button
              onClick={() => addToast(`Generated full compliance dossier for ${customerName}`, "success")}
              className="w-full py-2.5 px-4 rounded-xl border border-primary text-primary font-bold text-xs hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
            >
              View Full Report
            </button>
          </div>

          {/* Contact Information Card */}
          <div className="p-5 rounded-2xl border border-outline-variant/20 bg-surface-container-low/90 space-y-4">
            <h3 className="font-label-mono text-caption font-bold text-primary uppercase tracking-wider">Contact Information</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-base mt-0.5">smartphone</span>
                <div>
                  <p className="font-semibold text-on-surface font-label-mono">{phone}</p>
                  <p className="text-[10px] text-on-surface-variant/80">Primary Mobile</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-base mt-0.5">mail</span>
                <div>
                  <p className="font-semibold text-on-surface font-label-mono">{email}</p>
                  <p className="text-[10px] text-on-surface-variant/80">Primary Email</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-base mt-0.5">location_on</span>
                <div>
                  <p className="font-semibold text-on-surface leading-tight">Flat 402, Skyline Apts Andheri West, Mumbai</p>
                  <p className="text-[10px] text-on-surface-variant/80">Residential Address</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Card */}
          <div className="p-5 rounded-2xl border border-outline-variant/20 bg-surface-container-low/90 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-label-mono text-caption font-bold text-on-surface uppercase tracking-wider">Documents</h3>
              <span className="material-symbols-outlined text-on-surface-variant text-base">folder_open</span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-risk-critical text-base">description</span>
                  <span className="font-medium text-on-surface font-label-mono">Bank_Stmt_Oct.pdf</span>
                </div>
                <button className="material-symbols-outlined text-on-surface-variant hover:text-primary text-base">download</button>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">image</span>
                  <span className="font-medium text-on-surface font-label-mono">PAN_Card_Scan.jpg</span>
                </div>
                <button className="material-symbols-outlined text-on-surface-variant hover:text-primary text-base">download</button>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Metrics Row, Risk Intelligence, AI Observations, Network Topology (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Top 4 Stat Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low">
              <p className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider">Total Credits (30d)</p>
              <h3 className="text-lg font-bold text-on-surface font-label-mono mt-1">₹42.5L</h3>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low">
              <p className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider">Total Debits (30d)</p>
              <h3 className="text-lg font-bold text-on-surface font-label-mono mt-1">₹41.8L</h3>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low">
              <p className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider">Avg Balance</p>
              <h3 className="text-lg font-bold text-on-surface font-label-mono mt-1">₹1.2L</h3>
            </div>

            <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 text-center">
              <p className="text-[10px] font-label-mono text-primary uppercase tracking-wider font-bold">Mule Score</p>
              <h3 className="text-xl font-bold text-primary font-label-mono mt-0.5">85 <span className="text-xs font-normal text-on-surface-variant">/100</span></h3>
            </div>
          </div>

          {/* Middle Row: Risk Intelligence + AI Observations Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Risk Intelligence Card */}
            <div className="p-5 rounded-2xl border border-outline-variant/20 bg-surface-container-low/90 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-label-mono text-caption font-bold text-risk-critical uppercase tracking-wider">Risk Intelligence</h3>
                <span className="px-2 py-0.5 bg-risk-critical/20 text-risk-critical border border-risk-critical/30 rounded text-[9px] font-bold uppercase font-label-mono">
                  CRITICAL
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-label-mono">
                    <span className="text-on-surface-variant">Suspicious Activity</span>
                    <span className="text-risk-critical font-bold">92%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-risk-critical rounded-full w-[92%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-label-mono">
                    <span className="text-on-surface-variant">Fraud Probability</span>
                    <span className="text-risk-critical font-bold">88%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-risk-critical rounded-full w-[88%]"></div>
                  </div>
                </div>

                <div className="pt-1 flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant">Shell Co. Indicators</span>
                  <span className="text-risk-medium font-bold font-label-mono">Medium</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant">AML/PEP Match</span>
                  <span className="text-risk-low font-bold font-label-mono">Clear</span>
                </div>
              </div>
            </div>

            {/* AI Observations Card */}
            <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-sm font-bold">auto_awesome</span>
                <h3 className="font-label-mono text-caption font-bold uppercase tracking-wider">AI Observations</h3>
              </div>

              <ul className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-on-surface">High transaction velocity:</strong> 42 transfers completed within 72 hours of account funding.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-on-surface">Rapid fund movement:</strong> Incoming funds are dispersed to multiple unverified accounts within 30 minutes.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-on-surface">Anomalous timing:</strong> 65% of outbound transfers occur between 1AM and 4AM IST.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Network Topology Canvas Preview */}
          <div className="p-5 rounded-2xl border border-outline-variant/20 bg-surface-container-low/90 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-label-mono text-caption font-bold text-on-surface uppercase tracking-wider">Network Topology</h3>
              <Link href="/explorer" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                Open Explorer
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </Link>
            </div>

            <div className="h-48 rounded-xl bg-surface-container-lowest border border-outline-variant/15 flex items-center justify-center relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 400 180">
                <line x1="200" y1="90" x2="120" y2="50" stroke="#F97316" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="200" y1="90" x2="280" y2="130" stroke="#F97316" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="200" y1="90" x2="260" y2="60" stroke="#2563eb" strokeWidth="1.5" />
                <line x1="200" y1="90" x2="140" y2="130" stroke="#2563eb" strokeWidth="1.5" />

                <circle cx="200" cy="90" r="12" fill="#06b6d4" className="animate-pulse" />
                <circle cx="120" cy="50" r="8" fill="#F97316" />
                <circle cx="280" cy="130" r="8" fill="#F97316" />
                <circle cx="260" cy="60" r="6" fill="#94a3b8" />
                <circle cx="140" cy="130" r="6" fill="#94a3b8" />
              </svg>

              <div className="absolute bottom-2 left-2 flex gap-2">
                <span className="px-2 py-0.5 bg-black/60 backdrop-blur rounded text-[9px] font-label-mono text-on-surface-variant font-bold border border-outline-variant/20">
                  Nodes: 14
                </span>
                <span className="px-2 py-0.5 bg-risk-critical/20 backdrop-blur rounded text-[9px] font-label-mono text-risk-critical font-bold border border-risk-critical/30">
                  High Risk: 3
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: Account Timeline (3 cols) */}
        <div className="lg:col-span-3">
          <div className="p-5 rounded-2xl border border-outline-variant/20 bg-surface-container-low/90 space-y-4 h-full">
            <h3 className="font-label-mono text-caption font-bold text-on-surface uppercase tracking-wider">Account Timeline</h3>

            <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/20 pl-6">
              
              <div className="relative text-xs space-y-1">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-risk-critical border-2 border-surface-container-low"></span>
                <p className="text-[10px] font-label-mono text-on-surface-variant font-semibold">Today, 02:14 AM</p>
                <h4 className="font-bold text-on-surface text-xs leading-tight">Suspicious Outbound Transfer</h4>
                <p className="text-[11px] text-on-surface-variant leading-normal">
                  <span className="font-label-mono font-bold text-risk-critical">₹5,00,000</span> to flagged account.
                </p>
              </div>

              <div className="relative text-xs space-y-1">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface-container-low"></span>
                <p className="text-[10px] font-label-mono text-on-surface-variant font-semibold">Yesterday, 11:30 PM</p>
                <h4 className="font-bold text-on-surface text-xs leading-tight">Large Incoming Credit</h4>
                <p className="text-[11px] text-on-surface-variant leading-normal">
                  <span className="font-label-mono font-bold text-primary">₹12,50,000</span> via RTGS.
                </p>
              </div>

              <div className="relative text-xs space-y-1">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-outline-variant border-2 border-surface-container-low"></span>
                <p className="text-[10px] font-label-mono text-on-surface-variant font-semibold">Oct 12, 2021</p>
                <h4 className="font-bold text-on-surface text-xs leading-tight">KYC Documents Updated</h4>
              </div>

              <div className="relative text-xs space-y-1">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-outline-variant border-2 border-surface-container-low"></span>
                <p className="text-[10px] font-label-mono text-on-surface-variant font-semibold">Oct 10, 2021</p>
                <h4 className="font-bold text-on-surface text-xs leading-tight">Account Created</h4>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
