"use client";

import { useNewCaseStore } from "../../../store/useNewCaseStore";

export default function TransactionSummary() {
  const {
    totalTransactions, totalCreditAmount, totalDebitAmount,
    highestTransaction, averageTransaction, firstSuspiciousTxnDate,
    lastSuspiciousTxnDate, noOfSuspiciousTxns, suspiciousAmount, updateField
  } = useNewCaseStore();

  return (
    <div className="bg-surface/50 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant/30 pb-3">4. Transaction Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Total Transactions</label>
          <input type="text" value={totalTransactions} onChange={e => updateField("totalTransactions", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Total Credit Amount</label>
          <input type="text" value={totalCreditAmount} onChange={e => updateField("totalCreditAmount", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Total Debit Amount</label>
          <input type="text" value={totalDebitAmount} onChange={e => updateField("totalDebitAmount", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Highest Transaction</label>
          <input type="text" value={highestTransaction} onChange={e => updateField("highestTransaction", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Average Transaction</label>
          <input type="text" value={averageTransaction} onChange={e => updateField("averageTransaction", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">No. of Suspicious Transactions</label>
          <input type="text" value={noOfSuspiciousTxns} onChange={e => updateField("noOfSuspiciousTxns", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">First Suspicious Transaction Date</label>
          <input type="date" value={firstSuspiciousTxnDate} onChange={e => updateField("firstSuspiciousTxnDate", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Last Suspicious Transaction Date</label>
          <input type="date" value={lastSuspiciousTxnDate} onChange={e => updateField("lastSuspiciousTxnDate", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Suspicious Amount</label>
          <input type="text" value={suspiciousAmount} onChange={e => updateField("suspiciousAmount", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 text-risk-critical" />
        </div>
      </div>
    </div>
  );
}
