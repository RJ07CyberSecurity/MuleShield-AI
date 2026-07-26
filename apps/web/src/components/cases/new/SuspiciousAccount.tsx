"use client";

import { useNewCaseStore } from "../../../store/useNewCaseStore";

export default function SuspiciousAccount() {
  const {
    suspiciousAccountNumber, confirmAccountNumber, accountHolderName,
    bankName, branch, ifscCode, accountType, dateAccountOpened,
    accountStatus, currentBalance, riskLevel, kycStatus, updateField
  } = useNewCaseStore();

  return (
    <div className="bg-surface/50 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant/30 pb-3">3. Suspicious Bank Account</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Suspicious Account Number *</label>
          <input type="text" value={suspiciousAccountNumber} onChange={e => updateField("suspiciousAccountNumber", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Confirm Account Number</label>
          <input type="text" value={confirmAccountNumber} onChange={e => updateField("confirmAccountNumber", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Account Holder Name</label>
          <input type="text" value={accountHolderName} onChange={e => updateField("accountHolderName", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Bank Name *</label>
          <input type="text" value={bankName} onChange={e => updateField("bankName", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Branch</label>
          <input type="text" value={branch} onChange={e => updateField("branch", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">IFSC Code</label>
          <input type="text" value={ifscCode} onChange={e => updateField("ifscCode", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 uppercase" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Account Type</label>
          <select value={accountType} onChange={e => updateField("accountType", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 appearance-none">
            <option>Savings</option>
            <option>Current</option>
            <option>Salary</option>
            <option>Business</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Date Account Opened</label>
          <input type="date" value={dateAccountOpened} onChange={e => updateField("dateAccountOpened", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Account Status</label>
          <select value={accountStatus} onChange={e => updateField("accountStatus", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 appearance-none">
            <option>Active</option>
            <option>Frozen</option>
            <option>Closed</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Current Balance</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
            <input type="text" value={currentBalance} onChange={e => updateField("currentBalance", e.target.value)} placeholder="0.00" className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl pl-8 pr-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Risk Level</label>
          <select value={riskLevel} onChange={e => updateField("riskLevel", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 appearance-none">
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">KYC Status</label>
          <select value={kycStatus} onChange={e => updateField("kycStatus", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 appearance-none">
            <option>Verified</option>
            <option>Pending</option>
            <option>Incomplete</option>
          </select>
        </div>
      </div>
    </div>
  );
}
