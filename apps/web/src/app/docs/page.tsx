"use client";

import { useState } from "react";

export default function DocsPage() {
  const [subTab, setSubTab] = useState<"hub" | "api">("hub");
  const [apiLang, setApiLang] = useState<"curl" | "python" | "nodejs">("curl");
  const [entityInput, setEntityInput] = useState("WALLET_9901, ACC_5542");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How does the MuleShield AI calculate risk scores?",
      a: "MuleShield AI computes scores using a combination of Graph Neural Networks (GCN) for network centrality profiling, and XGBoost classifiers for transactional anomalies (structuring patterns, rapid inflows).",
    },
    {
      q: "Can I export my investigation graph for law enforcement?",
      a: "Yes, you can export investigations as standard cryptographically signed FinCEN compliance dossiers (PDFs) or structured JSON node listings directly from the Case Dossier actions menu.",
    },
    {
      q: "How often are the mule node definitions updated?",
      a: "Definitions and entity linkages are updated in real-time as transactions traverse the ingestion pipeline. Global ML model weights are re-calibrated on a bi-weekly cycle.",
    },
  ];

  const handleTestRequest = () => {
    alert(`Mock API Request Dispatched:\nPOST /v2/investigations/start\nPayload: { entity_ids: [${entityInput.split(",").map(s => `"${s.trim()}"`).join(", ")}] }`);
  };

  return (
    <div className="space-y-6">
      {/* Top sub-tabs */}
      <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
        <div className="flex gap-6">
          <button
            onClick={() => setSubTab("hub")}
            className={`pb-2 font-label-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
              subTab === "hub" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Help Center Hub
          </button>
          <button
            onClick={() => setSubTab("api")}
            className={`pb-2 font-label-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
              subTab === "api" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            API Reference
          </button>
        </div>

        <div className="flex gap-4 text-xs font-semibold">
          <span className="px-3 py-1 bg-risk-low/10 border border-risk-low/20 text-risk-low rounded-xl">
            API Version: v2.4.1-stable
          </span>
        </div>
      </div>

      {/* SUB-TABS RENDERING */}
      {subTab === "hub" && (
        <div className="space-y-8 animate-fade-in">
          {/* Help Hub Search */}
          <div className="p-8 rounded-2xl border border-outline-variant/30 bg-surface-container-low text-center space-y-4">
            <h2 className="text-xl font-bold text-on-surface">MuleShield AI Help Center</h2>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Search documentation, FAQs, and API guides to configure your forensic workflows.
            </p>
            <div className="max-w-lg mx-auto flex gap-2">
              <input
                type="text"
                placeholder="Search articles, guides, or endpoints..."
                className="w-full bg-[#07090e] border border-outline-variant/30 rounded-xl px-4 py-2.5 text-xs text-on-surface focus:outline-none"
              />
              <button
                onClick={() => alert("Search result mapping loaded.")}
                className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-all"
              >
                Search
              </button>
            </div>
            <div className="flex justify-center gap-3 text-[10px] font-label-mono text-on-surface-variant">
              <span>Popular:</span>
              <span className="text-primary hover:underline cursor-pointer">API Webhooks</span>
              <span>•</span>
              <span className="text-primary hover:underline cursor-pointer">Risk Scoring Logic</span>
              <span>•</span>
              <span className="text-primary hover:underline cursor-pointer">SAML Integration</span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Documentation", desc: "Full user guides for investigators and admin managers.", icon: "menu_book" },
              { title: "API Reference", desc: "Technical endpoints for backend system integrations.", icon: "code" },
              { title: "Support Tickets", desc: "Track and manage your open assistance requests.", icon: "confirmation_number" },
              { title: "Release Notes", desc: "What's new in the Sentinel Intelligence ecosystem.", icon: "newspaper" },
            ].map((card, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low hover:border-outline-variant/60 transition-all cursor-pointer"
                onClick={() => {
                  if (card.title === "API Reference") setSubTab("api");
                  else alert(`${card.title} module details.`);
                }}
              >
                <span className="material-symbols-outlined text-primary text-2xl p-2 bg-primary/10 rounded-xl border border-primary/20">
                  {card.icon}
                </span>
                <h4 className="font-bold text-sm text-on-surface mt-4">{card.title}</h4>
                <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Middle Knowledge Base and Release notes Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KB Categories */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
              <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                Knowledge Base Categories
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Getting Started", desc: "Onboarding essentials and system setup workflows.", icon: "rocket_launch" },
                  { label: "Investigation Workflows", desc: "How to trace illicit funds and coordinate freeze logs.", icon: "travel_explore" },
                  { label: "Alert Tuning", desc: "Reducing false positives with advanced compliance weights.", icon: "tune" },
                  { label: "Admin Governance", desc: "Permission role auditing and SOC2 compliance ledgers.", icon: "gavel" },
                ].map((kb, idx) => (
                  <div key={idx} className="p-4 bg-[#07090e] border border-outline-variant/10 rounded-xl flex gap-3 items-start hover:border-primary/30 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-primary text-lg mt-0.5">{kb.icon}</span>
                    <div>
                      <div className="font-bold text-xs text-on-surface">{kb.label}</div>
                      <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">{kb.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Release notes & System Health */}
            <div className="lg:col-span-1 space-y-6">
              <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
                <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                  Recent Release Notes
                </h3>
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between font-bold">
                      <span className="text-on-surface">v2.4.1 - Precision Update</span>
                      <span className="text-[9px] text-on-surface-variant">Nov 12</span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">
                      Improved graph UI rendering and added new search filters.
                    </p>
                  </div>
                  <div className="border-t border-outline-variant/10 pt-3">
                    <div className="flex justify-between font-bold">
                      <span className="text-on-surface">v2.4.0 - Major Integration</span>
                      <span className="text-[9px] text-on-surface-variant">Oct 28</span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">
                      Launched unified user profile settings and multi-tenant systems.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="p-4 bg-[#0c1511] border border-risk-low/20 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider">System Status</div>
                  <div className="text-xs font-bold text-risk-low mt-1">99.98% Operational</div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-risk-low animate-pulse" />
              </div>
            </div>
          </div>

          {/* FAQs Accordion */}
          <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Featured FAQs
            </h3>
            <div className="space-y-2">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-outline-variant/10 rounded-xl overflow-hidden transition-all bg-[#07090e]/40"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full p-4 flex justify-between items-center text-left text-xs font-bold text-on-surface hover:bg-[#07090e]/60"
                  >
                    <span>{faq.q}</span>
                    <span className="material-symbols-outlined text-sm">
                      {activeFaq === idx ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {activeFaq === idx && (
                    <div className="p-4 pt-0 text-[11px] text-on-surface-variant leading-relaxed border-t border-outline-variant/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === "api" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in">
          {/* Documentation parameters columns */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
            <div>
              <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold rounded font-label-mono">
                POST
              </span>
              <h3 className="text-lg font-bold text-on-surface mt-2">/v2/investigations/start</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Triggers the automated AI reasoning engine to analyze a cluster of entities and transactions for potential money laundering patterns.
              </p>
            </div>

            {/* Auth Header Card */}
            <div className="p-4 bg-[#07090e] border border-outline-variant/20 rounded-xl space-y-2 text-xs">
              <h5 className="font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">vpn_key</span>
                Authorization Header
              </h5>
              <p className="text-[10px] text-on-surface-variant font-label-mono leading-relaxed">
                All requests must include the <code className="text-primary font-bold">Authorization</code> header with your Bearer token:
              </p>
              <div className="p-2 bg-surface-container-low rounded border border-outline-variant/10 font-label-mono text-[9px] text-on-surface select-all">
                Authorization: Bearer MS_AI_LIVE_xxxxxxx
              </div>
            </div>

            {/* Table parameters */}
            <div className="space-y-4 pt-4 border-t border-outline-variant/10">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Request Parameters</h4>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-mono text-[9px] uppercase">
                      <th className="py-2.5">Parameter</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-outline-variant/10">
                      <td className="py-3 font-bold text-on-surface font-label-mono">entity_ids <span className="text-risk-critical text-[8px] font-bold">REQUIRED</span></td>
                      <td className="py-3 font-label-mono text-on-surface-variant">array[string]</td>
                      <td className="py-3 text-on-surface-variant leading-relaxed">List of unique entity identifiers (Wallets, Bank Accounts) to be evaluated.</td>
                    </tr>
                    <tr className="border-b border-outline-variant/10">
                      <td className="py-3 font-bold text-on-surface font-label-mono">depth <span className="text-on-surface-variant/40 text-[8px] font-bold">OPTIONAL</span></td>
                      <td className="py-3 font-label-mono text-on-surface-variant">integer</td>
                      <td className="py-3 text-on-surface-variant leading-relaxed">The hop-count depth for graph traversal. Default is 3. Max is 10.</td>
                    </tr>
                    <tr className="border-b border-outline-variant/10">
                      <td className="py-3 font-bold text-on-surface font-label-mono">risk_threshold <span className="text-on-surface-variant/40 text-[8px] font-bold">OPTIONAL</span></td>
                      <td className="py-3 font-label-mono text-on-surface-variant">float</td>
                      <td className="py-3 text-on-surface-variant leading-relaxed">Minimum risk score (0.0 to 1.0) to flag an anomaly for immediate alert.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sandbox Try it out widget */}
            <div className="p-6 bg-[#090d16] border border-primary/20 rounded-xl space-y-4">
              <h4 className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">play_circle</span>
                Try It Out
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-on-surface-variant font-medium">Entity IDs</label>
                  <input
                    type="text"
                    value={entityInput}
                    onChange={(e) => setEntityInput(e.target.value)}
                    className="w-full bg-[#07090e] border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface font-label-mono focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-on-surface-variant font-medium">Environment</label>
                  <select className="w-full bg-[#07090e] border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface focus:outline-none">
                    <option>Sandbox (Pre-production)</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleTestRequest}
                className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-all"
              >
                Run Request
              </button>
            </div>
          </div>

          {/* Right code snippet preview (Image 3) */}
          <div className="lg:col-span-1 space-y-6 sticky top-6">
            <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
              <div className="flex bg-[#07090e] rounded-xl border border-outline-variant/30 p-1 text-xs">
                {["curl", "python", "nodejs"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setApiLang(lang as any)}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase ${
                      apiLang === lang ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              {/* Fenced code example box */}
              <div className="p-4 bg-[#07090e] border border-outline-variant/20 rounded-xl font-label-mono text-[9.5px] leading-relaxed text-risk-low overflow-x-auto whitespace-pre">
                {apiLang === "curl" && (
                  <>
                    <span className="text-on-surface-variant">curl --request POST \</span>
                    {"\n  --url 'https://api.muleshield.ai/v2/investigations/start' \\"}
                    {"\n  --header 'Authorization: Bearer YOUR_KEY' \\"}
                    {"\n  --header 'Content-Type: application/json' \\"}
                    {"\n  --data '{"}
                    {`\n    "entity_ids": ["WALLET_9901", "ACC_5542"],`}
                    {"\n    \"depth\": 5,"}
                    {"\n    \"risk_threshold\": 0.8,"}
                    {"\n    \"case_owner\": \"Investigator_Alpha\""}
                    {"\n  }'"}
                  </>
                )}
                {apiLang === "python" && (
                  <>
                    <span className="text-on-surface-variant">import requests</span>
                    {"\nurl = 'https://api.muleshield.ai/v2/investigations/start'"}
                    {"\nheaders = {"}
                    {"\n  'Authorization': 'Bearer YOUR_KEY',"}
                    {"\n  'Content-Type': 'application/json'"}
                    {"\n}"}
                    {"\npayload = {"}
                    {`\n  "entity_ids": ["WALLET_9901", "ACC_5542"],`}
                    {"\n  \"depth\": 5,"}
                    {"\n  \"risk_threshold\": 0.8"}
                    {"\n}"}
                    {"\nres = requests.post(url, headers=headers, json=payload)"}
                  </>
                )}
                {apiLang === "nodejs" && (
                  <>
                    <span className="text-on-surface-variant">const axios = require('axios');</span>
                    {"\nconst url = 'https://api.muleshield.ai/v2/investigations/start';"}
                    {"\nconst headers = {"}
                    {"\n  'Authorization': 'Bearer YOUR_KEY',"}
                    {"\n  'Content-Type': 'application/json'"}
                    {"\n};"}
                    {"\naxios.post(url, {"}
                    {`  entity_ids: ["WALLET_9901", "ACC_5542"],`}
                    {"\n  depth: 5,"}
                    {"\n  risk_threshold: 0.8"}
                    {"\n}, { headers });"}
                  </>
                )}
              </div>

              {/* Sample Response */}
              <div className="space-y-2">
                <div className="text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">
                  Response Sample (202)
                </div>
                <div className="p-4 bg-[#07090e] border border-outline-variant/20 rounded-xl font-label-mono text-[9px] leading-relaxed text-risk-low overflow-x-auto whitespace-pre">
                  {"{"}
                  {"\n  \"status\": \"initiated\","}
                  {"\n  \"job_id\": \"mule_scan_7882190\","}
                  {"\n  \"estimated_ms\": 450,"}
                  {"\n  \"links\": {"}
                  {"\n    \"status_check\": \"/v2/jobs/mule_scan_7882190\""}
                  {"\n  }"}
                  {"\n}"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
