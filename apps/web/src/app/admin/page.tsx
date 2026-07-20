"use client";

import { useState, useMemo } from "react";
import { useUIStore } from "../../store/useUIStore";

export default function AdminPage() {
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<"health" | "users" | "developer" | "audit" | "notifications">("health");

  const [users, setUsers] = useState([
    { name: "Johnathan Doe", email: "j.doe@muleshield.ai", role: "Admin", mfa: "Enabled", lastLogin: "2023-11-24 14:22:10", status: "Active" },
    { name: "Sarah Al-Fayed", email: "sarah.a@muleshield.ai", role: "Investigator", mfa: "Enabled", lastLogin: "2023-11-24 09:15:33", status: "Active" },
    { name: "Marcus Knight", email: "m.knight@muleshield.ai", role: "Compliance Officer", mfa: "Pending Setup", lastLogin: "Never", status: "Invited" },
    { name: "Elena Volkov", email: "e.volkov@muleshield.ai", role: "Investigator", mfa: "Enabled", lastLogin: "2023-11-23 18:45:12", status: "Active" },
  ]);

  const [apiKeys, setApiKeys] = useState([
    { label: "Main_Prod_Gateway", token: "ms_live_••••••••3x9j", created: "2023-11-12", status: "Active" },
    { label: "SIEM_Integration", token: "ms_live_••••••••a4k8", created: "2024-01-05", status: "Active" },
    { label: "Test_Staging_Env", token: "ms_test_••••••••p22m", created: "2023-09-20", status: "Revoked" },
  ]);

  const auditLog = [
    { date: "2023-11-24 14:22:01.042", actor: "A. Lombardi", action: "RULE MODIFIED", entity: "AML_DET_0928", ip: "192.168.1.104", status: "VERIFIED" },
    { date: "2023-11-24 14:18:55.221", actor: "J. Schmidt", action: "CASE EXPORTED", entity: "INV_2023_882", ip: "45.22.19.12", status: "VERIFIED" },
    { date: "2023-11-24 14:15:30.981", actor: "System Kernel", action: "SESSION EXPIRED", entity: "USR_827_AUTH", ip: "127.0.0.1", status: "VERIFIED" },
    { date: "2023-11-24 13:58:12.001", actor: "A. Lombardi", action: "ROLE CREATED", entity: "ROLE_FORENSIC_L3", ip: "192.168.1.104", status: "VERIFIED" },
    { date: "2023-11-24 13:45:00.042", actor: "S. Chen", action: "ACCESS DENIED", entity: "SEC_ZONE_01", ip: "10.0.42.18", status: "ALERT" },
  ];

  // User list sorting
  const [userSortAsc, setUserSortAsc] = useState(true);
  const sortedUsers = useMemo(() => {
    const sorted = [...users];
    sorted.sort((a, b) => {
      return userSortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });
    return sorted;
  }, [users, userSortAsc]);

  const handleRevokeKey = (label: string) => {
    setApiKeys(apiKeys.map(k => k.label === label ? { ...k, status: "Revoked" } : k));
    addToast(`Successfully revoked API Key: ${label}`, "warning");
  };

  const handleCreateKey = () => {
    const keyName = `External_SDK_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newKey = {
      label: keyName,
      token: "ms_live_••••••••" + Math.random().toString(36).substring(2, 6),
      created: new Date().toISOString().split("T")[0],
      status: "Active"
    };
    setApiKeys([...apiKeys, newKey]);
    addToast(`Generated API Access Token for: ${keyName}`, "success");
  };

  return (
    <div className="space-y-6">
      {/* Top main tabs */}
      <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
        <div className="flex flex-wrap gap-4 lg:gap-6">
          {["health", "users", "developer", "audit", "notifications"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-2 font-label-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab === "health"
                ? "System Health"
                : tab === "users"
                ? "User Management"
                : tab === "developer"
                ? "Developer Portal"
                : tab === "audit"
                ? "Audit Ledger"
                : "Notification Channels"}
            </button>
          ))}
        </div>
      </div>

      {/* TABS VIEWS */}
      {activeTab === "health" && (
        <div className="space-y-6 text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-on-surface">System Health Status</h2>
              <p className="text-body-sm text-on-surface-variant mt-1">All systems operational. Global latency within SLA.</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 text-risk-low">Uptime: 99.998%</span>
              <span className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 text-on-surface">Incidents (24H): 0</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Infrastructure regions list */}
            <div className="lg:col-span-1 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">cloud</span>
                Infrastructure Nodes
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                  <span className="font-semibold text-on-surface">US-EAST-1 (VA)</span>
                  <span className="px-2 py-0.5 bg-risk-low/15 border border-risk-low/20 text-risk-low rounded text-[9px] font-bold">OPERATIONAL</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                  <span className="font-semibold text-on-surface">EU-CENTRAL-1 (FR)</span>
                  <span className="px-2 py-0.5 bg-risk-low/15 border border-risk-low/20 text-risk-low rounded text-[9px] font-bold">OPERATIONAL</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                  <span className="font-semibold text-on-surface">AP-SOUTHEAST-1 (SG)</span>
                  <span className="px-2 py-0.5 bg-risk-medium/15 border border-risk-medium/20 text-risk-medium rounded text-[9px] font-bold">DEGRADED (MS)</span>
                </div>
              </div>
            </div>

            {/* Load balancer and latency specifics */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container-lowest border border-outline-variant/15 rounded-xl space-y-1">
                <div className="text-[9px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">Load Balancer</div>
                <div className="text-2xl font-black text-on-surface">2.4M req/s</div>
              </div>
              <div className="p-4 bg-surface-container-lowest border border-outline-variant/15 rounded-xl space-y-1">
                <div className="text-[9px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">Firewall Blocks</div>
                <div className="text-2xl font-black text-risk-high">12.8K /min</div>
              </div>
              <div className="col-span-2 p-4 bg-surface-container-lowest border border-outline-variant/15 rounded-xl space-y-2">
                <div className="flex justify-between text-[9px] font-label-mono text-on-surface-variant uppercase font-bold">
                  <span>Global Payload Latency</span>
                  <span>124ms avg</span>
                </div>
                <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden w-full">
                  <div className="bg-primary h-full rounded-full w-[45%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Core Services Stats Grid (Kafka, Neo4j, Redis) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-on-surface text-xs font-label-mono">Kafka Broker</span>
                <span className="w-2 h-2 rounded-full bg-risk-low" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-label-mono">
                <div><div className="text-on-surface-variant text-[9px]">Throughput</div><div className="font-bold text-on-surface text-base">840 MB/s</div></div>
                <div><div className="text-on-surface-variant text-[9px]">Consumer Lag</div><div className="font-bold text-risk-low text-base">42ms</div></div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-on-surface text-xs font-label-mono">Neo4j Database</span>
                <span className="w-2 h-2 rounded-full bg-risk-low" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-label-mono">
                <div><div className="text-on-surface-variant text-[9px]">Cypher OPS</div><div className="font-bold text-on-surface text-base">12.5k /s</div></div>
                <div><div className="text-on-surface-variant text-[9px]">Node Count</div><div className="font-bold text-on-surface text-base">1.4B</div></div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-on-surface text-xs font-label-mono">Redis Cache</span>
                <span className="w-2 h-2 rounded-full bg-risk-high animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-label-mono">
                <div><div className="text-on-surface-variant text-[9px]">Hit Rate</div><div className="font-bold text-on-surface text-base">94.2%</div></div>
                <div><div className="text-on-surface-variant text-[9px]">Latency</div><div className="font-bold text-risk-high text-base">0.8ms</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-6 text-left">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h2 className="text-xl font-bold text-on-surface">Enterprise User Registry</h2>
              <p className="text-body-sm text-on-surface-variant mt-1">Configure global access controls, RBAC matrices, and security protocols.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => addToast("User list exported to compliance bundle.", "success")}
                className="px-4 py-2 border border-outline-variant/30 hover:border-primary/45 rounded-xl text-xs font-semibold text-on-surface hover:bg-white/5 transition-all"
              >
                Export User List
              </button>
              <button
                onClick={() => addToast("Invitation email link dispatched successfully.", "success")}
                className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-opacity"
              >
                Invite User
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-low max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                <thead className="sticky top-0 bg-surface-container-low/95 backdrop-blur-md z-10 border-b border-outline-variant/30">
                  <tr className="text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest">
                    <th
                      onClick={() => setUserSortAsc(!userSortAsc)}
                      className="px-4 py-4 cursor-pointer hover:text-on-surface w-72"
                    >
                      <div className="flex items-center gap-1">
                        User / Identity
                        <span className="material-symbols-outlined text-xs">
                          {userSortAsc ? "arrow_upward" : "arrow_downward"}
                        </span>
                      </div>
                    </th>
                    <th className="px-4 py-4 w-44">Role</th>
                    <th className="px-4 py-4 text-center w-28">MFA Status</th>
                    <th className="px-4 py-4 w-36">Last Login</th>
                    <th className="px-4 py-4 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {sortedUsers.map((u, i) => (
                    <tr key={i} className="text-xs hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-4 py-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-secondary-container text-primary font-bold flex items-center justify-center border border-outline-variant/30 flex-shrink-0">
                          {u.name.split(" ").map(n=>n[0]).join("")}
                        </span>
                        <div className="truncate">
                          <div className="font-bold text-on-surface truncate">{u.name}</div>
                          <div className="text-[10px] text-on-surface-variant font-label-mono truncate mt-0.5">{u.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 truncate">
                        <span className="px-2 py-0.5 bg-surface-container-lowest border border-outline-variant/20 rounded font-label-mono text-[9px] uppercase text-on-surface">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          <span className={`text-[10px] font-semibold ${u.mfa === "Enabled" ? "text-risk-low" : "text-risk-high"}`}>
                            {u.mfa}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-label-mono text-on-surface-variant truncate">{u.lastLogin}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-3 text-on-surface-variant">
                          <button
                            onClick={() => addToast(`Role configurations loaded for ${u.name}`, "info")}
                            className="material-symbols-outlined text-base hover:text-primary transition-colors"
                          >
                            edit
                          </button>
                          <button
                            onClick={() => {
                              setUsers(users.filter(x => x.email !== u.email));
                              addToast(`Deauthorized security credential for: ${u.name}`, "warning");
                            }}
                            className="material-symbols-outlined text-base hover:text-primary transition-colors"
                          >
                            delete_outline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Authentication Health specifics sidebar */}
            <div className="lg:col-span-1 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
              <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">Access Telemetry</h3>
              <div className="space-y-4 text-xs font-label-mono">
                <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                  <div className="text-on-surface-variant text-[9px]">Authentication Health</div>
                  <div className="font-black text-2xl text-risk-low mt-1">94% <span className="text-xs text-risk-low">↑2.1%</span></div>
                  <p className="text-[9px] text-on-surface-variant mt-1">Active MFA Adoption Rate</p>
                </div>
                <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                  <div className="text-on-surface-variant text-[9px]">System Load</div>
                  <div className="font-black text-2xl text-on-surface mt-1">12.4 ms <span className="text-xs text-risk-low">Stable</span></div>
                  <p className="text-[9px] text-on-surface-variant mt-1">Avg Access Latency</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "developer" && (
        <div className="space-y-6 text-left">
          <div>
            <h2 className="text-xl font-bold text-on-surface">API Gateway & Developer Portal</h2>
            <p className="text-body-sm text-on-surface-variant mt-1">Integrate MuleShield's forensic intelligence directly into your institutional core.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Keys management */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">API Key Management</h4>
                <button
                  onClick={handleCreateKey}
                  className="px-3.5 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-xl flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-xs">add</span>
                  Generate Key
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
                <table className="w-full text-left border-collapse table-fixed min-w-[500px]">
                  <thead className="bg-surface-container-high/20 border-b border-outline-variant/30">
                    <tr className="text-on-surface-variant font-label-mono text-[9px] uppercase tracking-wider">
                      <th className="px-4 py-3">Label</th>
                      <th className="px-4 py-3 w-56">Token</th>
                      <th className="px-4 py-3 w-28">Created</th>
                      <th className="px-4 py-3 text-center w-24">Status</th>
                      <th className="px-4 py-3 text-right w-24">Revoke</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {apiKeys.map((key, i) => (
                      <tr key={i} className="text-xs hover:bg-surface-container-high/20 transition-colors">
                        <td className="px-4 py-4 font-bold text-on-surface truncate">{key.label}</td>
                        <td className="px-4 py-4 font-label-mono text-on-surface-variant truncate">{key.token}</td>
                        <td className="px-4 py-4 font-label-mono text-on-surface-variant truncate">{key.created}</td>
                        <td className="px-4 py-4 text-center font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              key.status === "Active" ? "bg-risk-low/15 text-risk-low" : "bg-surface-container-highest text-on-surface-variant"
                            }`}
                          >
                            {key.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => handleRevokeKey(key.label)}
                            disabled={key.status === "Revoked"}
                            className="material-symbols-outlined text-base hover:text-risk-critical text-on-surface-variant disabled:opacity-30 transition-colors"
                            title="Revoke Token"
                          >
                            block
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Webhook specs */}
            <div className="lg:col-span-1 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider flex items-center justify-between">
                Webhook Channels
                <span className="px-2 py-0.5 bg-risk-low/10 border border-risk-low/20 text-risk-low text-[8px] font-bold rounded">Active</span>
              </h4>
              <div className="p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl space-y-2 text-xs">
                <h5 className="font-bold text-on-surface">Incident Handler Production</h5>
                <p className="text-[10px] text-on-surface-variant font-label-mono truncate">https://webhooks.bank.internal/v1/mules...</p>
              </div>
              <button
                onClick={() => addToast("Successfully registered production webhook receiver.", "success")}
                className="w-full py-2.5 border border-outline/30 hover:border-primary/50 text-xs font-semibold rounded-xl hover:bg-white/5 transition-colors"
              >
                Register New Endpoint
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="space-y-6 text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-on-surface">Cryptographic Audit Ledger</h2>
              <p className="text-body-sm text-on-surface-variant mt-1">Verifiable ledger recording all compliance modifications.</p>
            </div>
            <button
              onClick={() => addToast("Audit trail PDF report compiled successfully.", "success")}
              className="px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-xs">download</span>
              Export Encrypted PDF
            </button>
          </div>

          {/* Metric specs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-1">
              <div className="text-[9px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">Total Actions</div>
              <div className="text-2xl font-black text-on-surface font-display-kpi">142,891</div>
            </div>
            <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-1">
              <div className="text-[9px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">Sensitive Ops</div>
              <div className="text-2xl font-black text-risk-high font-display-kpi">842</div>
            </div>
            <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-1">
              <div className="text-[9px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">Verified Integrity</div>
              <div className="text-2xl font-black text-risk-low font-display-kpi">100%</div>
            </div>
            <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-1">
              <div className="text-[9px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">Unique Actors</div>
              <div className="text-2xl font-black text-on-surface font-display-kpi">18</div>
            </div>
          </div>

          {/* Audit ledger table list */}
          <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-low max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
              <thead className="sticky top-0 bg-surface-container-low/95 backdrop-blur-md z-10 border-b border-outline-variant/30">
                <tr className="text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest">
                  <th className="px-4 py-4 w-44">Timestamp</th>
                  <th className="px-4 py-4 w-32">Actor</th>
                  <th className="px-4 py-4 w-44">Action Type</th>
                  <th className="px-4 py-4">Entity ID</th>
                  <th className="px-4 py-4 w-36">IP Address</th>
                  <th className="px-4 py-4 text-right w-32">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {auditLog.map((log, i) => (
                  <tr key={i} className="text-xs hover:bg-surface-container-high/20 transition-colors">
                    <td className="px-4 py-4 font-label-mono text-on-surface truncate">{log.date}</td>
                    <td className="px-4 py-4 font-semibold text-on-surface truncate">{log.actor}</td>
                    <td className="px-4 py-4 truncate">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${log.status === "ALERT" ? "text-risk-critical border-risk-critical/20 bg-risk-critical/10" : "text-on-surface-variant border-outline-variant/30"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-label-mono text-on-surface truncate">{log.entity}</td>
                    <td className="px-4 py-4 font-label-mono text-on-surface-variant truncate">{log.ip}</td>
                    <td className="px-4 py-4 text-right font-bold truncate">
                      <span className={log.status === "VERIFIED" ? "text-risk-low" : "text-risk-critical"}>
                        {log.status === "VERIFIED" ? "✓ SECURE" : "⚠ ALERT"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="space-y-6 text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-on-surface">Notification Channels</h2>
              <p className="text-body-sm text-on-surface-variant mt-1">Configure real-time sync notification triggers for Slack, Teams, and Webhook channels.</p>
            </div>
            <button
              onClick={() => addToast("Channels configured and saved.", "success")}
              className="px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl"
            >
              Configure Channels
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low flex items-center justify-between">
              <div>
                <div className="text-[10px] font-label-mono text-on-surface-variant font-bold">Slack</div>
                <div className="text-xs font-semibold text-risk-low mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-risk-low animate-pulse"></span>
                  Connected
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low flex items-center justify-between">
              <div>
                <div className="text-[10px] font-label-mono text-on-surface-variant font-bold">MS Teams</div>
                <div className="text-xs font-semibold text-risk-medium mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-risk-medium"></span>
                  Delayed (12s)
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low flex items-center justify-between">
              <div>
                <div className="text-[10px] font-label-mono text-on-surface-variant font-bold">Global SMS</div>
                <div className="text-xs font-semibold text-risk-low mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-risk-low"></span>
                  99.9% Delivery
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low flex items-center justify-between">
              <div>
                <div className="text-[10px] font-label-mono text-on-surface-variant font-bold">Email Relay</div>
                <div className="text-xs font-semibold text-risk-low mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-risk-low"></span>
                  Operational
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
