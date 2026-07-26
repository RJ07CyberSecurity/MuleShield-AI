"use client";

import { useNewCaseStore } from "../../../store/useNewCaseStore";
import { CheckCircle, ExternalLink, Upload, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SuccessModal() {
  const { caseNumber, assignedOfficer, resetForm } = useNewCaseStore();
  const router = useRouter();

  const handleReturn = () => {
    resetForm();
    router.push("/cases");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-outline-variant/30 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center animate-in fade-in zoom-in duration-300">
        
        {/* Decorative background circle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-3xl rounded-full pointer-events-none"></div>

        <div className="mx-auto w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mb-6 ring-4 ring-success/10 relative z-10">
          <CheckCircle size={40} />
        </div>

        <h2 className="text-2xl font-bold text-on-surface mb-2 relative z-10">Investigation Registered</h2>
        <p className="text-on-surface-variant mb-6 text-sm relative z-10">
          The case has been successfully filed in the MuleShield AI registry and is now active.
        </p>

        <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-4 text-left mb-8 relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-on-surface-variant">Case ID</span>
            <span className="text-sm font-bold text-primary">{caseNumber}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-on-surface-variant">Registration Time</span>
            <span className="text-sm font-semibold text-on-surface">{new Date().toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-on-surface-variant">Assigned Officer</span>
            <span className="text-sm font-semibold text-on-surface">{assignedOfficer || "System Assigned"}</span>
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          <button onClick={handleReturn} className="w-full px-4 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <ExternalLink size={18} /> Open Case Workspace
          </button>
          <button className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors">
            <Upload size={18} /> Upload More Evidence
          </button>
          <button onClick={handleReturn} className="w-full px-4 py-3 text-on-surface-variant rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors">
            <Home size={18} /> Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
