"use client";

import { useState } from "react";

export default function SupportPage() {
  const [severity, setSeverity] = useState("HIGH");
  const [tickets, setTickets] = useState([
    { id: "#MST-8821", subject: "API Latency on MuleNode-X Cluster", category: "Technical", severity: "HIGH", status: "OPEN", update: "22m ago" },
    { id: "#MST-8794", subject: "False Positive in Crypto-Mixer Detection", category: "Compliance", severity: "MED", status: "PENDING", update: "2h ago" },
    { id: "#MST-8700", subject: "Batch 04 Analysis Export Error", category: "Technical", severity: "LOW", status: "RESOLVED", update: "Yesterday" },
  ]);

  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !desc) {
      alert("Please fill in both Subject and Detailed Description.");
      return;
    }
    const newId = `#MST-${Math.floor(1000 + Math.random() * 9000)}`;
    setTickets([
      { id: newId, subject, category: "Technical", severity, status: "OPEN", update: "Just now" },
      ...tickets,
    ]);
    setSubject("");
    setDesc("");
    alert(`Ticket ${newId} submitted successfully to compliance queue.`);
  };

  return (
    <div className="space-y-6">
      {/* Top statistics rows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-1.5">
          <div className="text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
            Active Tickets
          </div>
          <div className="text-3xl font-extrabold text-on-surface font-display-kpi flex items-baseline gap-2">
            04
            <span className="text-[10px] font-semibold text-risk-critical animate-pulse">2 Critical</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-1.5">
          <div className="text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
            Avg Response Time
          </div>
          <div className="text-3xl font-extrabold text-on-surface font-display-kpi flex items-baseline gap-2">
            12m
            <span className="text-[10px] font-semibold text-risk-low">↓4%</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-1.5">
          <div className="text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
            MTTR
          </div>
          <div className="text-3xl font-extrabold text-on-surface font-display-kpi flex items-baseline gap-2">
            3.4h
            <span className="text-[10px] font-semibold text-on-surface-variant">Standard</span>
          </div>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form and Ticket List Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submit ticket Form */}
          <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">support</span>
              Initialize Support Protocol
            </h3>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-medium">Subject Line</label>
                <input
                  type="text"
                  placeholder="Brief technical summary of the incident..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#07090e] border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-on-surface-variant font-medium">Incident Category</label>
                  <select className="w-full bg-[#07090e] border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface focus:outline-none">
                    <option>Technical (API/System)</option>
                    <option>Compliance (Rule Override)</option>
                    <option>Governance (Audit Issue)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-on-surface-variant font-medium block">Severity Protocol</label>
                  <div className="flex bg-[#07090e] rounded-xl border border-outline-variant/30 p-1">
                    {["LOW", "MED", "HIGH", "CRIT"].map((sev) => (
                      <button
                        type="button"
                        key={sev}
                        onClick={() => setSeverity(sev)}
                        className={`flex-1 py-1 rounded-lg text-[9px] font-bold ${
                          severity === sev
                            ? "bg-risk-high text-white"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-medium">Detailed Description</label>
                <textarea
                  rows={4}
                  placeholder="Provide system logs, error codes, or specific transaction IDs associated with the anomaly..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full bg-[#07090e] border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface focus:outline-none leading-relaxed"
                />
              </div>

              {/* Drag drop zone */}
              <div className="p-6 border border-dashed border-outline-variant/30 bg-[#07090e]/40 rounded-xl flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-primary/50 transition-colors">
                <span className="material-symbols-outlined text-primary text-3xl">cloud_upload</span>
                <div>
                  <div className="font-bold text-on-surface">Drag & Drop log files, JSON payloads, or screenshots</div>
                  <p className="text-[10px] text-on-surface-variant mt-1">Maximum 50MB per file • Restricted access encrypted</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setSubject(""); setDesc(""); }}
                  className="px-4 py-2 border border-outline-variant/30 rounded-xl text-xs font-semibold text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-all"
                >
                  Submit Ticket
                </button>
              </div>
            </div>
          </form>

          {/* Tickets History List */}
          <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-low">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest bg-surface-container-high/20">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Last Update</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t, i) => (
                  <tr key={i} className="border-b border-outline-variant/10 text-xs hover:bg-surface-container-high/20 transition-colors">
                    <td className="px-4 py-4 font-bold text-primary font-label-mono">{t.id}</td>
                    <td className="px-4 py-4 font-bold text-on-surface">{t.subject}</td>
                    <td className="px-4 py-4 text-on-surface-variant font-semibold">{t.category}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${t.severity === "CRIT" || t.severity === "HIGH" ? "text-risk-high border-risk-high/20 bg-risk-high/10" : "text-risk-low border-risk-low/20 bg-risk-low/10"}`}>
                          {t.severity}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-on-surface">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === "OPEN" ? "bg-risk-high animate-pulse" : t.status === "PENDING" ? "bg-risk-medium" : "bg-risk-low"}`}></span>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-label-mono text-on-surface-variant">{t.update}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side contact channels and system status map (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Direct Support channels */}
          <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Direct Intelligence Support
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex gap-3 items-center p-3.5 rounded-xl bg-[#07090e] border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary text-xl">phone_in_talk</span>
                <div>
                  <div className="text-[8px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">Emergency Hotline</div>
                  <div className="text-on-surface font-semibold mt-0.5">+1-800-SENTINEL-ML</div>
                </div>
              </div>

              <div className="flex gap-3 items-center p-3.5 rounded-xl bg-[#07090e] border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary text-xl">mail</span>
                <div>
                  <div className="text-[8px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">Email Escalation</div>
                  <div className="text-on-surface font-semibold mt-0.5">support@muleshield.ai</div>
                </div>
              </div>
            </div>
          </div>

          {/* Global Operations center */}
          <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Global Operations Center
            </h3>

            <div className="p-4 bg-[#07090e] border border-outline-variant/10 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-[9px] font-label-mono text-on-surface-variant uppercase">
                <span>North America</span>
                <span className="text-risk-low font-bold">99.98% Uptime</span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-label-mono text-on-surface-variant uppercase">
                <span>European Union</span>
                <span className="text-risk-low font-bold">100% Uptime</span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-label-mono text-on-surface-variant uppercase">
                <span>Asia-Pacific</span>
                <span className="text-risk-medium font-bold">94.12% Degraded</span>
              </div>
            </div>
          </div>

          {/* AI Chat assistant */}
          <div className="p-6 rounded-2xl border-2 border-primary/20 bg-[#090d16] space-y-4">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">smart_toy</span>
              Sentinel AI Assistant
            </h3>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Have a technical question about the MuleShield APIs or alert rules? Start a secure session.
            </p>
            <button
              onClick={() => alert("Secure AI assistant chat initialized.")}
              className="w-full py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
            >
              Start AI Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
