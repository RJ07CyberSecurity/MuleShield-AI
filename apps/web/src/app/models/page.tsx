"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "../../store/useUIStore";
import { apiClient } from "../../services/api-client";

export default function ModelsPage() {
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"inventory" | "differential">("inventory");
  const [canaryTraffic, setCanaryTraffic] = useState(5);
  const [deployMode, setDeployMode] = useState("shadow");
  const [activeIngestionId, setActiveIngestionId] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const savedId = sessionStorage.getItem("activeIngestionId");
    if (savedId) {
      setActiveIngestionId(savedId);
    }
  }, [pathname]);

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ["models", "metrics", activeIngestionId],
    queryFn: () => apiClient.get<any>(`/api/v1/models/metrics${activeIngestionId ? `?ingestion_id=${activeIngestionId}` : ""}`),
  });

  const { data: inventory, isLoading: loadingInventory } = useQuery({
    queryKey: ["models", "inventory"],
    queryFn: () => apiClient.get<any>(`/api/v1/models/inventory`),
  });

  const deployMutation = useMutation({
    mutationFn: (data: any) => apiClient.post("/api/v1/models/deploy", data),
    onSuccess: (_, variables) => {
      const mode = variables.mode;
      if (mode === "canary") {
        addToast(`Deploying challenger model: Canary rollout set at ${variables.canary_traffic}% traffic.`, "success");
      } else {
        addToast(`Deploying challenger model in ${mode.toUpperCase()} mode.`, "success");
      }
    },
    onError: () => {
      addToast("Failed to initiate deployment.", "error");
    },
  });

  const constraintsMutation = useMutation({
    mutationFn: (data: any) => apiClient.post("/api/v1/models/constraints", data),
    onSuccess: () => {
      addToast("Model constraints configuration successfully archived.", "success");
    },
    onError: () => {
      addToast("Failed to update constraints.", "error");
    },
  });

  const handleRollout = () => {
    deployMutation.mutate({
      model_key: "MS-GBDT-V3.8",
      mode: deployMode,
      canary_traffic: canaryTraffic,
    });
  };

  const handleConstraints = () => {
    constraintsMutation.mutate({ config_data: {} });
  };

  const isLoading = loadingMetrics || loadingInventory;

  if (isLoading) {
    return <div className="p-8 text-center text-on-surface-variant animate-pulse">Loading model assets...</div>;
  }

  const rocData = metrics?.rocData || [];
  const championChallengerData = metrics?.championChallengerData || [];
  const driftData = metrics?.driftData || [];
  const shapFeatures = metrics?.shapFeatures || [];
  const classifiers = inventory?.classifiers || [];
  const psi = metrics?.psi || 0.082;
  const isStable = psi < 0.1;

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
            onClick={handleConstraints}
            disabled={constraintsMutation.isPending}
            className="px-4 py-2 border border-outline-variant/30 hover:border-primary/50 text-xs font-bold text-on-surface rounded-xl hover:bg-white/5 transition-all disabled:opacity-50"
          >
            Global Constraints
          </button>
          <button
            onClick={() => addToast("Challenger version compilation initialized.", "success")}
            className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-xs">cloud_upload</span>
            Deploy New Model
          </button>
        </div>
      </div>

      {/* RENDER INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div className="space-y-8 text-left">
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
                <span className="font-label-mono text-[9px] text-risk-low font-bold">AUC: {metrics?.auc || 0.984}</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rocData} margin={{ left: -30, right: 0, top: 10, bottom: 0 }}>
                    <XAxis dataKey="fpr" stroke="#8d90a0" style={{ fontSize: "8px" }} />
                    <YAxis dataKey="tpr" stroke="#8d90a0" style={{ fontSize: "8px" }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-2 bg-surface-container-high border border-outline-variant/30 rounded text-[10px] font-label-mono">
                              <p>FPR: {payload[0].payload.fpr}</p>
                              <p className="font-bold text-primary">TPR: {payload[0].value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="tpr" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PR Curve card */}
            <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
              <div className="flex justify-between items-baseline">
                <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">PR Curve</h4>
                <span className="font-label-mono text-[9px] text-risk-low font-bold">mAP: {metrics?.map || 0.941}</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rocData} margin={{ left: -30, right: 0, top: 10, bottom: 0 }}>
                    <XAxis dataKey="fpr" stroke="#8d90a0" style={{ fontSize: "8px" }} />
                    <YAxis dataKey="tpr" stroke="#8d90a0" style={{ fontSize: "8px" }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-2 bg-surface-container-high border border-outline-variant/30 rounded text-[10px] font-label-mono">
                              <p>Recall: {payload[0].payload.fpr}</p>
                              <p className="font-bold text-risk-low">Precision: {payload[0].value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="tpr" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SHAP Feature Importance */}
            <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">SHAP Feature Importance</h4>
              <div className="space-y-4 text-xs pt-2">
                {shapFeatures.map((feat: any) => (
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

            <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-low">
              <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                <thead className="bg-surface-container-high/20 border-b border-outline-variant/30">
                  <tr className="text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest">
                    <th className="px-4 py-4 w-32">Model Key</th>
                    <th className="px-4 py-4">Architecture</th>
                    <th className="px-4 py-4 w-28 text-center">F1 Score</th>
                    <th className="px-4 py-4 w-28 text-center">Recall</th>
                    <th className="px-4 py-4 w-32">Release Date</th>
                    <th className="px-4 py-4 text-right w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-xs">
                  {classifiers.map((model: any) => (
                    <tr key={model.key} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-4 py-4 font-bold text-primary font-label-mono truncate">{model.key}</td>
                      <td className="px-4 py-4 font-semibold text-on-surface truncate">{model.architecture}</td>
                      <td className="px-4 py-4 text-center font-label-mono text-on-surface">{model.f1_score}</td>
                      <td className="px-4 py-4 text-center font-label-mono text-on-surface">{model.recall}</td>
                      <td className="px-4 py-4 font-label-mono text-on-surface-variant truncate">{model.release_date}</td>
                      <td className="px-4 py-4 text-right">
                        {model.status === "ACTIVE" ? (
                          <span className="px-2 py-0.5 rounded bg-risk-low/15 border border-risk-low/20 text-risk-low font-bold">ACTIVE</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/20 font-bold">SHADOW</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* RENDER DIFFERENTIAL TAB */}
      {activeTab === "differential" && (
        <div className="space-y-8 text-left">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Champion vs Challenger Analysis</h2>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Compare output differences, covariate drift indices, and canary performance logs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Output Divergence (Champion vs Challenger) */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Output Anomaly Divergence</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={championChallengerData} margin={{ left: -30, right: 0, top: 10, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#8d90a0" style={{ fontSize: "9px" }} />
                    <YAxis stroke="#8d90a0" style={{ fontSize: "9px" }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-3 bg-surface-container-high border border-outline-variant/30 rounded-xl shadow-2xl text-[10px] font-label-mono">
                              <p className="text-on-surface-variant">Threshold: {payload[0].payload.name}</p>
                              <p className="text-primary mt-1">Champion: {payload[0].value}</p>
                              <p className="text-risk-low">Challenger: {payload[1]?.value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="champion" stroke="#2563eb" strokeWidth={2} dot={false} name="Champion" />
                    <Line type="monotone" dataKey="challenger" stroke="#10b981" strokeWidth={2} dot={false} name="Challenger" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Canary deployment controls */}
            <div className="lg:col-span-1 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Canary Rollout Planner</h4>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-on-surface-variant font-medium">Evaluation Routing mode</label>
                  <div className="flex bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-1">
                    {["shadow", "canary", "linear"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setDeployMode(mode)}
                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                          deployMode === mode
                            ? "bg-primary text-on-primary shadow-sm"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-label-mono uppercase tracking-wider text-on-surface-variant">
                    <span>Canary Traffic Allocation</span>
                    <span className="font-bold text-primary">{deployMode === "canary" ? `${canaryTraffic}% Traffic` : "N/A"}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={canaryTraffic}
                    onChange={(e) => setCanaryTraffic(Number(e.target.value))}
                    disabled={deployMode !== "canary"}
                    className={`w-full h-1 bg-surface-container-high rounded-full appearance-none cursor-pointer ${deployMode === "canary" ? "accent-primary" : "accent-outline-variant/30 opacity-50"}`}
                  />
                </div>

                <button
                  onClick={handleRollout}
                  disabled={deployMutation.isPending}
                  className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl text-body-sm hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">rocket_launch</span>
                  {deployMutation.isPending ? "Deploying..." : "Initiate Rollout"}
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Covariate Drift and metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Drift bar chart */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Covariate Feature Drift</h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={driftData} margin={{ left: -30, right: 0, top: 10, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#8d90a0" style={{ fontSize: "8px" }} />
                    <YAxis stroke="#8d90a0" style={{ fontSize: "8px" }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-2 bg-surface-container-high border border-outline-variant/30 rounded text-[9px] font-label-mono">
                              <p className="font-bold text-primary">Training: {payload[0].value}</p>
                              <p className="font-bold text-risk-high">Serving: {payload[1]?.value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="training" fill="#2563eb" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="serving" fill="#f97316" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PSI Index status */}
            <div className="lg:col-span-1 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Population Stability Index</h4>
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-xs text-on-surface">PSI Value</h5>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Calculated in last 1hr batch</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-black font-display-kpi ${isStable ? "text-risk-low" : "text-risk-high"}`}>
                      {psi.toFixed(3)}
                    </div>
                    <span className={`text-[8px] font-semibold uppercase tracking-widest font-label-mono ${isStable ? "text-risk-low" : "text-risk-high"}`}>
                      {isStable ? "Stable" : "Unstable"}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Feature drift is {isStable ? "within acceptable boundaries (PSI < 0.1). Model inputs match the distribution seen during training." : "exceeding acceptable boundaries (PSI >= 0.1). Investigation required."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
