"use client";

import { Case } from "../../types/cases";
import { motion } from "framer-motion";
import { BrainCircuit, Info } from "lucide-react";

interface AIExplainabilityProps {
  caseData: Case;
}

export default function AIExplainability({ caseData }: AIExplainabilityProps) {
  const shapValues = caseData.shapValues || [];

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">AI Risk Explainability (SHAP)</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Machine Learning model feature contributions driving the {caseData.riskScore}/100 risk score.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center text-[10px] font-label-mono text-on-surface-variant font-bold uppercase tracking-wider mb-2 border-b border-outline-variant/30 pb-2">
          <span>Feature Vector</span>
          <span>Contribution to Risk</span>
        </div>

        {shapValues.map((shap, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                {shap.feature}
                <Info size={12} className="text-on-surface-variant opacity-50 cursor-help" />
              </span>
              <span className={`text-[10px] font-label-mono font-bold ${
                shap.contribution === "positive" ? "text-risk-high" : "text-risk-low"
              }`}>
                {shap.contribution === "positive" ? "+" : ""}{shap.value.toFixed(1)}
              </span>
            </div>
            
            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden relative">
              <div
                className={`absolute top-0 bottom-0 h-full rounded-full transition-all duration-1000 ${
                  shap.contribution === "positive" ? "bg-risk-high" : "bg-risk-low"
                }`}
                style={{
                  width: `${Math.abs(shap.value)}%`,
                  left: shap.contribution === "positive" ? "50%" : `${50 - Math.abs(shap.value)}%`,
                }}
              />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-outline-variant/50" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 text-xs text-on-surface-variant">
        <p>
          <strong className="text-on-surface">SHAP (SHapley Additive exPlanations)</strong> provides a unified measure of feature importance. Positive values push the risk score higher, indicating suspicious behavior, while negative values push the score lower, indicating benign behavior.
        </p>
      </div>
    </div>
  );
}
