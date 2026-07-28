"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUIStore } from "../../../store/useUIStore";
import { apiClient } from "@/services/api-client";
import { formatCurrency } from "@/utils/currency";
import TimelineChart from "../../../components/cases/TimelineChart";
import NetworkGraph from "../../../components/dashboard/NetworkGraph";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface CaseDetails {
  id: string;
  notes: string;
  status: string;
  customer_id: string;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_kyc_status?: string;
  customer_risk_score?: number;
  financial_telemetry?: {
    current_balance?: number;
    total_inflow?: number;
    total_outflow?: number;
    velocity_increase?: number;
  };
  subject_profile?: {
    name?: string;
    email?: string;
  };
  customer_phone?: string;
  customer_pan?: string;
  customer_aadhaar?: string;
  customer_occupation?: string;
  customer_income?: number;
  customer_address?: string;
}

export default function CaseDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useUIStore();
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [isFreezing, setIsFreezing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fake timeline data
  const timelineData: any[] = [
    { date: "NOV 01", amount: 4000, risk: "low" },
    { date: "NOV 08", amount: 15000, risk: "high" },
    { date: "NOV 15", amount: 2000, risk: "low" },
    { date: "NOV 22", amount: 25000, risk: "high" },
    { date: "NOV 29", amount: 5000, risk: "low" },
    { date: "TODAY", amount: 18000, risk: "high" },
  ];

  useEffect(() => {
    const fetchDossier = async () => {
      setLoading(true);
      try {
        const caseId = id;
        const res = await apiClient.get<any>(`/api/v1/cases/${encodeURIComponent(caseId)}`);
        if (res && res.success && res.data) {
          const detail = res.data;
          if (detail.customer_id) {
            try {
              const custRes = await apiClient.get<any>(`/api/v1/customers/${encodeURIComponent(detail.customer_id)}`);
              if (custRes && custRes.success && custRes.data) {
                const customer = custRes.data;
                detail.customer_name = `${customer.first_name} ${customer.last_name}`;
                detail.customer_email = customer.email;
                detail.customer_kyc_status = customer.kyc_status;
                detail.customer_risk_score = customer.risk_score;
                detail.customer_phone = customer.phone;
                detail.customer_pan = customer.pan_number;
                detail.customer_aadhaar = customer.aadhaar_number_masked;
                detail.customer_occupation = customer.occupation;
                detail.customer_income = customer.annual_income;
                detail.customer_address = customer.address;
              }
            } catch (custErr) {
              console.warn("Failed to fetch customer data:", custErr);
            }
          }
          setCaseDetails(detail);
        }
      } catch (err: any) {
        addToast(err.message || "Failed to load case details.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchDossier();
  }, [id, addToast]);

  const handleFreezeAccount = async () => {
    if (!id) return;
    setIsFreezing(true);
    try {
      const caseId = id;
      await apiClient.post(`/api/v1/cases/${encodeURIComponent(caseId)}/freeze-account`, {});
      addToast("Account has been frozen.", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to freeze account.", "error");
    } finally {
      setIsFreezing(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!id || !notes.trim()) return;
    setIsSaving(true);
    try {
      const caseId = id;
      await apiClient.post(`/api/v1/cases/${encodeURIComponent(caseId)}/notes`, {
        text: notes
      });
      addToast("Notes saved to vault.", "success");
      setNotes("");
    } catch (err: any) {
      addToast(err.message || "Failed to save notes.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = caseDetails?.customer_name || caseDetails?.subject_profile?.name || "Unknown Entity";
  const displayId = id.includes("c1c1") ? "ACC-092281" : id;
  const riskScore = caseDetails?.customer_risk_score !== undefined ? Math.round(caseDetails.customer_risk_score * 100) : 88;
  const totalAssets = caseDetails?.financial_telemetry?.total_inflow ?? 0;
  const totalOutflows = caseDetails?.financial_telemetry?.total_outflow ?? 0;
  const velocity = caseDetails?.financial_telemetry?.velocity_increase ?? 0;
  const avgBalance = caseDetails?.financial_telemetry?.current_balance ?? 0;

  return (
    <div className="relative min-h-screen bg-[#0F111A] text-on-surface font-body-sm selection:bg-primary/30 pb-10">
      <div className="flex flex-col xl:flex-row h-auto xl:h-[calc(100vh-20px)] overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-[#282a32] scrollbar-track-transparent">
          
          {/* Header Dashboard Grid */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            
            {/* Entity Dossier Block */}
            <div className="col-span-12 xl:col-span-8 flex flex-col bg-[#11131b] border border-[#282a32] rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
              
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 pb-5 border-b border-[#282a32]">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#1d1f27] to-[#11131b] border border-[#32343d] flex flex-shrink-0 items-center justify-center overflow-hidden shadow-inner">
                    <span className="material-symbols-outlined text-3xl text-outline-variant">person</span>
                  </div>
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-display-kpi font-bold text-on-surface tracking-tight truncate">{displayName}</h1>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${caseDetails?.customer_kyc_status === 'APPROVED' ? 'bg-[#16A34A]/20 text-[#16A34A] border-[#16A34A]/30' : 'bg-risk-high/20 text-risk-high border-risk-high/30'}`}>
                        {caseDetails?.customer_kyc_status === 'APPROVED' ? 'Verified Entity' : (caseDetails?.customer_kyc_status || 'Unverified')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-label-mono text-on-surface-variant font-medium">
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-all">
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    AI Summary
                  </button>
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1d1f27] border border-[#32343d] text-on-surface rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-[#282a32] transition-all">
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Export
                  </button>
                  <button 
                    onClick={handleFreezeAccount}
                    disabled={isFreezing}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-risk-critical/10 border border-risk-critical/40 text-risk-critical rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-risk-critical/20 transition-all shadow-[0_0_15px_rgba(220,38,38,0.15)] disabled:opacity-50">
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    {isFreezing ? "Freezing..." : "Freeze"}
                  </button>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 pt-5 z-10">
                <div>
                  <div className="text-[9px] font-label-mono text-outline-variant font-bold uppercase tracking-widest mb-1">Email</div>
                  <div className="text-xs text-on-surface font-medium truncate">{caseDetails?.customer_email || "N/A"}</div>
                </div>
                <div>
                  <div className="text-[9px] font-label-mono text-outline-variant font-bold uppercase tracking-widest mb-1">Phone</div>
                  <div className="text-xs text-on-surface font-medium truncate">{caseDetails?.customer_phone || "N/A"}</div>
                </div>
                <div>
                  <div className="text-[9px] font-label-mono text-outline-variant font-bold uppercase tracking-widest mb-1">PAN Number</div>
                  <div className="text-xs font-label-mono text-on-surface font-bold truncate">{caseDetails?.customer_pan || "N/A"}</div>
                </div>
                <div>
                  <div className="text-[9px] font-label-mono text-outline-variant font-bold uppercase tracking-widest mb-1">Aadhaar (Masked)</div>
                  <div className="text-xs font-label-mono text-on-surface font-bold truncate">{caseDetails?.customer_aadhaar || "N/A"}</div>
                </div>
                <div>
                  <div className="text-[9px] font-label-mono text-outline-variant font-bold uppercase tracking-widest mb-1">Occupation</div>
                  <div className="text-xs text-on-surface font-medium truncate">{caseDetails?.customer_occupation || "N/A"}</div>
                </div>
                <div>
                  <div className="text-[9px] font-label-mono text-outline-variant font-bold uppercase tracking-widest mb-1">Annual Income</div>
                  <div className="text-xs font-display-kpi text-[#16A34A] font-bold truncate">{caseDetails?.customer_income ? formatCurrency(caseDetails.customer_income, activeCase?.currency || "USD") : "N/A"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[9px] font-label-mono text-outline-variant font-bold uppercase tracking-widest mb-1">Registered Address</div>
                  <div className="text-xs text-on-surface font-medium truncate">{caseDetails?.customer_address || "N/A"}</div>
                </div>
              </div>
            </div>
            
            {/* Risk Scores Block */}
            <div className="col-span-12 xl:col-span-4 flex gap-4">
              <div className="flex-1 bg-[#11131b] border border-risk-critical/40 rounded-2xl p-4 flex flex-col justify-between shadow-[0_0_20px_rgba(220,38,38,0.05)] relative overflow-hidden group hover:border-risk-critical/60 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-risk-critical/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-risk-critical/15 transition-colors"></div>
                <h3 className="text-[10px] font-label-mono font-bold text-on-surface-variant uppercase tracking-widest z-10">Risk Score</h3>
                <div className="z-10 mt-2">
                  <div className="flex items-baseline gap-1 text-risk-critical">
                    <span className="font-display-kpi text-4xl font-black">{riskScore}</span>
                    <span className="font-label-mono text-sm font-bold text-risk-critical/70">/100</span>
                  </div>
                  <div className="text-[10px] font-bold text-risk-critical/80 uppercase tracking-widest mt-1">Critical Alert</div>
                </div>
              </div>
              
              <div className="flex-1 bg-[#11131b] border border-[#06b6d4]/40 rounded-2xl p-4 flex flex-col justify-between shadow-[0_0_20px_rgba(6,182,212,0.05)] relative overflow-hidden group hover:border-[#06b6d4]/60 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#06b6d4]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-[#06b6d4]/15 transition-colors"></div>
                <h3 className="text-[10px] font-label-mono font-bold text-on-surface-variant uppercase tracking-widest z-10">ML Probability</h3>
                <div className="z-10 mt-2">
                  <div className="flex items-baseline gap-1 text-[#06b6d4]">
                    <span className="font-display-kpi text-4xl font-black">92</span>
                    <span className="font-label-mono text-sm font-bold text-[#06b6d4]/70">%</span>
                  </div>
                  <div className="text-[10px] font-bold text-[#06b6d4]/80 uppercase tracking-widest mt-1">High Confidence</div>
                </div>
              </div>
            </div>
            
          </div>
          
          {/* Middle Row */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            
            {/* RK Behavioral Analysis */}
            <div className="col-span-12 xl:col-span-4 bg-[#11131b] border border-[#282a32] rounded-2xl p-5 shadow-lg flex flex-col">
              <h3 className="flex items-center gap-2 text-[11px] font-label-mono font-bold text-on-surface uppercase tracking-widest mb-4">
                <span className="material-symbols-outlined text-[16px] text-primary">psychology</span>
                RK AI Behavioral Analysis
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                "Pattern detection identifies extreme high-velocity throughput. Account exhibits classic 'mule' behavior: high-value incoming UPI bursts immediately followed by rapid ATM cash-outs and off-ledger transfers. No stable source of income detected over 90 days. Risk cluster associated with known 'Operation Ghost' fraud rings."
              </p>
            </div>
            
            {/* Transaction Flow Intelligence */}
            <div className="col-span-12 xl:col-span-8 bg-[#11131b] border border-[#282a32] rounded-2xl p-5 shadow-lg relative flex flex-col overflow-hidden">
              <h3 className="text-[11px] font-label-mono font-bold text-on-surface uppercase tracking-widest mb-2 z-10">
                Transaction Flow Intelligence
              </h3>
              <div className="absolute top-4 right-4 z-10">
                <button className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-outline hover:text-on-surface transition-colors border border-outline/30 px-2 py-1 rounded">
                  <span className="material-symbols-outlined text-[12px]">open_in_full</span> Expand
                </button>
              </div>
              <div className="flex-1 relative min-h-[120px] flex items-center justify-center">
                {/* Visual mock of the flow graph for this specific dashboard view */}
                <div className="flex items-center justify-between w-full max-w-[500px] mt-4 px-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-outline-variant outline outline-2 outline-offset-2 outline-outline/30"></div>
                    <span className="text-[8px] font-label-mono text-outline-variant uppercase tracking-widest">External Source</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-outline-variant/30 via-primary/50 to-primary relative mx-4 flex items-center justify-center">
                     <div className="w-1.5 h-1.5 rounded-full bg-primary absolute shadow-[0_0_8px_rgba(180,197,255,0.8)] animate-ping"></div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shadow-[0_0_15px_rgba(180,197,255,0.2)]">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    </div>
                    <span className="text-[8px] font-label-mono text-primary uppercase tracking-widest font-bold">Target Account</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-primary via-risk-critical/50 to-risk-critical/30 relative mx-4 flex items-center justify-center">
                     <div className="w-1.5 h-1.5 rounded-full bg-risk-critical absolute shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-ping" style={{ animationDelay: "0.5s"}}></div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-outline-variant outline outline-2 outline-offset-2 outline-outline/30"></div>
                    <span className="text-[8px] font-label-mono text-outline-variant uppercase tracking-widest">Target Endpoints</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div className="bg-[#11131b] border border-[#282a32] rounded-xl p-4 shadow-md">
              <div className="text-[9px] font-label-mono font-bold text-on-surface-variant uppercase tracking-widest mb-1">Total Assets (Avg)</div>
              <div className="text-xl font-display-kpi font-bold text-on-surface mb-1">{formatCurrency(totalAssets, activeCase?.currency || "USD")}</div>
              <div className="text-[9px] font-bold text-risk-high flex items-center gap-1 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[10px]">trending_up</span> +142% Spikes
              </div>
            </div>
            <div className="bg-[#11131b] border border-[#282a32] rounded-xl p-4 shadow-md">
              <div className="text-[9px] font-label-mono font-bold text-on-surface-variant uppercase tracking-widest mb-1">Total Outflows</div>
              <div className="text-xl font-display-kpi font-bold text-[#16A34A] mb-1">{formatCurrency(totalOutflows, activeCase?.currency || "USD")}</div>
              <div className="text-[9px] font-bold text-[#16A34A] flex items-center gap-1 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[10px]">update</span> In 15 min Window
              </div>
            </div>
            <div className="bg-[#11131b] border border-[#282a32] rounded-xl p-4 shadow-md">
              <div className="text-[9px] font-label-mono font-bold text-on-surface-variant uppercase tracking-widest mb-1">Velocity Index</div>
              <div className="text-xl font-display-kpi font-bold text-on-surface mb-1">{velocity}<span className="text-xs text-outline font-label-mono">/10</span></div>
              <div className="text-[9px] font-bold text-outline-variant uppercase tracking-wider">High Frequency Burst</div>
            </div>
            <div className="bg-[#11131b] border border-[#282a32] rounded-xl p-4 shadow-md">
              <div className="text-[9px] font-label-mono font-bold text-on-surface-variant uppercase tracking-widest mb-1">Avg. Balance</div>
              <div className="text-xl font-display-kpi font-bold text-on-surface mb-1">${avgBalance.toFixed(2)}</div>
              <div className="text-[9px] font-bold text-outline-variant uppercase tracking-wider">Rapid Depletion Cycle</div>
            </div>
          </div>
          
          {/* Bottom Grid */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* Left Column (Table & Chart) */}
            <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
              
              {/* Volume Spikes Chart */}
              <div className="bg-[#11131b] border border-[#282a32] rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-[11px] font-label-mono font-bold text-on-surface uppercase tracking-widest">Volume Spikes</h3>
                    <p className="text-[10px] text-outline-variant mt-1">Transaction volume anomaly detection over time.</p>
                  </div>
                </div>
                <div className="h-48">
                  <TimelineChart data={timelineData} />
                </div>
              </div>

              {/* Transaction Table */}
              <div className="bg-[#11131b] border border-[#282a32] rounded-2xl p-5 shadow-lg flex-1">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-[11px] font-label-mono font-bold text-on-surface uppercase tracking-widest">Transaction Intelligence</h3>
                    <p className="text-[10px] text-outline-variant mt-1">Detailed ledger analysis and ML flagging for this entity.</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-outline bg-[#1d1f27] border border-[#32343d] px-3 py-1.5 rounded-lg hover:text-on-surface transition-colors">
                      <span className="material-symbols-outlined text-[14px]">filter_list</span> Filter
                    </button>
                    <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-outline bg-[#1d1f27] border border-[#32343d] px-3 py-1.5 rounded-lg hover:text-on-surface transition-colors">
                      <span className="material-symbols-outlined text-[14px]">search</span> Search
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-[#282a32] text-[9px] font-label-mono uppercase tracking-widest text-outline-variant font-bold">
                        <th className="py-3 px-3 font-medium">Type</th>
                        <th className="py-3 px-3 font-medium">Date & Time</th>
                        <th className="py-3 px-3 font-medium">Reference ID</th>
                        <th className="py-3 px-3 font-medium">Description</th>
                        <th className="py-3 px-3 font-medium text-right">Amount</th>
                        <th className="py-3 px-3 font-medium text-center">AI Flag</th>
                        <th className="py-3 px-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#282a32]/50 text-[11px] font-medium text-on-surface">
                      <tr className="hover:bg-[#191b23] transition-colors group cursor-pointer">
                        <td className="py-3 px-3">
                          <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center">
                            <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-label-mono text-outline-variant text-[10px]">2023-11-20<br/>14:25:10</td>
                        <td className="py-3 px-3 font-label-mono text-[10px]">UPI/TXN/882199</td>
                        <td className="py-3 px-3">Inbound Transfer via<br/><span className="text-outline-variant">Unknown App</span></td>
                        <td className="py-3 px-3 text-right text-[#16A34A] font-bold font-label-mono">+$4,500.00</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20 shadow-sm">Layering</span>
                        </td>
                        <td className="py-3 px-3 text-right text-outline group-hover:text-primary transition-colors"><span className="material-symbols-outlined text-[18px]">arrow_forward</span></td>
                      </tr>
                      <tr className="hover:bg-[#191b23] transition-colors group cursor-pointer">
                        <td className="py-3 px-3">
                          <div className="w-8 h-8 rounded-full bg-risk-high/10 text-risk-high flex items-center justify-center">
                            <span className="material-symbols-outlined text-[16px]">local_atm</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-label-mono text-outline-variant text-[10px]">2023-11-20<br/>14:26:05</td>
                        <td className="py-3 px-3 font-label-mono text-[10px]">ATM/WD/1992</td>
                        <td className="py-3 px-3">Cash Withdrawal - Mumbai<br/><span className="text-outline-variant">E.</span></td>
                        <td className="py-3 px-3 text-right text-on-surface font-bold font-label-mono">-$1,450.00</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-risk-critical/10 text-risk-critical border border-risk-critical/20 shadow-sm">Smurfing</span>
                        </td>
                        <td className="py-3 px-3 text-right text-outline group-hover:text-primary transition-colors"><span className="material-symbols-outlined text-[18px]">arrow_forward</span></td>
                      </tr>
                      <tr className="hover:bg-[#191b23] transition-colors group cursor-pointer">
                        <td className="py-3 px-3">
                          <div className="w-8 h-8 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center">
                            <span className="material-symbols-outlined text-[16px]">payments</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-label-mono text-outline-variant text-[10px]">2023-11-19<br/>09:10:12</td>
                        <td className="py-3 px-3 font-label-mono text-[10px]">UPI/TXN/771822</td>
                        <td className="py-3 px-3">Structuring Attempt<br/><span className="text-outline-variant">Cluster</span></td>
                        <td className="py-3 px-3 text-right text-[#16A34A] font-bold font-label-mono">+$9,900.00</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20 shadow-sm">Structuring</span>
                        </td>
                        <td className="py-3 px-3 text-right text-outline group-hover:text-primary transition-colors"><span className="material-symbols-outlined text-[18px]">arrow_forward</span></td>
                      </tr>
                      <tr className="hover:bg-[#191b23] transition-colors group cursor-pointer">
                        <td className="py-3 px-3">
                          <div className="w-8 h-8 rounded-full bg-[#a855f7]/10 text-[#a855f7] flex items-center justify-center">
                            <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-label-mono text-outline-variant text-[10px]">2023-11-18<br/>23:45:00</td>
                        <td className="py-3 px-3 font-label-mono text-[10px]">BLL/CR/66120</td>
                        <td className="py-3 px-3">Merchant Payback<br/><span className="text-outline-variant">(Simulated)</span></td>
                        <td className="py-3 px-3 text-right text-[#16A34A] font-bold font-label-mono">+$2,200.00</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20 shadow-sm">Circular Flow</span>
                        </td>
                        <td className="py-3 px-3 text-right text-outline group-hover:text-primary transition-colors"><span className="material-symbols-outlined text-[18px]">arrow_forward</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Account Timeline */}
              <div className="bg-[#11131b] border border-[#282a32] rounded-2xl p-5 shadow-lg h-[220px] flex flex-col">
                <h3 className="text-[11px] font-label-mono font-bold text-on-surface uppercase tracking-widest mb-2">Account Timeline (Activity Spikes)</h3>
                <div className="flex-1 w-full h-full min-h-[150px]">
                  <TimelineChart data={timelineData} />
                </div>
              </div>
              
            </div>
            
            {/* Right Column (Indicators & Intel) */}
            <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
              
              {/* Risk Indicators */}
              <div className="bg-[#11131b] border border-risk-high/30 rounded-2xl p-5 shadow-[0_0_15px_rgba(249,115,22,0.03)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-risk-high/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                <h3 className="flex items-center gap-2 text-[11px] font-label-mono font-bold text-risk-high uppercase tracking-widest mb-4 z-10 relative">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  Risk Indicators
                </h3>
                
                <div className="flex flex-col gap-3 z-10 relative">
                  <div className="flex justify-between items-center bg-[#191b23] px-3 py-2.5 rounded-lg border border-[#282a32]">
                    <span className="text-xs font-semibold text-on-surface">Rapid ATM Cash-Out</span>
                    <span className="px-2 py-0.5 bg-risk-critical text-white text-[8px] font-bold uppercase tracking-wider rounded">98%</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#191b23] px-3 py-2.5 rounded-lg border border-[#282a32]">
                    <span className="text-xs font-semibold text-on-surface">Structuring Index</span>
                    <span className="px-2 py-0.5 bg-risk-high text-white text-[8px] font-bold uppercase tracking-wider rounded">84%</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#191b23] px-3 py-2.5 rounded-lg border border-[#282a32]">
                    <span className="text-xs font-semibold text-on-surface">Dark Web Exposure</span>
                    <span className="px-2 py-0.5 bg-[#a855f7] text-white text-[8px] font-bold uppercase tracking-wider rounded">MATCH</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#191b23] px-3 py-2.5 rounded-lg border border-[#282a32]">
                    <span className="text-xs font-semibold text-on-surface">Device Fingerprint</span>
                    <span className="px-2 py-0.5 bg-outline-variant text-on-surface text-[8px] font-bold uppercase tracking-wider rounded">Cloned</span>
                  </div>
                </div>
              </div>
              
              {/* Police Intelligence */}
              <div className="bg-[#11131b] border border-[#06b6d4]/30 rounded-2xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.03)] flex-1 relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#06b6d4]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                <h3 className="flex items-center gap-2 text-[11px] font-label-mono font-bold text-[#06b6d4] uppercase tracking-widest mb-4 z-10 relative">
                  <span className="material-symbols-outlined text-[16px]">local_police</span>
                  Police Intelligence
                </h3>
                
                <div className="space-y-4 z-10 relative flex-1 flex flex-col">
                  <div>
                    <div className="text-[9px] font-label-mono text-outline-variant font-bold uppercase tracking-widest mb-0.5">FIR CASE NUMBER</div>
                    <div className="text-xs font-bold text-[#06b6d4]">FIR-MUM-49-2023</div>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <div className="text-[9px] font-label-mono text-outline-variant font-bold uppercase tracking-widest mb-0.5">STATUS</div>
                      <div className="text-xs font-bold text-on-surface">Investigation</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-label-mono text-outline-variant font-bold uppercase tracking-widest mb-0.5">PRIORITY</div>
                      <div className="text-xs font-bold text-risk-high">P1 - HIGH</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-label-mono text-outline-variant font-bold uppercase tracking-widest mb-0.5">LEAD OFFICER</div>
                    <div className="text-xs font-bold text-on-surface">Inspector Rajesh V.</div>
                  </div>
                  
                  <div className="mt-auto pt-4">
                    <button className="w-full py-2.5 border border-[#06b6d4]/40 bg-[#06b6d4]/10 text-[#06b6d4] text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-[#06b6d4]/20 transition-colors">
                      Open Police Portal
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Linked Entities */}
              <div className="bg-[#11131b] border border-[#282a32] rounded-2xl p-5 shadow-lg">
                <h3 className="text-[11px] font-label-mono font-bold text-on-surface uppercase tracking-widest mb-3">Linked Entities (3)</h3>
                <div className="flex gap-2 mb-3">
                  <div className="w-8 h-8 rounded bg-[#1d1f27] border border-[#32343d] flex items-center justify-center text-xs font-bold text-outline-variant">JS</div>
                  <div className="w-8 h-8 rounded bg-[#1d1f27] border border-[#32343d] flex items-center justify-center text-xs font-bold text-outline-variant">MR</div>
                  <div className="w-8 h-8 rounded bg-[#1d1f27] border border-[#32343d] flex items-center justify-center text-xs font-bold text-outline-variant">AK</div>
                </div>
                <p className="text-[10px] text-outline-variant leading-relaxed">
                  These entities share the same physical address and IP subnet during cash-out bursts.
                </p>
              </div>
              
            </div>
            
          </div>
        </div>

        {/* Investigation Panel (Right Sidebar) */}
        <div className="w-full xl:w-[320px] bg-[#11131b] border-t xl:border-t-0 xl:border-l border-[#282a32] flex flex-col flex-shrink-0 relative">
          <div className="p-5 border-b border-[#282a32] flex justify-between items-start">
            <div>
              <h2 className="text-[13px] font-label-mono font-bold text-on-surface uppercase tracking-widest mb-1">Investigation Panel</h2>
              <div className="flex items-center gap-1.5 text-[9px] font-label-mono font-bold uppercase tracking-widest">
                <span className="text-primary">CASE {id.substring(0, 7)}</span>
                <span className="text-outline-variant">|</span>
                <span className="text-risk-low">ACTIVE</span>
              </div>
            </div>
            <button className="text-outline hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-[#282a32] scrollbar-track-transparent">
            
            {/* Officer Assigned */}
            <div>
              <h3 className="text-[9px] font-label-mono font-bold text-outline-variant uppercase tracking-widest mb-2">Officer Assigned</h3>
              <div className="bg-[#191b23] border border-[#282a32] rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30 flex items-center justify-center text-xs font-bold">
                  SK
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface">Sgt. Karthik</div>
                  <div className="text-[10px] text-outline-variant">Cyber Cell Unit 4</div>
                </div>
                <button className="ml-auto text-outline hover:text-on-surface">
                  <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                </button>
              </div>
            </div>
            
            {/* Evidence Vault */}
            <div>
              <h3 className="text-[9px] font-label-mono font-bold text-outline-variant uppercase tracking-widest mb-2">Evidence Vault</h3>
              <div className="space-y-2">
                <div className="bg-[#191b23] border border-[#282a32] rounded-lg p-3 flex items-center gap-3 hover:border-outline-variant/50 cursor-pointer transition-colors">
                  <span className="material-symbols-outlined text-primary text-[18px]">description</span>
                  <span className="text-[11px] font-medium text-on-surface flex-1 truncate">Aadhaar_Masked.pdf</span>
                  <span className="material-symbols-outlined text-[14px] text-outline">download</span>
                </div>
                <div className="bg-[#191b23] border border-[#282a32] rounded-lg p-3 flex items-center gap-3 hover:border-outline-variant/50 cursor-pointer transition-colors">
                  <span className="material-symbols-outlined text-primary text-[18px]">description</span>
                  <span className="text-[11px] font-medium text-on-surface flex-1 truncate">Bank_Statement_Q3.csv</span>
                  <span className="material-symbols-outlined text-[14px] text-outline">download</span>
                </div>
              </div>
            </div>
            
            {/* Notes */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-[9px] font-label-mono font-bold text-outline-variant uppercase tracking-widest mb-2">Notes</h3>
              <textarea 
                className="w-full h-[150px] bg-[#191b23] border border-[#282a32] rounded-xl p-3 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors resize-none mb-3 placeholder:text-outline/50"
                placeholder="Add investigation notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
              <button 
                onClick={handleSaveNotes}
                disabled={isSaving || !notes.trim()}
                className="w-full py-2.5 bg-[#d8b4fe]/20 text-[#d8b4fe] border border-[#d8b4fe]/30 font-bold text-[10px] uppercase tracking-wider rounded-xl hover:bg-[#d8b4fe]/30 transition-colors mt-auto disabled:opacity-50">
                {isSaving ? "Saving..." : "Save to Vault"}
              </button>
            </div>
          </div>
          
          {/* Floating Timeline History Button */}
          <div className="absolute bottom-6 right-6">
             <button className="bg-risk-critical text-white border border-risk-critical shadow-[0_0_15px_rgba(220,38,38,0.3)] px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-risk-critical/90 transition-all">
                <span className="material-symbols-outlined text-[14px]">history</span>
                Timeline History
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}
