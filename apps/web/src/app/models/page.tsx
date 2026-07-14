"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

// ROC/PR curves mock coordinates
const rocData = [
  { fpr: 0.0, tpr: 0.0 },
  { fpr: 0.1, tpr: 0.5 },
  { fpr: 0.2, tpr: 0.8 },
  { fpr: 0.4, tpr: 0.92 },
  { fpr: 0.6, tpr: 0.96 },
  { fpr: 0.8, tpr: 0.98 },
  { fpr: 1.0, tpr: 1.0 },
];

const championChallengerData = [
  { name: "0.0", champion: 0.0, challenger: 0.0 },
  { name: "0.2", champion: 0.62, challenger: 0.78 },
  { name: "0.4", champion: 0.84, challenger: 0.91 },
  { name: "0.6", champion: 0.92, challenger: 0.96 },
  { name: "0.8", champion: 0.96, challenger: 0.98 },
  { name: "1.0", champion: 1.0, challenger: 1.0 },
];

const driftData = [
  { name: "Low Vel", training: 45, serving: 12 },
  { name: "Med Vel", training: 60, serving: 32 },
  { name: "High Vel", training: 80, serving: 54 },
  { name: "Max Vel", training: 30, serving: 75 },
];

export default function ModelsPage() {
  const [activeTab, setActiveTab] = useState<"inventory" | "differential">("inventory");
  const [canaryTraffic, setCanaryTraffic] = useState(5);
  const [deployMode, setDeployMode] = useState("shadow");

  const shapFeatures = [
    { name: "TRANS_FREQ", value: 85, pts: "+0.24" },
    { name: "VELOCITY_DELTA", value: 65, pts: "+0.18" },
    { name: "SENDER_AGE_RISK", value: 45, pts: "+0.12" },
    { name: "GEOLOC_ENTROPY", value: 30, pts: "+0.09" },
  ];

  const handleRollout = () => {
    alert(`Deploying challenger model: Canary rollout set at ${canaryTraffic}% traffic.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Workspaces tabs bar */}
      <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`pb-2 font-label-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
              activeTab === "inventory" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Model Inventory
          </button>
          <button
            onClick={() => setActiveTab("differential")}
            className={`pb-2 font-label-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
              activeTab === "differential" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Performance Differential
          </button>
        </div>

        {/* Global model Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => alert("Model constraints updated.")}
            className="px-4 py-2 border border-outline-variant/30 hover:border-primary/50 text-xs font-bold text-on-surface rounded-xl hover:bg-white/5 transition-all"
          >
            Global Constraints
          </button>
          <button
            onClick={() => alert("Challenger version compilation initialized.")}
            className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-xs">cloud_upload</span>
            Deploy New Model
          </button>
        </div>
      </div>

      {/* RENDER INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-on-surface">MuleShield AI Assets</h2>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Model inventory, compliance evaluation metrics, and feature importances.
            </p>
          </div>

          {/* KPI Charts Row (ROC, PR, SHAP Importance) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ROC Curve card */}
            <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
              <div className="flex justify-between items-baseline">
                <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">ROC Curve</h4>
                <span className="font-label-mono text-[9px] text-risk-low font-bold">AUC: 0.984</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rocData} margin={{ left: -30, right: 0, top: 10, bottom: 0 }}>
                    <XAxis dataKey="fpr" stroke="#8d90a0" style={{ fontSize: "8px" }} />
                    <YAxis dataKey="tpr" stroke="#8d90a0" style={{ fontSize: "8px" }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="tpr" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PR Curve card */}
            <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
              <div className="flex justify-between items-baseline">
                <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">PR Curve</h4>
                <span className="font-label-mono text-[9px] text-risk-low font-bold">mAP: 0.941</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rocData} margin={{ left: -30, right: 0, top: 10, bottom: 0 }}>
                    <XAxis dataKey="fpr" stroke="#8d90a0" style={{ fontSize: "8px" }} />
                    <YAxis dataKey="tpr" stroke="#8d90a0" style={{ fontSize: "8px" }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="tpr" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SHAP Feature Importance */}
            <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">SHAP Feature Importance</h4>
              <div className="space-y-4 text-xs pt-2">
                {shapFeatures.map((feat) => (
                  <div key={feat.name} className="space-y-1.5">
                    <div className="flex justify-between font-label-mono text-[9px] text-on-surface-variant font-semibold">
                      <span>{feat.name}</span>
                      <span className="text-risk-high">{feat.pts}</span>
                    </div>
                    <div className="h-2 bg-surface-container-high rounded-full overflow-hidden w-full">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${feat.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Model inventory lists */}
          <section className="space-y-4">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Available Classifiers
            </h3>

            <div className="space-y-4">
              {/* Card 1 */}
              <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold text-base text-on-surface">XGBoost Mule Classifier</h4>
                    <span className="px-2 py-0.5 bg-risk-low/10 border border-risk-low/20 text-risk-low text-[9px] font-bold rounded">
                      COMPLETE
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 font-label-mono">v2.4.1-stable</p>
                </div>

                <div className="flex gap-8 text-center text-xs">
                  <div>
                    <div className="text-on-surface-variant font-label-mono uppercase text-[9px]">Precision</div>
                    <div className="font-bold text-on-surface text-base mt-0.5">0.962</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant font-label-mono uppercase text-[9px]">Recall</div>
                    <div className="font-bold text-on-surface text-base mt-0.5">0.894</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant font-label-mono uppercase text-[9px]">F1 Score</div>
                    <div className="font-bold text-on-surface text-base mt-0.5">0.927</div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold text-base text-on-surface">GNN Network Anomaly</h4>
                    <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold rounded animate-pulse">
                      RUNNING
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 font-label-mono">v1.1.0-alpha</p>
                </div>

                <div className="flex gap-8 text-center text-xs items-center">
                  <div>
                    <div className="text-on-surface-variant font-label-mono uppercase text-[9px]">Precision</div>
                    <div className="font-bold text-on-surface text-base mt-0.5">0.821</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant font-label-mono uppercase text-[9px]">Recall</div>
                    <div className="font-bold text-on-surface text-base mt-0.5">0.945</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant font-label-mono uppercase text-[9px]">F1 Score</div>
                    <div className="font-bold text-on-surface text-base mt-0.5">0.878</div>
                  </div>
                  <div className="flex gap-2 pl-4 border-l border-outline-variant/20">
                    <button
                      onClick={() => alert("Initiating version rollback.")}
                      className="px-3 py-1.5 border border-outline/30 hover:border-risk-high/50 text-xs font-semibold text-risk-high rounded-lg hover:bg-white/5 transition-colors"
                    >
                      Rollback
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold text-base text-on-surface">Isolation Forest Outlier</h4>
                    <span className="px-2 py-0.5 bg-surface-container-highest border border-outline-variant/30 text-on-surface-variant text-[9px] font-bold rounded">
                      IDLE
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 font-label-mono">v4.0.0-legacy</p>
                </div>

                <div className="flex gap-8 text-center text-xs items-center">
                  <div>
                    <div className="text-on-surface-variant font-label-mono uppercase text-[9px]">Precision</div>
                    <div className="font-bold text-on-surface text-base mt-0.5">0.742</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant font-label-mono uppercase text-[9px]">Recall</div>
                    <div className="font-bold text-on-surface text-base mt-0.5">0.710</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant font-label-mono uppercase text-[9px]">F1 Score</div>
                    <div className="font-bold text-on-surface text-base mt-0.5">0.725</div>
                  </div>
                  <div className="flex gap-2 pl-4 border-l border-outline-variant/20">
                    <button
                      onClick={() => alert("Model retrain initialized.")}
                      className="px-3 py-1.5 border border-outline/30 hover:border-primary/50 text-xs font-semibold text-primary rounded-lg hover:bg-white/5 transition-colors"
                    >
                      Retrain Legacy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Metrics specifics telemetry status */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-outline-variant/10 text-center font-label-mono text-[10px]">
            <div>
              <div className="text-on-surface font-bold text-base">42.8%</div>
              <div className="text-on-surface-variant uppercase tracking-wider mt-1">Compute Load (Nominal)</div>
            </div>
            <div className="border-l border-outline-variant/10">
              <div className="text-on-surface font-bold text-base">24ms</div>
              <div className="text-on-surface-variant uppercase tracking-wider mt-1">Inference Latency (P99)</div>
            </div>
            <div className="border-l border-outline-variant/10">
              <div className="text-on-surface font-bold text-base">1.4%</div>
              <div className="text-on-surface-variant uppercase tracking-wider mt-1">Data Drift (Moderate)</div>
            </div>
            <div className="border-l border-outline-variant/10">
              <div className="text-on-surface font-bold text-base">14:02:51</div>
              <div className="text-on-surface-variant uppercase tracking-wider mt-1">Last Audit (ISO-27001)</div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "differential" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Model Performance Differential</h2>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Comparing real-world performance of Champion (v4.2.0) vs Challenger (v4.3.0) in Shadow mode.
            </p>
          </div>

          {/* Metric cards list */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-1">
              <div className="text-[9px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
                Precision Delta
              </div>
              <div className="text-2xl font-black text-risk-low font-display-kpi">
                +4.2%
              </div>
              <div className="text-[8px] text-on-surface-variant">vs baseline v4.2.0</div>
            </div>

            <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-1">
              <div className="text-[9px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
                Recall Delta
              </div>
              <div className="text-2xl font-black text-risk-low font-display-kpi">
                +1.8%
              </div>
              <div className="text-[8px] text-on-surface-variant">Target: &gt;94.5%</div>
            </div>

            <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-1">
              <div className="text-[9px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
                F1-Score
              </div>
              <div className="text-2xl font-black text-on-surface font-display-kpi">
                0.962
              </div>
              <div className="text-[8px] text-on-surface-variant">Challenger Peak</div>
            </div>

            <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-1">
              <div className="text-[9px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
                Inference Latency
              </div>
              <div className="text-2xl font-black text-risk-high font-display-kpi">
                18ms
              </div>
              <div className="text-[8px] text-risk-high">+2ms regression</div>
            </div>
          </div>

          {/* Middle details grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ROC Curve Overlay */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">ROC Curve Overlay</h4>
                <div className="flex gap-4 text-[9px] font-label-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    <span className="text-on-surface-variant">v4.2.0 Champion</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span className="text-on-surface-variant">v4.3.0 Challenger</span>
                  </div>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={championChallengerData} margin={{ left: -30, right: 0, top: 10, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#8d90a0" style={{ fontSize: "8px" }} />
                    <YAxis stroke="#8d90a0" style={{ fontSize: "8px" }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="champion" stroke="#ffffff" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="challenger" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right side sheet compare details */}
            <div className="lg:col-span-1 space-y-6">
              {/* Champion specs */}
              <div className="p-4 bg-[#07090e] border border-outline-variant/10 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[10px] font-label-mono text-on-surface-variant uppercase">
                  <span>v4.2.0 Champion</span>
                  <span className="text-xs px-2 py-0.5 bg-surface-container-high rounded text-on-surface-variant">Production</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>False Positives:</span><strong>1,242</strong></div>
                  <div className="flex justify-between"><span>Accuracy:</span><strong>92.48%</strong></div>
                </div>
              </div>

              {/* Challenger specs */}
              <div className="p-4 bg-[#07090e] border border-outline-variant/10 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[10px] font-label-mono text-on-surface-variant uppercase">
                  <span>v4.3.0 Challenger</span>
                  <span className="text-xs px-2 py-0.5 bg-[#002a78]/30 rounded text-primary font-bold">Shadow</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>False Positives:</span><strong className="text-risk-low">894 (-28%)</strong></div>
                  <div className="flex justify-between"><span>Accuracy:</span><strong>96.61%</strong></div>
                </div>
              </div>

              {/* Recommendation card */}
              <div className="p-4 bg-[#101915] border border-risk-low/30 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-risk-low font-bold">
                  <span className="material-symbols-outlined text-base">verified</span>
                  AI Recommendation
                </div>
                <p className="text-on-surface-variant leading-relaxed text-[11px]">
                  The Challenger v4.3.0 shows a significant reduction in false positives. Immediate Canary Rollout recommended.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Layout (Drift analysis & deployment control center) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Drift Analysis */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Drift Analysis</h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={driftData} margin={{ left: -30, right: 0, top: 10, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#8d90a0" style={{ fontSize: "8px" }} />
                    <YAxis stroke="#8d90a0" style={{ fontSize: "8px" }} />
                    <Tooltip />
                    <Bar dataKey="training" fill="#002a78" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="serving" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Deployment control center */}
            <div className="lg:col-span-1 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Deployment Control Center</h4>

              <div className="space-y-4">
                <div className="flex bg-[#07090e] rounded-xl border border-outline-variant/30 p-1 text-xs">
                  {["shadow", "canary", "full"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setDeployMode(mode)}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase ${
                        deployMode === mode
                          ? "bg-primary text-on-primary"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {deployMode === "canary" && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-label-mono uppercase tracking-wider text-on-surface-variant">
                      <span>Canary Traffic Ratio</span>
                      <span className="font-bold text-primary">{canaryTraffic}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={canaryTraffic}
                      onChange={(e) => setCanaryTraffic(Number(e.target.value))}
                      className="w-full h-1 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                )}

                <button
                  onClick={handleRollout}
                  className="w-full py-3 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm font-semibold">rocket_launch</span>
                  Rollout Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
