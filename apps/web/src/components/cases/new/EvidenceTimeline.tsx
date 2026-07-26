"use client";

import { useNewCaseStore } from "../../../store/useNewCaseStore";
import { Clock } from "lucide-react";

export default function EvidenceTimeline() {
  const { evidenceFiles } = useNewCaseStore();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-surface/50 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant/30 pb-3">9. Evidence Timeline</h3>
      
      <div className="relative border-l border-outline-variant/50 ml-3 space-y-6">
        <div className="relative pl-6">
          <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
          <p className="text-xs font-semibold text-primary mb-1">{time}</p>
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 shadow-sm inline-block">
            <p className="text-sm text-on-surface font-semibold">Case Registration Started</p>
          </div>
        </div>

        {evidenceFiles.map((file, idx) => (
          <div key={idx} className="relative pl-6">
            <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-surface-variant ring-2 ring-outline-variant"></div>
            <p className="text-xs font-semibold text-on-surface-variant mb-1">{time}</p>
            <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-3 shadow-sm inline-block">
              <p className="text-sm text-on-surface"><span className="font-semibold">Evidence Uploaded:</span> {file.name}</p>
            </div>
          </div>
        ))}

        <div className="relative pl-6 opacity-50">
          <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-surface-variant ring-2 ring-outline-variant"></div>
          <p className="text-xs font-semibold text-on-surface-variant mb-1">Pending</p>
          <p className="text-sm text-on-surface">Case Submission</p>
        </div>
      </div>
    </div>
  );
}
