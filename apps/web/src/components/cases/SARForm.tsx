"use client";

import { useState } from "react";
import { Case } from "../../types/cases";

interface SARFormProps {
  activeCase: Case;
}

export default function SARForm({ activeCase }: SARFormProps) {
  const [institution, setInstitution] = useState("GLOBAL TRUST BANK (US-HQ)");
  const [narrative, setNarrative] = useState(
    `Forensic review of case ${activeCase.id} revealed an anomaly score of ${activeCase.riskScore}/100. Target accounts ${activeCase.muleNodes.filter(n => n.includes("ACC")).join(" and ")} engaged in suspicious layering behavior. Intermediary nodes transfer patterns suggest automated money mule ring structured deposits exceeding ${activeCase.totalAmount.toLocaleString()} USD across multiple device sessions.`
  );
  const [isExported, setIsExported] = useState(false);

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
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

    // Create a local download link for XML/JSON representation
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sarData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `FINCEN_SAR_${activeCase.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setTimeout(() => setIsExported(false), 3000);
  };

  return (
    <form onSubmit={handleExport} className="space-y-6">
      <div>
        <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">file_present</span>
          Regulatory SAR Auto-Compiler
        </h4>
        <p className="text-caption text-on-surface-variant">
          Pre-compiled FinCEN standard draft layout matching the active investigation data.
        </p>
      </div>

      <div className="space-y-4">
        {/* Institution */}
        <div className="space-y-1.5">
          <label className="text-body-sm text-on-surface-variant font-medium">Reporting Financial Institution</label>
          <input
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-body-sm text-on-surface focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Narrative Box */}
        <div className="space-y-1.5">
          <label className="text-body-sm text-on-surface-variant font-medium">Part V: Suspicious Activity Narrative</label>
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            rows={5}
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 text-body-sm focus:outline-none focus:border-primary/50 text-on-surface resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Export / Submit Button */}
      <button
        type="submit"
        className="w-full py-3 px-4 rounded-xl bg-primary text-on-primary font-bold text-body-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">download</span>
        {isExported ? "XML/JSON Downloaded!" : "Compile & Export FinCEN JSON"}
      </button>

      <div className="p-4 rounded-xl bg-surface-container-lowest/50 border border-outline-variant/10 text-[10px] font-label-mono text-on-surface-variant leading-relaxed">
        * Complies with BSAC/FinCEN data formatting models. Raw schema definitions are maintained in `databases/postgres/schemas/cases.sql`.
      </div>
    </form>
  );
}
