"use client";

import { useState } from "react";
import { FileText, Download, Check, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { apiClient } from "../../services/api-client";
import { useUIStore } from "../../store/useUIStore";

interface ReportGeneratorProps {
  accountId: string;
  caseId?: string;
  className?: string;
}

interface GeneratedReport {
  report_id: string;
  account_id: string;
  case_id: string | null;
  report_type: string;
  executive_summary: string;
  narrative: string;
  evidence: any[];
  risk_factors: any[];
  recommendations: string;
}

export default function ReportGenerator({ accountId, caseId, className = "" }: ReportGeneratorProps) {
  const { addToast } = useUIStore();
  const [status, setStatus] = useState<"idle" | "generating" | "ready" | "error">("idle");
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const triggerGenerate = async () => {
    setStatus("generating");
    try {
      const response = await apiClient.post<any>("/api/v1/reports/generate", {
        account_id: accountId,
        case_id: caseId || null,
        report_type: "investigation"
      });

      if (response.success && response.data.report_id) {
        setReport(response.data);
        setStatus("ready");
        addToast("Forensic Report draft compiled by Claude AI.", "success");
      } else {
        setErrorMessage(response.message || "Failed to generate AI report draft.");
        setStatus("error");
        addToast("Report generation failed.", "error");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect to report generator endpoint.");
      setStatus("error");
      addToast(err.message || "Report connection failed.", "error");
    }
  };

  const triggerDownload = (format: "pdf" | "docx") => {
    if (!report) return;
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const downloadUrl = `${BASE_URL}/api/v1/reports/${report.report_id}/download?format=${format}`;
      
      // We trigger browser download using window.open or a temporary link
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.download = `Forensic_Report_${accountId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addToast(`Downloaded forensic statement draft as ${format.toUpperCase()}.`, "success");
    } catch (err: any) {
      addToast("File download trigger failed.", "error");
    }
  };

  return (
    <div className={`p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low text-left space-y-4 shadow-lg ${className}`}>
      <div className="flex items-center gap-2">
        <Sparkles className="text-primary" size={18} />
        <h4 className="text-xs font-black text-on-surface uppercase tracking-wider font-label-mono">AI Forensic Dossier Draft</h4>
      </div>
      
      <p className="text-[11px] text-on-surface-variant leading-relaxed">
        Gathers ledger transaction flows, compliance scorers triggers, and account profiles to compile an explainable SAR report narrative via Claude.
      </p>

      {status === "idle" && (
        <button
          onClick={triggerGenerate}
          className="w-full px-4 py-2.5 bg-primary hover:bg-primary-fixed text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
        >
          <Sparkles size={14} />
          Generate AI SAR Report Draft
        </button>
      )}

      {status === "generating" && (
        <div className="flex flex-col items-center justify-center py-3 gap-2.5">
          <Loader2 className="animate-spin text-primary" size={24} />
          <div className="text-center">
            <p className="text-xs font-bold text-on-surface">Compiling dossier evidence...</p>
            <p className="text-[9px] text-on-surface-variant font-label-mono mt-0.5">Contacting Claude sonnet model</p>
          </div>
        </div>
      )}

      {status === "ready" && report && (
        <div className="space-y-4 animate-fade-in">
          {/* Brief Preview Box */}
          <div className="p-3 bg-surface-container-highest border border-outline-variant/20 rounded-xl text-left space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
            <span className="text-[8px] font-label-mono text-primary uppercase font-bold tracking-wider">Generated Executive Summary</span>
            <p className="text-[10.5px] leading-relaxed text-on-surface-variant font-medium">
              {report.executive_summary}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => triggerDownload("pdf")}
              className="flex-1 px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Download size={14} />
              Download PDF
            </button>
            <button
              onClick={() => triggerDownload("docx")}
              className="flex-1 px-4 py-2.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <FileText size={14} />
              Download DOCX
            </button>
          </div>

          <button
            onClick={() => setStatus("idle")}
            className="w-full text-center text-[10px] font-bold text-on-surface-variant hover:text-on-surface hover:underline font-label-mono uppercase"
          >
            Draft New Report
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <div className="p-3 bg-risk-high/10 border border-risk-high/30 rounded-xl flex gap-2 text-left text-risk-high">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h5 className="text-xs font-bold">Draft generation failed</h5>
              <p className="text-[9px] leading-tight text-on-surface-variant">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={triggerGenerate}
            className="w-full py-2 bg-surface-container-high border border-outline-variant/30 text-on-surface hover:bg-surface-container-highest text-xs font-bold rounded-xl transition-colors"
          >
            Retry Generation
          </button>
        </div>
      )}
    </div>
  );
}
