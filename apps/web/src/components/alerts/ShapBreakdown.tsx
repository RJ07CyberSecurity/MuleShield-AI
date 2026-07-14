"use client";

import { useAlertStore } from "../../store/useAlertStore";

export default function ShapBreakdown() {
  const { alerts, selectedAlertId } = useAlertStore();

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId);

  if (!selectedAlert) {
    return (
      <div className="h-full flex items-center justify-center p-8 border border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-low/40">
        <p className="text-body-sm text-on-surface-variant text-center">
          Select an alert from the queue to view explainability attributes.
        </p>
      </div>
    );
  }

  const shapData = selectedAlert.shapExplanation || {};

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">psychology</span>
          Explainable AI (SHAP)
        </h4>
        <p className="text-caption text-on-surface-variant">
          Breakdown of the top risk contributors calculated by the machine learning engine.
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(shapData).length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">
            No SHAP factors returned for this transaction.
          </p>
        ) : (
          Object.entries(shapData)
            .sort((a, b) => b[1] - a[1])
            .map(([factor, weight]) => {
              const percentage = Math.round(weight * 100);
              return (
                <div key={factor} className="space-y-1.5">
                  <div className="flex justify-between text-body-sm">
                    <span className="text-on-surface-variant font-medium">{factor}</span>
                    <span className="font-label-mono text-primary font-semibold">+{percentage}%</span>
                  </div>
                  <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden w-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
        )}
      </div>

      <div className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-caption text-on-surface-variant flex gap-2">
        <span className="material-symbols-outlined text-primary text-lg">info</span>
        <span>
          SHAP (SHapley Additive exPlanations) attributes represent the marginal contribution of each transaction feature to the total anomaly index score.
        </span>
      </div>
    </div>
  );
}
