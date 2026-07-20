"use client";

import { useState } from "react";
import { Case } from "../../types/cases";
import { useUIStore } from "../../store/useUIStore";

interface SARFormProps {
  activeCase: Case;
}

export default function SARForm({ activeCase }: SARFormProps) {
  const { addToast } = useUIStore();
  const [step, setStep] = useState(1);
  const [institution, setInstitution] = useState("GLOBAL TRUST BANK (US-HQ)");
  const [jurisdiction, setJurisdiction] = useState("US-NY");
  const [narrative, setNarrative] = useState(
    `Forensic review of case ${activeCase.id} revealed an anomaly score of ${activeCase.riskScore}/100. Target accounts ${activeCase.muleNodes.filter(n => n.includes("ACC")).join(" and ")} engaged in suspicious layering behavior. Intermediary nodes transfer patterns suggest automated money mule ring structured deposits exceeding ${activeCase.totalAmount.toLocaleString()} USD across multiple device sessions.`
  );
  const [isExported, setIsExported] = useState(false);

  // Inline Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!institution.trim()) {
        newErrors.institution = "Financial institution label is required.";
      }
      if (!jurisdiction.trim()) {
        newErrors.jurisdiction = "Filing jurisdiction is required.";
      }
    } else if (currentStep === 3) {
      if (narrative.trim().length < 50) {
        newErrors.narrative = "Filing narrative must be at least 50 characters long for regulatory compliance.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    } else {
      addToast("Please resolve validation errors before continuing.", "warning");
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) {
      addToast("Filing narrative does not meet criteria.", "error");
      return;
    }

    setIsExported(true);
    const sarData = {
      reportingInstitution: institution,
      fincenXmlSchemaVersion: "1.2",
      filingType: "SAR-SUSPICIOUS-ACTIVITY-REPORT",
      caseReference: activeCase.id,
      riskLevel: activeCase.riskScore >= 70 ? "HIGH" : "MEDIUM",
      totalFilingAmount: activeCase.totalAmount,
      subjectNodes: activeCase.muleNodes,
      regulatoryNarrative: narrative,
      exportedAt: new Date().toISOString(),
    };

    // Download compiled payload
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sarData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `FINCEN_SAR_${activeCase.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addToast("FinCEN SAR Payload compiled and downloaded successfully.", "success");
    setTimeout(() => setIsExported(false), 3000);
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">file_present</span>
          Regulatory SAR Auto-Compiler
        </h4>
        <p className="text-caption text-on-surface-variant">
          Pre-compiled FinCEN standard draft layout matching the active investigation data.
        </p>
      </div>

      {/* Stepper Progress Indicator */}
      <div className="flex items-center justify-between pb-4 border-b border-outline-variant/15 text-[10px] font-label-mono uppercase tracking-wider text-on-surface-variant font-bold select-none">
        <div className={`flex items-center gap-1.5 ${step >= 1 ? "text-primary" : ""}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] ${
            step >= 1 ? "border-primary bg-primary/10" : "border-outline-variant/30"
          }`}>1</span>
          <span>Entity</span>
        </div>
        <div className="flex-1 h-px bg-outline-variant/20 mx-2" />
        <div className={`flex items-center gap-1.5 ${step >= 2 ? "text-primary" : ""}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] ${
            step >= 2 ? "border-primary bg-primary/10" : "border-outline-variant/30"
          }`}>2</span>
          <span>Scope</span>
        </div>
        <div className="flex-1 h-px bg-outline-variant/20 mx-2" />
        <div className={`flex items-center gap-1.5 ${step >= 3 ? "text-primary" : ""}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] ${
            step >= 3 ? "border-primary bg-primary/10" : "border-outline-variant/30"
          }`}>3</span>
          <span>Narrative</span>
        </div>
      </div>

      {/* Form Steps */}
      <div className="min-h-[180px]">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="space-y-1.5">
              <label className="text-on-surface-variant font-semibold">
                Reporting Financial Institution <span className="text-risk-critical">*</span>
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className={`w-full bg-surface-container-lowest border rounded-xl px-3.5 py-2.5 text-on-surface focus:outline-none ${
                  errors.institution ? "border-risk-critical" : "border-outline-variant/30"
                }`}
              />
              {errors.institution && <p className="text-[10px] text-risk-critical font-medium">{errors.institution}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-on-surface-variant font-semibold">
                Filing Jurisdiction Code <span className="text-risk-critical">*</span>
              </label>
              <input
                type="text"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className={`w-full bg-surface-container-lowest border rounded-xl px-3.5 py-2.5 text-on-surface focus:outline-none ${
                  errors.jurisdiction ? "border-risk-critical" : "border-outline-variant/30"
                }`}
              />
              {errors.jurisdiction && <p className="text-[10px] text-risk-critical font-medium">{errors.jurisdiction}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="p-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
                <span className="text-on-surface-variant font-medium">Filing Reference Case</span>
                <span className="font-bold text-on-surface font-label-mono">{activeCase.id}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
                <span className="text-on-surface-variant font-medium">Aggregated Subject Value</span>
                <span className="font-bold text-primary font-label-mono">${activeCase.totalAmount.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant font-medium">Subject Nodes Involved</span>
                <span className="text-on-surface font-semibold font-label-mono">{activeCase.muleNodes.length} Entities</span>
              </div>
            </div>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              Filing scope coordinates are auto-synchronized with the audit ledger indices.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 animate-fade-in text-xs">
            <div className="space-y-1.5">
              <label className="text-on-surface-variant font-semibold">
                Part V: Suspicious Activity Narrative <span className="text-risk-critical">*</span>
              </label>
              <textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                rows={5}
                className={`w-full bg-surface-container-lowest border rounded-xl p-4 text-body-sm focus:outline-none text-on-surface resize-none leading-relaxed ${
                  errors.narrative ? "border-risk-critical" : "border-outline-variant/30"
                }`}
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>{narrative.trim().length} characters</span>
                {errors.narrative && <span className="text-risk-critical font-medium">{errors.narrative}</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stepper Navigation buttons */}
      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={handleBack}
            className="flex-1 py-2.5 border border-outline-variant/30 text-on-surface font-bold text-xs rounded-xl hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </button>
        )}
        {step < 3 ? (
          <button
            onClick={handleNext}
            className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
          >
            Continue
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        ) : (
          <button
            onClick={handleExport}
            disabled={isExported}
            className="flex-1 py-2.5 bg-risk-high text-white font-bold text-xs rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-md"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            {isExported ? "Filing Compiled!" : "Compile FinCEN JSON"}
          </button>
        )}
      </div>

      <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10 text-[9px] font-label-mono text-on-surface-variant leading-relaxed">
        * Complies with BSAC/FinCEN data formatting models. Raw schema definitions are maintained in `databases/postgres/schemas/cases.sql`.
      </div>
    </div>
  );
}
