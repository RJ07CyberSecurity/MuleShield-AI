"use client";

import { useState } from "react";
import { useAlertStore } from "../../store/useAlertStore";
import { getRiskColorClass } from "../../types/alerts";

export default function QuickActionPanel() {
  const { alerts, selectedAlertId, resolveAlert } = useAlertStore();
  const [isResolving, setIsResolving] = useState(false);

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId);

  if (!selectedAlert) {
    return null;
  }

  const handleResolve = async (action: "DISMISSED" | "ESCALATED") => {
    setIsResolving(true);
    await resolveAlert(selectedAlert.id, action);
    setIsResolving(false);
  };

  return (
    <div className="space-y-6">
      {/* Alert Header Summary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-label-mono text-body-sm font-bold text-on-surface">{selectedAlert.id}</span>
          <span
            className={`px-3 py-1 border rounded-full text-caption font-bold ${getRiskColorClass(
              selectedAlert.riskScore
            )}`}
          >
            Risk: {selectedAlert.riskScore}/100
          </span>
        </div>
        <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
          Transaction Triage Details
        </h3>
      </div>

      {/* Entity specifications */}
      <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-3 text-body-sm">
        <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
          <span className="text-on-surface-variant font-medium">Transaction ID</span>
          <span className="font-label-mono text-on-surface">{selectedAlert.transactionId}</span>
        </div>
        <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
          <span className="text-on-surface-variant font-medium">Transfer Amount</span>
          <span className="font-bold text-on-surface">
            {selectedAlert.amount.toLocaleString()} {selectedAlert.currency}
          </span>
        </div>
        {selectedAlert.entityDetails && (
          <>
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
              <span className="text-on-surface-variant font-medium">Entity Name</span>
              <span className="text-on-surface font-semibold">{selectedAlert.entityDetails.name}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
              <span className="text-on-surface-variant font-medium">Hardware Fingerprint</span>
              <span className="font-label-mono text-on-surface truncate max-w-[160px]">
                {selectedAlert.entityDetails.deviceId}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-medium">IP Location</span>
              <span className="font-label-mono text-on-surface">
                {selectedAlert.entityDetails.ipAddress}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Tipping Point Description */}
      <div className="space-y-2">
        <h4 className="font-label-mono text-caption text-on-surface-variant uppercase tracking-wider">
          Behavioral Anomaly Trigger
        </h4>
        <p className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-body-sm text-on-surface leading-relaxed">
          {selectedAlert.tippingPoint}
        </p>
      </div>

      {/* Triage Actions buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => handleResolve("DISMISSED")}
          disabled={isResolving}
          className="flex-1 py-3 px-4 rounded-xl border border-outline/30 text-on-surface font-bold text-body-sm hover:bg-white/5 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm text-risk-low">cancel</span>
          Dismiss (Safe)
        </button>
        <button
          onClick={() => handleResolve("ESCALATED")}
          disabled={isResolving}
          className="flex-1 py-3 px-4 rounded-xl bg-risk-high text-on-primary font-bold text-body-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
          Escalate (Case)
        </button>
      </div>
    </div>
  );
}
