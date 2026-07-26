"use client";

import { useNewCaseStore } from "../../../store/useNewCaseStore";
import { Plus } from "lucide-react";

export default function RelatedEntities() {
  const { updateField } = useNewCaseStore();

  return (
    <div className="bg-surface/50 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant/30 pb-3">8. Related Entities</h3>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-semibold text-on-surface">Related Accounts</h4>
          <button className="text-xs font-semibold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
            <Plus size={14} /> Add Account
          </button>
        </div>
        <div className="w-full overflow-x-auto border border-outline-variant/30 rounded-xl">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-container text-on-surface-variant border-b border-outline-variant/30">
              <tr>
                <th className="px-4 py-3 font-semibold">Account Number</th>
                <th className="px-4 py-3 font-semibold">Bank</th>
                <th className="px-4 py-3 font-semibold">Relationship</th>
                <th className="px-4 py-3 font-semibold">Risk Score</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-on-surface">
              <tr className="hover:bg-surface-container/50 transition-colors">
                <td className="px-4 py-3">123456789012</td>
                <td className="px-4 py-3">HDFC Bank</td>
                <td className="px-4 py-3">Primary Beneficiary</td>
                <td className="px-4 py-3 text-risk-high font-semibold">88/100</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-risk-high/10 text-risk-high rounded text-xs font-semibold">Flagged</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-semibold text-on-surface">Related Customers</h4>
          <button className="text-xs font-semibold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
            <Plus size={14} /> Add Customer
          </button>
        </div>
        <div className="w-full overflow-x-auto border border-outline-variant/30 rounded-xl">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-container text-on-surface-variant border-b border-outline-variant/30">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Relationship</th>
                <th className="px-4 py-3 font-semibold">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-on-surface">
              <tr className="hover:bg-surface-container/50 transition-colors">
                <td className="px-4 py-3">Ravi Sharma</td>
                <td className="px-4 py-3">+91 9876543210</td>
                <td className="px-4 py-3">ravi@example.com</td>
                <td className="px-4 py-3">Joint Account Holder</td>
                <td className="px-4 py-3 text-risk-medium font-semibold">Medium</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
