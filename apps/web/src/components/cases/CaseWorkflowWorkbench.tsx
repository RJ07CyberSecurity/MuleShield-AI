"use client";

import { useState } from "react";
import { Case } from "../../types/cases";
import { useCaseStore } from "../../store/useCaseStore";
import { useUIStore } from "../../store/useUIStore";

interface CaseWorkflowWorkbenchProps {
  activeCase: Case;
}

export default function CaseWorkflowWorkbench({ activeCase }: CaseWorkflowWorkbenchProps) {
  const { updateCaseStatus, addCaseNote } = useCaseStore();
  const { addToast } = useUIStore();
  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value as Case["status"];
    await updateCaseStatus(activeCase.id, nextStatus);
    addToast(`Successfully updated case status to: ${nextStatus}`, "success");
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setIsSubmitting(true);
    await addCaseNote(activeCase.id, noteText);
    addToast("Successfully added case investigator note.", "success");
    setNoteText("");
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8 text-left">
      {/* Workbench Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-outline-variant/30">
        <div>
          <span className="font-label-mono text-caption text-primary uppercase tracking-wider">
            Active Forensic Review
          </span>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
            {activeCase.id}: {activeCase.title}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-body-sm text-on-surface-variant font-medium">Status:</label>
          <select
            value={activeCase.status}
            onChange={handleStatusChange}
            className="bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary/50"
          >
            <option value="NEW">New</option>
            <option value="INVESTIGATING">Under Investigation</option>
            <option value="SAR_DRAFTED">SAR Drafted</option>
            <option value="CLOSED">Closed (Resolved)</option>
          </select>
        </div>
      </div>

      {/* Case Description & Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-2">
            <h4 className="font-label-mono text-caption text-on-surface-variant uppercase tracking-wider">
              Investigation Narrative
            </h4>
            <p className="p-4 bg-surface-container-lowest border border-outline-variant/35 rounded-xl text-body-sm text-on-surface leading-relaxed">
              {activeCase.description}
            </p>
          </div>

          {/* Involved Nodes */}
          <div className="space-y-3">
            <h4 className="font-label-mono text-caption text-on-surface-variant uppercase tracking-wider">
              Involved Target Entities
            </h4>
            <div className="flex flex-wrap gap-2">
              {activeCase.muleNodes.map((node) => (
                <div
                  key={node}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-caption font-label-mono text-on-surface-variant flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm text-risk-high">
                    {node.includes("DEV") ? "smartphone" : "account_balance_wallet"}
                  </span>
                  {node}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info panel metadata */}
        <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-3 text-body-sm h-fit">
          <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
            <span className="text-on-surface-variant">Risk Index</span>
            <span className="font-bold text-risk-critical">{activeCase.riskScore}/100</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
            <span className="text-on-surface-variant">Assigned Lead</span>
            <span className="text-on-surface font-semibold">{activeCase.assignedTo}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
            <span className="text-on-surface-variant">Associated Txns</span>
            <span className="font-label-mono text-on-surface">{activeCase.transactionsCount} entries</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant">Total Value</span>
            <span className="font-bold text-on-surface">${activeCase.totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Case Timeline / Notes */}
      <div className="space-y-6">
        <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">history</span>
          Case History & Audit Trail
        </h3>

        {/* Note input box */}
        <form onSubmit={handleAddNote} className="space-y-3">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add investigator notes, update details, or attach files..."
            rows={3}
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 text-body-sm focus:outline-none focus:border-primary/50 text-on-surface resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !noteText.trim()}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-body-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add_comment</span>
              Commit Log Note
            </button>
          </div>
        </form>

        {/* Timeline lists */}
        <div className="space-y-4 pt-4 border-t border-outline-variant/20">
          {activeCase.notes.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant italic">
              No audit logs captured yet. Commit note above to document findings.
            </p>
          ) : (
            activeCase.notes
              .slice()
              .reverse()
              .map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/60 space-y-2 relative text-left"
                >
                  <div className="flex justify-between items-center text-caption">
                    <span className="font-semibold text-primary">{note.investigator}</span>
                    <span className="font-label-mono text-on-surface-variant">
                      {new Date(note.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface leading-relaxed">{note.text}</p>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
