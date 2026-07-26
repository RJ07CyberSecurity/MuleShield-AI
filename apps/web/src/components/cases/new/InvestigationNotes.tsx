"use client";

import { useNewCaseStore } from "../../../store/useNewCaseStore";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from "lucide-react";

export default function InvestigationNotes() {
  const { investigationNotes, updateField } = useNewCaseStore();

  return (
    <div className="bg-surface/50 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant/30 pb-3">6. Investigation Notes</h3>
      
      <div className="border border-outline-variant/50 rounded-xl overflow-hidden bg-surface-container-lowest">
        <div className="flex items-center gap-1 border-b border-outline-variant/50 p-2 bg-surface">
          <button className="p-2 hover:bg-surface-container text-on-surface-variant hover:text-on-surface rounded-lg transition-colors"><Bold size={16} /></button>
          <button className="p-2 hover:bg-surface-container text-on-surface-variant hover:text-on-surface rounded-lg transition-colors"><Italic size={16} /></button>
          <div className="w-px h-4 bg-outline-variant/50 mx-2"></div>
          <button className="p-2 hover:bg-surface-container text-on-surface-variant hover:text-on-surface rounded-lg transition-colors"><List size={16} /></button>
          <button className="p-2 hover:bg-surface-container text-on-surface-variant hover:text-on-surface rounded-lg transition-colors"><ListOrdered size={16} /></button>
          <div className="w-px h-4 bg-outline-variant/50 mx-2"></div>
          <button className="p-2 hover:bg-surface-container text-on-surface-variant hover:text-on-surface rounded-lg transition-colors"><LinkIcon size={16} /></button>
        </div>
        <textarea
          value={investigationNotes}
          onChange={e => updateField("investigationNotes", e.target.value)}
          placeholder="Enter timeline notes, observations, initial findings, and comments..."
          rows={10}
          className="w-full bg-transparent p-4 text-sm text-on-surface focus:outline-none resize-none"
        />
      </div>
    </div>
  );
}
