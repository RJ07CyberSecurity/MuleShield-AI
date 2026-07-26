"use client";

import { useNewCaseStore } from "../../../store/useNewCaseStore";

export default function CaseInformation() {
  const {
    caseNumber,
    caseTitle,
    caseDescription,
    crimeCategory,
    priority,
    status,
    policeStation,
    investigationUnit,
    assignedOfficer,
    updateField
  } = useNewCaseStore();

  return (
    <div className="bg-surface/50 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant/30 pb-3">1. Case Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Case Number *</label>
          <input
            type="text"
            readOnly
            value={caseNumber}
            className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none opacity-70 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Case Title</label>
          <input
            type="text"
            value={caseTitle}
            onChange={(e) => updateField("caseTitle", e.target.value)}
            placeholder="e.g., Syndicate Alpha Mule Ring"
            className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Case Description *</label>
          <textarea
            value={caseDescription}
            onChange={(e) => updateField("caseDescription", e.target.value)}
            placeholder="Describe the nature of the financial crime..."
            rows={4}
            className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Crime Category</label>
          <select
            value={crimeCategory}
            onChange={(e) => updateField("crimeCategory", e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors appearance-none"
          >
            <option>Mule Account</option>
            <option>Online Banking Fraud</option>
            <option>UPI Fraud</option>
            <option>Investment Scam</option>
            <option>Crypto Scam</option>
            <option>Identity Theft</option>
            <option>Money Laundering</option>
            <option>Card Fraud</option>
            <option>Loan Fraud</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Priority</label>
          <select
            value={priority}
            onChange={(e) => updateField("priority", e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors appearance-none"
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Status</label>
          <input
            type="text"
            readOnly
            value={status}
            className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none opacity-70 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Date Registered</label>
          <input
            type="text"
            readOnly
            value={new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none opacity-70 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Police Station / Branch</label>
          <input
            type="text"
            value={policeStation}
            onChange={(e) => updateField("policeStation", e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Investigation Unit</label>
          <input
            type="text"
            value={investigationUnit}
            onChange={(e) => updateField("investigationUnit", e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Assigned Officer</label>
          <input
            type="text"
            value={assignedOfficer}
            onChange={(e) => updateField("assignedOfficer", e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
