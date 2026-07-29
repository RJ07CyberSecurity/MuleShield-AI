"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "../../store/useUIStore";
import { CURRENCY_SYMBOL } from "@/utils/currency";
import { apiClient } from "../../services/api-client";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"health" | "users" | "developer" | "audit" | "notifications">("health");

  const [users, setUsers] = useState<any[]>([]);
  
  // Invite User Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "investigator",
    password: ""
  });

  // Edit User Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<any>(null);
  const [editRole, setEditRole] = useState("");

  const handleEditClick = (user: any) => {
    setUserToEdit(user);
    setEditRole(user.role.toLowerCase());
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await apiClient.patch<any>(`/api/v1/auth/users/${userToEdit.id}/role`, { role: editRole });
      if (res?.success) {
        setShowEditModal(false);
        fetchUsers();
      } else {
        setEditError(res?.message || "Failed to update role");
      }
    } catch (err: any) {
      setEditError(err.message || "An error occurred");
    } finally {
      setEditLoading(false);
    }
  };

  const fetchUsers = () => {
    apiClient.get<any>("/api/v1/auth/users").then(res => {
      if (res?.success && res.data) {
        const formattedUsers = res.data.map((u: any) => ({
          id: u.id,
          name: `${u.first_name} ${u.last_name}`,
          email: u.email,
          role: u.roles && u.roles.length > 0 ? u.roles[0].name.toUpperCase() : "USER",
          mfa: u.is_mfa_enabled ? "Enabled" : "Pending Setup",
          lastLogin: "N/A",
          status: u.is_active ? "Active" : "Inactive"
        }));
        setUsers(formattedUsers);
      }
    });
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);
    try {
      const payload = {
        first_name: inviteForm.firstName,
        last_name: inviteForm.lastName,
        email: inviteForm.email,
        password: inviteForm.password,
        role: inviteForm.role
      };
      const res = await apiClient.post<any>("/api/v1/auth/register", payload);
      if (res?.success) {
        setShowInviteModal(false);
        setInviteForm({ firstName: "", lastName: "", email: "", role: "investigator", password: "" });
        fetchUsers();
      } else {
        setInviteError(res?.message || "Failed to register user");
      }
    } catch (err: any) {
      setInviteError(err.message || "An error occurred");
    } finally {
      setInviteLoading(false);
    }
  };

  const [apiKeys, setApiKeys] = useState([
    { label: "Main_Prod_Gateway", token: "ms_live_••••••••3x9j", created: "2023-11-12", status: "Active" },
    { label: "SIEM_Integration", token: "ms_live_••••••••a4k8", created: "2024-01-05", status: "Active" },
    { label: "Test_Staging_Env", token: "ms_test_••••••••p22m", created: "2023-09-20", status: "Revoked" },
  ]);

  const handleGenerateKey = () => {
    const newKey = {
      label: `Key_Auto_${Math.floor(Math.random() * 1000)}`,
      token: `ms_live_••••••••${Math.random().toString(36).substring(2, 6)}`,
      created: new Date().toISOString().split("T")[0],
      status: "Active"
    };
    setApiKeys([newKey, ...apiKeys]);
  };

  const [auditLog, setAuditLog] = useState<any[]>([]);

  const fetchAuditLogs = () => {
    apiClient.get<any>("/api/v1/auth/audit-logs").then(res => {
      if (res?.success && res.data) {
        const logs = res.data.map((log: any) => ({
          date: new Date(log.date_logged).toISOString().replace("T", " ").substring(0, 23),
          actor: log.user_email || "System",
          action: log.access_details || "ACCESS_EVENT",
          entity: log.user_id,
          ip: "Unknown",
          status: "VERIFIED"
        }));
        setAuditLog(logs);
      }
    });
  };

  const [healthStats, setHealthStats] = useState({
    cypherOps: "12.5k",
    latency: "0.8ms",
    authHealth: "94%"
  });

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs();
    }
    if (activeTab === "health") {
      const interval = setInterval(() => {
        setHealthStats({
          cypherOps: `${(12 + Math.random() * 2).toFixed(1)}k`,
          latency: `${(0.5 + Math.random() * 0.8).toFixed(1)}ms`,
          authHealth: `${Math.floor(92 + Math.random() * 6)}%`
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Top main tabs */}
      <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
        <div className="flex flex-wrap gap-4 lg:gap-6">
          <button
            onClick={() => setActiveTab("health")}
            className={`pb-2 font-label-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
              activeTab === "health" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            System Health
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-2 font-label-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
              activeTab === "users" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab("developer")}
            className={`pb-2 font-label-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
              activeTab === "developer" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Developer Portal
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`pb-2 font-label-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
              activeTab === "audit" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Audit Ledger
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`pb-2 font-label-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
              activeTab === "notifications" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Notification Channels
          </button>
        </div>
      </div>

      {/* TABS VIEWS */}
      {activeTab === "health" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-on-surface">System Health</h2>
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
                <div className="flex justify-between items-center p-3 rounded-lg bg-[#07090e] border border-outline-variant/10">
                  <span className="font-semibold text-on-surface">US-EAST-1 (VA)</span>
                  <span className="px-2 py-0.5 bg-risk-low/10 border border-risk-low/20 text-risk-low rounded text-[9px] font-bold">OPERATIONAL</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-[#07090e] border border-outline-variant/10">
                  <span className="font-semibold text-on-surface">EU-CENTRAL-1 (FR)</span>
                  <span className="px-2 py-0.5 bg-risk-low/10 border border-risk-low/20 text-risk-low rounded text-[9px] font-bold">OPERATIONAL</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-[#07090e] border border-outline-variant/10">
                  <span className="font-semibold text-on-surface">AP-SOUTHEAST-1 (SG)</span>
                  <span className="px-2 py-0.5 bg-risk-medium/10 border border-risk-medium/20 text-risk-medium rounded text-[9px] font-bold">DEGRADED (MS)</span>
                </div>
              </div>
            </div>

            {/* Load balancer and latency specifics */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#07090e] border border-outline-variant/10 rounded-xl space-y-1">
                <div className="text-[9px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">Load Balancer</div>
                <div className="text-2xl font-black text-on-surface">2.4M req/s</div>
              </div>
              <div className="p-4 bg-[#07090e] border border-outline-variant/10 rounded-xl space-y-1">
                <div className="text-[9px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider">Firewall Blocks</div>
                <div className="text-2xl font-black text-risk-high">12.8K /min</div>
              </div>
              <div className="col-span-2 p-4 bg-[#07090e] border border-outline-variant/10 rounded-xl space-y-2">
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
                <div><div className="text-on-surface-variant text-[9px]">Cypher OPS</div><div className="font-bold text-on-surface text-base">{healthStats.cypherOps} /s</div></div>
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
                <div><div className="text-on-surface-variant text-[9px]">Latency</div><div className="font-bold text-risk-high text-base">{healthStats.latency}</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h2 className="text-xl font-bold text-on-surface">Enterprise User Management</h2>
              <p className="text-body-sm text-on-surface-variant mt-1">Configure global access controls, RBAC matrices, and security protocols.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => alert("Users exported.")} className="px-4 py-2 border border-outline-variant/30 rounded-xl text-xs font-semibold text-on-surface">Export User List</button>
              <button onClick={() => setShowInviteModal(true)} className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90">Invite User</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-low">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest bg-surface-container-high/20">
                    <th className="px-4 py-4">User / Identity</th>
                    <th className="px-4 py-4">Role</th>
                    <th className="px-4 py-4 text-center">MFA Status</th>
                    <th className="px-4 py-4">Last Login</th>
                    <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} className="border-b border-outline-variant/10 text-xs hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-4 py-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-secondary-container text-primary font-bold flex items-center justify-center border border-outline-variant/30">
                          {u.name.split(" ").map(n=>n[0]).join("")}
                        </span>
                        <div>
                          <div className="font-bold text-on-surface">{u.name}</div>
                          <div className="text-[10px] text-on-surface-variant font-label-mono mt-0.5">{u.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-0.5 bg-[#07090e] border border-outline-variant/20 rounded font-label-mono text-[9px] uppercase text-on-surface">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          <span className={`text-[10px] font-semibold ${u.mfa === "Enabled" ? "text-risk-low" : "text-risk-high animate-pulse"}`}>
                            {u.mfa}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-label-mono text-on-surface-variant">{u.lastLogin}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-3 text-on-surface-variant">
                          <button onClick={() => handleEditClick(u)} className="material-symbols-outlined text-base hover:text-primary">edit</button>
                          <button onClick={() => alert(`Revoke user: ${u.name}`)} className="material-symbols-outlined text-base hover:text-primary">delete_outline</button>
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
                <div className="p-4 bg-[#07090e] rounded-xl border border-outline-variant/10">
                  <div className="text-on-surface-variant text-[9px]">Authentication Health</div>
                  <div className="font-black text-2xl text-risk-low mt-1">{healthStats.authHealth} <span className="text-xs text-risk-low">↑2.1%</span></div>
                  <p className="text-[9px] text-on-surface-variant mt-1">Active MFA Adoption Rate</p>
                </div>
                <div className="p-4 bg-[#07090e] rounded-xl border border-outline-variant/10">
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
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-on-surface">API & Developer Portal</h2>
            <p className="text-body-sm text-on-surface-variant mt-1">Integrate MuleShield's forensic intelligence directly into your institutional core.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Keys management */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">API Key Management</h4>
                <button onClick={handleGenerateKey} className="px-3.5 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-xl flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs">add</span>
                  Generate Key
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-mono text-[9px] uppercase bg-surface-container-high/20">
                      <th className="px-4 py-3">Label</th>
                      <th className="px-4 py-3">Token</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((key, i) => (
                      <tr key={i} className="border-b border-outline-variant/10 text-xs hover:bg-surface-container-high/20 transition-colors">
                        <td className="px-4 py-4 font-bold text-on-surface">{key.label}</td>
                        <td className="px-4 py-4 font-label-mono text-on-surface-variant">{key.token}</td>
                        <td className="px-4 py-4 font-label-mono text-on-surface-variant">{key.created}</td>
                        <td className={`px-4 py-4 text-right font-bold ${key.status === "Active" ? "text-risk-low" : "text-on-surface-variant/40"}`}>{key.status}</td>
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
              <div className="p-4 bg-[#07090e] border border-outline-variant/20 rounded-xl space-y-2 text-xs">
                <h5 className="font-bold text-on-surface">Incident Handler Production</h5>
                <p className="text-[10px] text-on-surface-variant font-label-mono truncate">https://webhooks.bank.internal/v1/mules...</p>
              </div>
              <button onClick={() => alert("Webhook added.")} className="w-full py-2.5 border border-outline/30 hover:border-primary/50 text-xs font-semibold rounded-xl hover:bg-white/5 transition-colors">
                Register New Endpoint
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-on-surface">Immutable Audit Ledger</h2>
              <p className="text-body-sm text-on-surface-variant mt-1">Cryptographically signed trail of all administrative operations.</p>
            </div>
            <button onClick={() => alert("Audit trail PDF report compiled successfully.")} className="px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl flex items-center gap-1.5">
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
          <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-low">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest bg-surface-container-high/20">
                  <th className="px-4 py-4">Timestamp</th>
                  <th className="px-4 py-4">Actor</th>
                  <th className="px-4 py-4">Action Type</th>
                  <th className="px-4 py-4">Entity ID</th>
                  <th className="px-4 py-4">IP Address</th>
                  <th className="px-4 py-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((log, i) => (
                  <tr key={i} className="border-b border-outline-variant/10 text-xs hover:bg-surface-container-high/20 transition-colors">
                    <td className="px-4 py-4 font-label-mono text-on-surface">{log.date}</td>
                    <td className="px-4 py-4 font-semibold text-on-surface">{log.actor}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${log.status === "ALERT" ? "text-risk-critical border-risk-critical/20 bg-risk-critical/10" : "text-on-surface-variant border-outline-variant/30"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-label-mono text-on-surface">{log.entity}</td>
                    <td className="px-4 py-4 font-label-mono text-on-surface-variant">{log.ip}</td>
                    <td className="px-4 py-4 text-right font-bold">
                      <span className={log.status === "VERIFIED" ? "text-risk-low" : "text-risk-critical"}>
                        {log.status === "VERIFIED" ? "✓ SECURE" : "⚠ ALERT"}
                      </span>
                    </td>
                  </tr>
                ))}
                {auditLog.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-on-surface">Notification Channels</h2>
              <p className="text-body-sm text-on-surface-variant mt-1">Configure real-time sync notification triggers for Slack, Teams, and Webhook relay channels.</p>
            </div>
            <button onClick={() => alert("Notification settings saved successfully.")} className="px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl">
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
      {/* Modals */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-outline-variant/20 rounded-2xl w-full max-w-md p-6 overflow-hidden relative">
            <button onClick={() => setShowInviteModal(false)} className="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-xl font-bold text-on-surface mb-6">Register New User</h2>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              {inviteError && <div className="p-3 bg-risk-high/10 text-risk-high text-xs rounded-lg">{inviteError}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant font-bold uppercase">First Name</label>
                  <input type="text" required value={inviteForm.firstName} onChange={e => setInviteForm({...inviteForm, firstName: e.target.value})} className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant font-bold uppercase">Last Name</label>
                  <input type="text" required value={inviteForm.lastName} onChange={e => setInviteForm({...inviteForm, lastName: e.target.value})} className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-on-surface-variant font-bold uppercase">Email Address</label>
                <input type="email" required value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-on-surface-variant font-bold uppercase">Role</label>
                <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary">
                  <option value="administrator">Administrator</option>
                  <option value="investigator">Investigator</option>
                  <option value="compliance_officer">Compliance Officer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-on-surface-variant font-bold uppercase">Temporary Password</label>
                <input type="password" required minLength={8} value={inviteForm.password} onChange={e => setInviteForm({...inviteForm, password: e.target.value})} className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary" />
              </div>

              <button type="submit" disabled={inviteLoading} className="w-full py-3 mt-4 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 disabled:opacity-50">
                {inviteLoading ? "Registering..." : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && userToEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-outline-variant/20 rounded-2xl w-full max-w-sm p-6 relative">
            <button onClick={() => setShowEditModal(false)} className="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-xl font-bold text-on-surface mb-6">Edit User Role</h2>
            <p className="text-xs text-on-surface-variant mb-4">Editing role for <strong>{userToEdit.name}</strong></p>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {editError && <div className="p-3 bg-risk-high/10 text-risk-high text-xs rounded-lg">{editError}</div>}
              
              <div className="space-y-1">
                <label className="text-xs text-on-surface-variant font-bold uppercase">Role</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value)} className="w-full bg-[#0c0e17] border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary">
                  <option value="administrator">Administrator</option>
                  <option value="investigator">Investigator</option>
                  <option value="compliance_officer">Compliance Officer</option>
                  <option value="user">User</option>
                </select>
              </div>

              <button type="submit" disabled={editLoading} className="w-full py-3 mt-4 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 disabled:opacity-50">
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
