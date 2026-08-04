"use client";

import { useEffect, useState } from "react";
import { X, User, Building, Activity, FileText, Phone, Mail, MapPin, Briefcase, Hash, Link as LinkIcon, AlertCircle, CheckCircle, XCircle } from "lucide-react";
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

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Side panel */}
      <div className={`fixed top-0 right-0 h-full w-[450px] max-w-full bg-surface-container-low border-l border-outline-variant/30 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${accountId ? "translate-x-0" : "translate-x-full"}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-high/50">
          <div>
            <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
              <User size={20} className="text-primary" />
              Account Profile
            </h2>
            <p className="text-xs text-on-surface-variant font-label-mono mt-1">
              ID: {profile?.account_number || "Loading..."}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-surface-container hover:bg-surface-container-highest rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-on-surface-variant animate-pulse">
              <Activity className="animate-spin text-primary" size={24} />
              <span className="text-sm">Fetching detailed dossier...</span>
            </div>
          ) : profile ? (
            <>
              {/* Account Summary Card */}
              <div className="p-5 bg-surface-container-highest/30 rounded-2xl border border-outline-variant/20 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                      <Building size={12} /> {profile.bank_name}
                    </p>
                    <h3 className="text-2xl font-label-mono font-black text-on-surface">
                      {profile.account_number}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${profile.status === 'ACTIVE' ? 'bg-risk-low/20 text-risk-low' : 'bg-risk-critical/20 text-risk-critical'}`}>
                    {profile.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">Ledger Balance</p>
                    <p className="font-label-mono font-bold text-primary">
                      {getCurrencySymbol(profile.currency)}{profile.balance.toLocaleString()} <span className="text-[10px] text-on-surface-variant">{profile.currency}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">IFSC Code</p>
                    <p className="font-label-mono font-bold text-on-surface">{profile.ifsc}</p>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              {profile.customer ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-2">
                    <User size={16} className="text-secondary" />
                    Customer Identity
                  </h4>
                  <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10 space-y-3 text-sm">
                    <div className="flex gap-3">
                      <User size={16} className="text-on-surface-variant mt-0.5" />
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold">Full Name</p>
                        <p className="font-bold text-on-surface">{profile.customer.full_name}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex gap-3">
                        <Phone size={16} className="text-on-surface-variant mt-0.5" />
                        <div>
                          <p className="text-[10px] text-on-surface-variant uppercase font-bold">Mobile</p>
                          <p className="font-label-mono text-on-surface">{profile.customer.mobile}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Mail size={16} className="text-on-surface-variant mt-0.5" />
                        <div>
                          <p className="text-[10px] text-on-surface-variant uppercase font-bold">Email</p>
                          <p className="text-on-surface text-xs truncate max-w-[120px]" title={profile.customer.email}>{profile.customer.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-t border-outline-variant/10 pt-3">
                      <div className="flex gap-3">
                        <FileText size={16} className="text-on-surface-variant mt-0.5" />
                        <div>
                          <p className="text-[10px] text-on-surface-variant uppercase font-bold">PAN / Tax ID</p>
                          <p className="font-label-mono text-on-surface text-xs">{profile.customer.pan_number}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Hash size={16} className="text-on-surface-variant mt-0.5" />
                        <div>
                          <p className="text-[10px] text-on-surface-variant uppercase font-bold">CKYC / Aadhaar</p>
                          <p className="font-label-mono text-on-surface text-xs">{profile.customer.aadhaar_number_masked}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 border-t border-outline-variant/10 pt-3">
                      <Briefcase size={16} className="text-on-surface-variant mt-0.5" />
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold">Occupation</p>
                        <p className="text-on-surface text-xs">{profile.customer.occupation}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 border-t border-outline-variant/10 pt-3">
                      <MapPin size={16} className="text-on-surface-variant mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold">Registered Address</p>
                        <p className="text-on-surface text-xs">{profile.customer.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-risk-medium/10 border border-risk-medium/20 rounded-xl flex items-center gap-3 text-risk-medium text-sm">
                  <AlertCircle size={18} />
                  Customer identity profile is unavailable or synthetic.
                </div>
              )}

              {/* Transaction Summary */}
              {profile.transaction_summary && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-2">
                    <Activity size={16} className="text-tertiary" />
                    Activity Summary (30d)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10 text-center">
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">Total Volume</p>
                      <p className="text-lg font-label-mono font-black text-on-surface">
                        {getCurrencySymbol(profile.currency)}{profile.transaction_summary.total_volume_30d.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10 text-center">
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">Latest Txn</p>
                      <p className="text-sm font-label-mono font-bold text-on-surface">
                        {getCurrencySymbol(profile.currency)}{profile.transaction_summary.latest_amount.toLocaleString()}
                      </p>
                      <p className="text-[9px] text-on-surface-variant mt-1">
                        {new Date(profile.transaction_summary.latest_timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Linked Accounts */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-2">
                  <LinkIcon size={16} className="text-secondary" />
                  Linked Counterparties
                </h4>
                {profile.linked_accounts.length > 0 ? (
                  <div className="space-y-2">
                    {profile.linked_accounts.map((acc, i) => (
                      <div 
                        key={i} 
                        className={`flex justify-between items-center p-3 bg-surface-container hover:bg-surface-container-highest transition-colors rounded-xl border border-outline-variant/10 ${acc.account_id ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (acc.account_id && onSelectAccount) {
                            onSelectAccount(acc.account_id);
                          }
                        }}
                      >
                        <div>
                          <p className="text-xs font-label-mono font-bold text-on-surface">{acc.account_number}</p>
                          <p className="text-[10px] text-on-surface-variant">{acc.bank_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-label-mono font-bold text-primary">{getCurrencySymbol(profile.currency)}{acc.total_volume.toLocaleString()}</p>
                          <p className="text-[10px] text-on-surface-variant">{acc.transaction_count} txns</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant text-center py-4 bg-surface-container/50 rounded-xl border border-outline-variant/10">
                    No recent linked counterparties found.
                  </p>
                )}
              </div>

              {/* Feedback Loop Section */}
              <div className="space-y-4 pt-4 border-t border-outline-variant/20">
                <h4 className="text-sm font-black text-on-surface flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary" />
                  Model Feedback
                </h4>
                <p className="text-xs text-on-surface-variant">Is this flag accurate? Your feedback retrains the detection engine.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => submitFeedback(true)}
                    className="flex-1 py-2 px-4 bg-risk-high/10 hover:bg-risk-high/20 border border-risk-high/30 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-risk-high transition-colors"
                  >
                    <CheckCircle size={16} /> True Positive
                  </button>
                  <button 
                    onClick={() => submitFeedback(false)}
                    className="flex-1 py-2 px-4 bg-surface-container-highest hover:bg-outline-variant/20 border border-outline-variant/30 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-on-surface-variant transition-colors"
                  >
                    <XCircle size={16} /> False Positive
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-on-surface-variant">
              <AlertCircle size={24} />
              <span className="text-sm">Unable to retrieve profile.</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
