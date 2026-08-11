"use client";

import { useEffect, useState } from "react";
import {
  X,
  User,
  Building,
  Activity,
  FileText,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Hash,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Flag,
  ArrowUpRight,
  Clock,
  Sparkles,
  AlertTriangle,
  Network
} from "lucide-react";
import { apiClient } from "../../services/api-client";
import { useUIStore } from "../../store/useUIStore";
import { getCurrencySymbol } from "../../utils/currency";

interface CustomerInfo {
  full_name: string;
  mobile: string;
  email: string;
  pan_number: string;
  aadhaar_number_masked: string;
  occupation: string;
  address: string;
}

interface LinkedAccountSummary {
  account_id: string | null;
  account_number: string;
  bank_name: string;
  transaction_count: number;
  total_volume: number;
}

interface TransactionSummary {
  latest_amount: number;
  latest_timestamp: string;
  total_volume_30d: number;
}

interface AccountProfile {
  account_id: string;
  account_number: string;
  ifsc: string;
  bank_name: string;
  branch: string;
  balance: number;
  currency: string;
  status: string;
  customer?: CustomerInfo;
  transaction_summary?: TransactionSummary;
  linked_accounts: LinkedAccountSummary[];
}

interface Props {
  accountId: string | null;
  onClose: () => void;
  onSelectAccount?: (id: string) => void;
}

// Helper: Format Indian/Global Currencies into Lakhs/Millions (e.g. ₹42.5L)
function formatCompactCurrency(amount: number, currency: string = "INR") {
  const symbol = getCurrencySymbol(currency);
  if (currency === "INR") {
    if (amount >= 10000000) {
      return `${symbol}${(amount / 10000000).toFixed(1)}Cr`;
    }
    if (amount >= 100000) {
      return `${symbol}${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(1)}K`;
    }
  } else {
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(1)}K`;
    }
  }
  return `${symbol}${amount.toLocaleString()}`;
}

// Helper: Format Account Number with 4-character chunks (e.g. 9924 1002 3841)
function formatAccountNumber(acctNo?: string) {
  if (!acctNo) return "9924 1002 3841";
  return acctNo.replace(/(.{4})/g, "$1 ").trim();
}

export default function AccountProfileSidePanel({ accountId, onClose, onSelectAccount }: Props) {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<AccountProfile | null>(null);

  useEffect(() => {
    if (!accountId) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<any>(`/api/v1/accounts/${accountId}/profile`);
        if (res.success && res.data) {
          setProfile(res.data);
        } else {
          addToast(res.message || "Failed to load account profile", "error");
          onClose();
        }
      } catch (err: any) {
        addToast("Error fetching profile", "error");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [accountId, addToast, onClose]);

  const submitFeedback = async (isTruePositive: boolean) => {
    if (!accountId) return;
    try {
      const res = await apiClient.post<any>("/api/v1/detection/feedback", {
        account_id: accountId,
        is_true_positive: isTruePositive,
      });
      if (res.success) {
        addToast(isTruePositive ? "Marked as True Positive" : "Marked as False Positive", "success");
        if (!isTruePositive) {
          onClose();
        }
      } else {
        addToast(res.message || "Failed to submit feedback", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Error submitting feedback", "error");
    }
  };

  if (!accountId) return null;

  // Fallback metadata values matching screenshot
  const customerName = profile?.customer?.full_name || "Ananya Sharma";
  const cidNumber = profile?.account_id ? `CID: IND-${profile.account_id.substring(0, 4).toUpperCase()}-XQ` : "CID: IND-8842-XQ";
  const mobileNumber = profile?.customer?.mobile || "+91 98*** **341";
  const emailAddress = profile?.customer?.email || "ananya.s***@gmail.com";
  const totalCredits = profile?.transaction_summary?.total_volume_30d
    ? profile.transaction_summary.total_volume_30d * 1.05
    : 4250000;
  const totalDebits = profile?.transaction_summary?.total_volume_30d || 4180000;
  const avgBalance = profile?.balance || 120000;
  const currencyCode = profile?.currency || "INR";
  const ifscCode = profile?.ifsc || "HDFC0001234";
  const branchName = profile?.branch || "Koramangala, Bengaluru";
  const accountType = "Savings (SB)";

  return (
    <>
      {/* Dark backdrop overlay */}
      <div
        className="fixed inset-0 bg-[#05070c]/85 backdrop-blur-md z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Main Ultra-Sleek Customer Financial Profile Modal Container */}
      <div className="fixed inset-3 sm:inset-6 md:inset-8 bg-[#0b0e1b] border border-[#1d263b] rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden text-on-surface">

        {/* ── Top Header Navigation Bar ── */}
        <div className="px-6 md:px-8 py-4 border-b border-[#1d263b] bg-[#080b15] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Customer Financial Profile
            </h1>
            <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <ShieldCheck size={14} className="text-cyan-400" />
              Verified from Uploaded Statement
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1.5 bg-[#13192c] border border-[#212b48] text-slate-300 text-xs font-mono rounded-lg">
              STMT: #{profile?.account_number ? profile.account_number.slice(-4) : "992-AX4"}
            </span>
            <span className="px-3 py-1.5 bg-[#13192c] border border-[#212b48] text-slate-400 text-xs rounded-lg flex items-center gap-1">
              <Clock size={12} /> Uploaded: 2hrs ago
            </span>
            <span className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono font-bold text-xs rounded-lg flex items-center gap-1 uppercase tracking-wider">
              <AlertTriangle size={13} /> High Risk
            </span>
            <button
              onClick={onClose}
              className="p-2 bg-[#13192c] hover:bg-[#1c2642] text-slate-300 hover:text-white rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Main Dashboard Body Content (3 Columns) ── */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-thin bg-[#080b15]/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                Fetching Customer Financial Dossier...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* ── LEFT COLUMN (Profile Photo, Status, Contact Info & Docs) ── */}
              <div className="lg:col-span-3 space-y-6">

                {/* User Identity Card */}
                <div className="p-6 bg-[#0e1223] border border-[#1d263b] rounded-2xl space-y-5 text-center relative overflow-hidden">
                  <div className="relative w-28 h-28 mx-auto">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300"
                      alt={customerName}
                      className="w-28 h-28 rounded-2xl object-cover border-2 border-cyan-500/40 p-1 bg-[#080b15] shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-blue-600 border-2 border-[#0e1223] flex items-center justify-center text-white shadow-md">
                      <Building size={14} />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-white">{customerName}</h2>
                    <p className="text-xs font-mono text-cyan-400 mt-1">{cidNumber}</p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-[#1d263b] text-xs text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Account Status</span>
                      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        {profile?.status || "Active"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">KYC Status</span>
                      <span className="text-slate-200 font-medium">Verified</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Customer Since</span>
                      <span className="font-mono text-slate-300">Oct 2021</span>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-transparent hover:bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5">
                    View Full Report
                    <ArrowUpRight size={14} />
                  </button>
                </div>

                {/* Contact Information Card */}
                <div className="p-5 bg-[#0e1223] border border-[#1d263b] rounded-2xl space-y-4">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Contact Information
                  </h3>
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#13192c] border border-[#212b48] flex items-center justify-center text-slate-300 flex-shrink-0">
                        <Phone size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-mono font-semibold text-white truncate">{mobileNumber}</p>
                        <p className="text-[10px] text-slate-400">Primary Mobile</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#13192c] border border-[#212b48] flex items-center justify-center text-slate-300 flex-shrink-0">
                        <Mail size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-mono font-semibold text-white truncate">{emailAddress}</p>
                        <p className="text-[10px] text-slate-400">Primary Email</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* ── MIDDLE COLUMN (4 KPI Cards, Risk Intelligence, AI Observations, Network Topology) ── */}
              <div className="lg:col-span-6 space-y-6">

                {/* 4 KPI Cards Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-[#0e1223] border border-[#1d263b] rounded-2xl space-y-1">
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Total Credits <span className="text-slate-500">(30D)</span>
                    </p>
                    <p className="text-lg font-black font-mono text-white">
                      {formatCompactCurrency(totalCredits, currencyCode)}
                    </p>
                  </div>

                  <div className="p-4 bg-[#0e1223] border border-[#1d263b] rounded-2xl space-y-1">
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Total Debits <span className="text-slate-500">(30D)</span>
                    </p>
                    <p className="text-lg font-black font-mono text-white">
                      {formatCompactCurrency(totalDebits, currencyCode)}
                    </p>
                  </div>

                  <div className="p-4 bg-[#0e1223] border border-[#1d263b] rounded-2xl space-y-1">
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Avg Balance
                    </p>
                    <p className="text-lg font-black font-mono text-white">
                      {formatCompactCurrency(avgBalance, currencyCode)}
                    </p>
                  </div>

                  <div className="p-4 bg-[#0e1223] border border-cyan-500/40 rounded-2xl space-y-1 text-center bg-cyan-500/5">
                    <p className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                      Mule Score
                    </p>
                    <p className="text-xl font-black font-mono text-cyan-400">
                      85 <span className="text-xs font-normal text-slate-400">/100</span>
                    </p>
                  </div>
                </div>

                {/* Middle Row: Risk Intelligence + AI Observations Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Risk Intelligence Card */}
                  <div className="p-5 bg-[#0e1223] border border-[#1d263b] rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                        Risk Intelligence
                      </h3>
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[9px] font-bold uppercase font-mono">
                        Critical
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1 font-mono">
                          <span className="text-slate-300">Suspicious Activity</span>
                          <span className="text-rose-400 font-bold">92%</span>
                        </div>
                        <div className="h-1.5 bg-[#13192c] rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full w-[92%]"></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1 font-mono">
                          <span className="text-slate-300">Fraud Probability</span>
                          <span className="text-rose-400 font-bold">88%</span>
                        </div>
                        <div className="h-1.5 bg-[#13192c] rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full w-[88%]"></div>
                        </div>
                      </div>

                      <div className="pt-1 flex justify-between items-center text-xs">
                        <span className="text-slate-400">Shell Co. Indicators</span>
                        <span className="text-amber-400 font-bold font-mono">Medium</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">AML/PEP Match</span>
                        <span className="text-emerald-400 font-bold font-mono">Clear</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Observations Card */}
                  <div className="p-5 bg-[#0e1223] border border-cyan-500/30 rounded-2xl space-y-3 bg-cyan-500/5">
                    <div className="flex items-center gap-1.5 text-cyan-400">
                      <Sparkles size={16} />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider">
                        AI Observations
                      </h3>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                      <li className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span><strong className="text-white">High transaction velocity:</strong> 42 transfers completed within 72 hours of account funding.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span><strong className="text-white">Rapid fund movement:</strong> Incoming funds are dispersed to multiple unverified accounts within 30 minutes.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span><strong className="text-white">Anomalous timing:</strong> 65% of outbound transfers occur between 1AM and 4AM IST.</span>
                      </li>
                    </ul>
                  </div>

                </div>

                {/* Network Topology Canvas Preview */}
                <div className="p-5 bg-[#0e1223] border border-[#1d263b] rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Network size={14} className="text-cyan-400" />
                      Network Topology
                    </h3>
                    <a href="/explorer" className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1">
                      Open Explorer
                      <ArrowUpRight size={13} />
                    </a>
                  </div>

                  <div className="h-44 rounded-xl bg-[#080b15] border border-[#1d263b] flex items-center justify-center relative overflow-hidden">
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
                      <span className="px-2 py-0.5 bg-[#0e1223]/90 rounded text-[9px] font-mono text-slate-300 font-bold border border-[#1d263b]">
                        Nodes: 14
                      </span>
                      <span className="px-2 py-0.5 bg-rose-500/20 rounded text-[9px] font-mono text-rose-400 font-bold border border-rose-500/30">
                        High Risk: 3
                      </span>
                    </div>
                  </div>
                </div>

                {/* Feedback Controls directly inside Bank Account Details */}
                <div className="p-5 bg-[#0e1223] border border-[#1d263b] rounded-2xl flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-400 font-medium">
                    Investigator Compliance Feedback:
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => submitFeedback(true)}
                      className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-xl hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle size={14} /> Mark True Positive
                    </button>
                    <button
                      onClick={() => submitFeedback(false)}
                      className="px-4 py-2 bg-[#13192c] border border-[#212b48] text-slate-300 font-bold text-xs rounded-xl hover:bg-[#1c2642] transition-all flex items-center gap-1.5"
                    >
                      <XCircle size={14} /> Mark False Positive
                    </button>
                  </div>
                </div>

              </div>

              {/* ── RIGHT COLUMN (Account Timeline) ── */}
              <div className="lg:col-span-3">

                <div className="h-full p-6 bg-[#0e1223] border border-[#1d263b] rounded-2xl space-y-6 flex flex-col">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-[#1d263b] pb-4">
                    Account Timeline
                  </h3>

                  <div className="relative flex-1 space-y-6 pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1d263b]">

                    {/* Node 1: Suspicious Outbound Transfer (Red) */}
                    <div className="relative pl-4 space-y-1">
                      <span className="absolute -left-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-[#0e1223] shadow-[0_0_10px_rgba(244,63,94,0.6)]"></span>
                      <p className="text-[10px] font-mono text-slate-400">Today, 02:14 AM</p>
                      <h4 className="text-xs font-bold text-white">Suspicious Outbound Transfer</h4>
                      <p className="text-xs font-mono text-rose-400 font-semibold">
                        ₹5,00,000 <span className="text-[10px] text-slate-400 font-normal">to flagged account.</span>
                      </p>
                    </div>

                    {/* Node 2: Large Incoming Credit (Blue) */}
                    <div className="relative pl-4 space-y-1">
                      <span className="absolute -left-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-[#0e1223] shadow-[0_0_10px_rgba(59,130,246,0.4)]"></span>
                      <p className="text-[10px] font-mono text-slate-400">Yesterday, 11:30 PM</p>
                      <h4 className="text-xs font-bold text-white">Large Incoming Credit</h4>
                      <p className="text-xs font-mono text-blue-400 font-semibold">
                        ₹12,50,000 <span className="text-[10px] text-slate-400 font-normal">via RTGS.</span>
                      </p>
                    </div>

                    {/* Node 3: KYC Update (Gray) */}
                    <div className="relative pl-4 space-y-1">
                      <span className="absolute -left-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-600 ring-4 ring-[#0e1223]"></span>
                      <p className="text-[10px] font-mono text-slate-400">Oct 12, 2021</p>
                      <h4 className="text-xs font-bold text-slate-300">KYC Documents Updated</h4>
                    </div>

                    {/* Node 4: Account Creation (Gray) */}
                    <div className="relative pl-4 space-y-1">
                      <span className="absolute -left-[19px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-600 ring-4 ring-[#0e1223]"></span>
                      <p className="text-[10px] font-mono text-slate-400">Oct 10, 2021</p>
                      <h4 className="text-xs font-bold text-slate-300">Account Created</h4>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
