"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle, XCircle } from "lucide-react";
import { useNewCaseStore } from "../../../store/useNewCaseStore";
import { useCaseStore } from "../../../store/useCaseStore";
import { useUIStore } from "../../../store/useUIStore";

import CaseInformation from "../../../components/cases/new/CaseInformation";
import CustomerInformation from "../../../components/cases/new/CustomerInformation";
import SuspiciousAccount from "../../../components/cases/new/SuspiciousAccount";
import TransactionSummary from "../../../components/cases/new/TransactionSummary";
import EvidenceUpload from "../../../components/cases/new/EvidenceUpload";
import InvestigationNotes from "../../../components/cases/new/InvestigationNotes";
import RiskAssessment from "../../../components/cases/new/RiskAssessment";
import RelatedEntities from "../../../components/cases/new/RelatedEntities";
import EvidenceTimeline from "../../../components/cases/new/EvidenceTimeline";
import SuccessModal from "../../../components/cases/new/SuccessModal";

export default function NewCasePage() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const { createCase } = useCaseStore();
  
  const {
    caseNumber, customerName, suspiciousAccountNumber,
    phoneNumber, bankName, caseDescription, resetForm
  } = useNewCaseStore();

  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-save simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (caseNumber || customerName) {
        addToast("Draft auto-saved successfully.", "info");
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [caseNumber, customerName, addToast]);

  const handleCancel = () => {
    resetForm();
    router.push("/cases");
  };

  const handleSaveDraft = () => {
    addToast("Draft saved successfully.", "success");
  };

  const handleSubmit = async () => {
    // Validation
    if (!customerName || !suspiciousAccountNumber || !phoneNumber || !bankName || !caseDescription) {
      addToast("Please fill all required fields before submitting.", "error");
      return;
    }

    setIsSubmitting(true);
    
    // Attempt to submit via the real backend store
    await createCase();
    
    // Show success modal
    setShowSuccess(true);
    setIsSubmitting(false);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col relative overflow-hidden pb-4">
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center pt-4 mb-6">
        <div className="text-left">
          <h2 className="text-xl font-bold text-on-surface">New Investigation Case</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Register a new suspected mule account investigation and upload supporting evidence.
          </p>
        </div>
        
        {/* Top Right Actions */}
        <div className="flex gap-3">
          <button onClick={handleCancel} className="px-4 py-2 border border-outline-variant/30 hover:bg-surface-container rounded-xl text-sm font-semibold text-on-surface transition-colors flex items-center gap-2">
            <XCircle size={16} /> Cancel
          </button>
          <button onClick={handleSaveDraft} className="px-4 py-2 bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high rounded-xl text-sm font-semibold text-on-surface transition-colors flex items-center gap-2">
            <Save size={16} /> Save Draft
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-primary text-on-primary hover:opacity-90 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
            <CheckCircle size={16} /> {isSubmitting ? "Submitting..." : "Submit Case"}
          </button>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-24 custom-scrollbar">
        <CaseInformation />
        <CustomerInformation />
        <SuspiciousAccount />
        <TransactionSummary />
        <EvidenceUpload />
        <InvestigationNotes />
        <RiskAssessment />
        <RelatedEntities />
        <EvidenceTimeline />
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-surface/80 backdrop-blur-xl border-t border-outline-variant/30 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        <div className="flex gap-3">
          <button onClick={handleCancel} className="px-4 py-2 border border-outline-variant/30 hover:bg-surface-container rounded-xl text-sm font-semibold text-on-surface transition-colors">
            Cancel
          </button>
          <button onClick={resetForm} className="px-4 py-2 border border-outline-variant/30 hover:bg-risk-critical/10 hover:text-risk-critical hover:border-risk-critical/30 rounded-xl text-sm font-semibold text-on-surface transition-colors">
            Reset Form
          </button>
        </div>
        
        <div className="flex gap-3">
          <button onClick={handleSaveDraft} className="px-4 py-2 bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high rounded-xl text-sm font-semibold text-on-surface transition-colors flex items-center gap-2">
            <Save size={16} /> Save Draft
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-primary text-on-primary hover:opacity-90 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
            <CheckCircle size={16} /> {isSubmitting ? "Submitting..." : "Submit Investigation"}
          </button>
        </div>
      </div>

      {showSuccess && <SuccessModal />}
    </div>
  );
}
