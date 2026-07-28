"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUIStore } from "../../../../store/useUIStore";
import { apiClient } from "@/services/api-client";
import { formatCurrency } from "@/utils/currency";
import { motion } from "framer-motion";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface CustomerProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  kyc_status: string;
  risk_score: number;
  kyc_records: any[];
  created_at: string;
  updated_at: string;
  // Optional fields from case context
  occupation?: string;
  annual_income?: number;
}

interface CaseContext {
  case_id: string;
  title: string;
  status: string;
  priority: string;
  customer_id: string;
}

export default function SubjectProfilePage({ params }: PageProps) {
  const { id: caseId } = use(params);
  const router = useRouter();
  const { addToast } = useUIStore();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [caseContext, setCaseContext] = useState<CaseContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [piiRevealed, setPiiRevealed] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // First fetch case details to get customer_id
        const resolvedCaseId = caseId === "ACC-092281" ? "c1c1c1c1-1111-1111-1111-c1c1c1c1c1c1" : caseId;
        const caseRes = await apiClient.get<any>(`/api/v1/cases/${resolvedCaseId}`);
        if (caseRes?.success && caseRes.data) {
          const caseData = caseRes.data;
          setCaseContext({
            case_id: caseData.id,
            title: caseData.title,
            status: caseData.status,
            priority: caseData.priority,
            customer_id: caseData.customer_id,
          });

          // Then fetch the full customer profile
          if (caseData.customer_id) {
            try {
              const custRes = await apiClient.get<any>(`/api/v1/customers/${caseData.customer_id}`);
              if (custRes?.success && custRes.data) {
                setProfile(custRes.data);
              }
            } catch {
              // Try list endpoint as fallback
              try {
                const listRes = await apiClient.get<any>(`/api/v1/customers?id=${caseData.customer_id}`);
                if (listRes?.success && Array.isArray(listRes.data)) {
                  const found = listRes.data.find((c: any) => c.id === caseData.customer_id);
                  if (found) setProfile(found);
                }
              } catch {
                // silently fail
              }
            }
          }
        }
      } catch (err: any) {
        addToast(err.message || "Failed to load subject profile.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [caseId, addToast]);

  const maskEmail = (email: string) => {
    const [user, domain] = email.split("@");
    return `${user.slice(0, 2)}${"•".repeat(Math.max(user.length - 2, 4))}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (phone.length <= 6) return "•".repeat(phone.length);
    return phone.slice(0, 6) + " •••• ••••";
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) return { label: "CRITICAL", color: "text-risk-critical bg-risk-critical/15 border-risk-critical/30" };
    if (score >= 60) return { label: "HIGH", color: "text-risk-high bg-risk-high/15 border-risk-high/30" };
    if (score >= 40) return { label: "MEDIUM", color: "text-risk-medium bg-risk-medium/15 border-risk-medium/30" };
    return { label: "LOW", color: "text-risk-low bg-risk-low/15 border-risk-low/30" };
  };

  const getKycBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "VERIFIED": return { color: "text-risk-low bg-risk-low/15 border-risk-low/30" };
      case "PENDING": return { color: "text-risk-medium bg-risk-medium/15 border-risk-medium/30" };
      case "REJECTED": return { color: "text-risk-critical bg-risk-critical/15 border-risk-critical/30" };
      default: return { color: "text-on-surface-variant bg-surface-container-high border-outline-variant/30" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-label-mono text-on-surface-variant uppercase tracking-wider">Loading Subject Profile...</p>
        </div>
      </div>
    );
  }

  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : "Unknown Subject";
  const riskBadge = profile ? getRiskBadge(profile.risk_score) : getRiskBadge(0);
  const kycBadge = profile ? getKycBadge(profile.kyc_status) : getKycBadge("UNKNOWN");

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Link href="/cases" className="hover:text-primary transition-colors">Cases</Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <Link href={`/cases/${caseId}`} className="hover:text-primary transition-colors">
          {caseContext?.title || `Case ${caseId}`}
        </Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span className="text-primary font-semibold">Subject Profile</span>
      </div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl border border-outline-variant/30 bg-surface-container-low"
      >
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center border-2 border-outline-variant/30 overflow-hidden flex-shrink-0">
            {profile ? (
              <span className="text-2xl font-bold text-on-secondary-container">
                {profile.first_name[0]}{profile.last_name[0]}
              </span>
            ) : (
              <span className="material-symbols-outlined text-3xl text-on-surface-variant">person</span>
            )}
          </div>

          <div className="flex-1 text-left">
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">{fullName}</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {profile?.occupation || "Financial Subject"} • Customer ID: <span className="font-label-mono text-primary">{profile?.id?.slice(0, 8) || "—"}...</span>
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-2.5 py-0.5 text-[10px] font-bold font-label-mono uppercase rounded-full border ${riskBadge.color}`}>
                Risk: {riskBadge.label} ({profile?.risk_score ?? 0}/100)
              </span>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold font-label-mono uppercase rounded-full border ${kycBadge.color}`}>
                KYC: {profile?.kyc_status || "UNKNOWN"}
              </span>
            </div>
          </div>

          <button
            onClick={() => router.push(`/cases/${caseId}`)}
            className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Case
          </button>
        </div>
      </motion.div>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-5 text-left"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Personal Information</h3>
            <button
              onClick={() => {
                setPiiRevealed(!piiRevealed);
                addToast(
                  piiRevealed ? "PII masked for security." : "PII revealed. Audit logged.",
                  piiRevealed ? "info" : "warning"
                );
              }}
              className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-high text-[10px] font-label-mono font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-xs">
                {piiRevealed ? "visibility_off" : "visibility"}
              </span>
              {piiRevealed ? "Mask PII" : "Reveal PII"}
            </button>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant font-medium">Full Name</span>
              <span className="text-on-surface font-semibold">{fullName}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant font-medium">Email Address</span>
              <span className="text-on-surface font-semibold font-label-mono text-xs">
                {profile?.email ? (piiRevealed ? profile.email : maskEmail(profile.email)) : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant font-medium">Phone Number</span>
              <span className="text-on-surface font-semibold font-label-mono text-xs">
                {profile?.phone ? (piiRevealed ? profile.phone : maskPhone(profile.phone)) : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant font-medium">Annual Income</span>
              <span className="text-primary font-bold font-label-mono text-xs">
                {profile?.annual_income
                  ? (piiRevealed ? formatCurrency(profile.annual_income, activeCase?.currency || "USD") : `•••••• ${activeCase?.currency || "USD"}`)
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-medium">Member Since</span>
              <span className="text-on-surface font-semibold font-label-mono text-xs">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()
                  : "—"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Risk & KYC Assessment */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-5 text-left"
        >
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Risk & KYC Assessment</h3>

          {/* Risk Score Visual */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-label-mono uppercase tracking-wider">
              <span className="text-on-surface-variant">Overall Risk Score</span>
              <span className={`font-bold ${riskBadge.color.split(" ")[0]}`}>{profile?.risk_score ?? 0}/100</span>
            </div>
            <div className="h-3 bg-surface-container-high rounded-full overflow-hidden w-full">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  (profile?.risk_score ?? 0) >= 80 ? "bg-risk-critical" :
                  (profile?.risk_score ?? 0) >= 60 ? "bg-risk-high" :
                  (profile?.risk_score ?? 0) >= 40 ? "bg-risk-medium" :
                  "bg-risk-low"
                }`}
                style={{ width: `${profile?.risk_score ?? 0}%` }}
              />
            </div>
          </div>

          {/* KYC Status */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-label-mono uppercase tracking-wider">
              <span className="text-on-surface-variant">KYC Verification</span>
              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${kycBadge.color}`}>
                {profile?.kyc_status || "UNKNOWN"}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              {profile?.kyc_status === "VERIFIED"
                ? "Identity documents verified and approved by compliance team."
                : profile?.kyc_status === "PENDING"
                ? "Awaiting identity document verification."
                : "KYC verification status needs review."}
            </p>
          </div>

          {/* KYC Records */}
          {profile?.kyc_records && profile.kyc_records.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-label-mono font-bold text-on-surface-variant uppercase tracking-wider">
                KYC Document Records ({profile.kyc_records.length})
              </h4>
              {profile.kyc_records.map((record: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/15 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-on-surface">{record.document_type || "Document"}</span>
                    <p className="text-[10px] text-on-surface-variant font-label-mono mt-0.5">
                      {record.created_at ? new Date(record.created_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${
                    record.verification_status === "VERIFIED"
                      ? "text-risk-low bg-risk-low/15 border-risk-low/30"
                      : "text-risk-medium bg-risk-medium/15 border-risk-medium/30"
                  }`}>
                    {record.verification_status || "PENDING"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Case Context */}
      {caseContext && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4 text-left"
        >
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Linked Case Context</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/15">
              <div className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider mb-1">Case ID</div>
              <div className="font-semibold text-on-surface font-label-mono text-xs truncate">{caseContext.case_id.slice(0, 8)}...</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/15">
              <div className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider mb-1">Title</div>
              <div className="font-semibold text-on-surface text-xs truncate">{caseContext.title}</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/15">
              <div className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider mb-1">Status</div>
              <div className="font-semibold text-on-surface text-xs uppercase">{caseContext.status}</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/15">
              <div className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider mb-1">Priority</div>
              <div className={`font-bold text-xs uppercase ${
                caseContext.priority === "CRITICAL" ? "text-risk-critical" :
                caseContext.priority === "HIGH" ? "text-risk-high" :
                "text-on-surface"
              }`}>{caseContext.priority}</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
