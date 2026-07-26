"use client";

import React, { useState, useMemo } from "react";
import { useUIStore } from "../../store/useUIStore";
import { apiClient } from "../../services/api-client";

export default function AdminPage() {
  const { addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<"health" | "users" | "escalated_cases" | "developer" | "audit" | "notifications">("health");

  const [users, setUsers] = useState<any[]>([]);

  // Fetch users on mount
  React.useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await apiClient.get("/api/v1/auth/users");
        if (response.success && response.data) {
          const mappedUsers = response.data.map((u: any) => ({
            name: `${u.first_name} ${u.last_name}`,
            email: u.email,
            role: u.roles && u.roles.length > 0 ? u.roles[0].name.toUpperCase() : "ANALYST",
            mfa: u.is_mfa_enabled ? "Enabled" : "Pending Setup",
            lastLogin: new Date(u.updated_at).toLocaleString(),
            status: u.is_active ? "Active" : "Inactive"
          }));
          setUsers(mappedUsers);
        }
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    }
    fetchUsers();
  }, []);
  const [escalatedCases, setEscalatedCases] = useState([
    { id: "CAS-2026-981", customer: "Elena Volkov", account: "9312-XXXX", priority: "CRITICAL", reason: "Multiple SAR Triggers", escalationDate: "2023-11-23 18:45:12", status: "Active" },
    { id: "CAS-2026-942", customer: "Marcus Knight", account: "4591-XXXX", priority: "HIGH", reason: "Unusual Wire Transfers", escalationDate: "2023-11-24 09:15:33", status: "Active" },
    { id: "CAS-2026-882", customer: "Johnathan Doe", account: "1002-XXXX", priority: "MEDIUM", reason: "Compliance Review", escalationDate: "2023-11-24 14:22:10", status: "Pending" },
  ]);


  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Investigator");

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserName, setAddUserName] = useState("");
  const [addUserEmail, setAddUserEmail] = useState("");
  const [addUserPassword, setAddUserPassword] = useState("");
  const [addUserRole, setAddUserRole] = useState("Investigator");

  const [editUserModal, setEditUserModal] = useState<any>(null);
  const [editRole, setEditRole] = useState("");
  const [editMfa, setEditMfa] = useState("");

  const [letterUserModal, setLetterUserModal] = useState<any>(null);

  const [apiKeys, setApiKeys] = useState([
    { label: "Main_Prod_Gateway", token: "ms_live_••••••••3x9j", created: "2023-11-12", status: "Active" },
    { label: "SIEM_Integration", token: "ms_live_••••••••a4k8", created: "2024-01-05", status: "Active" },
    { label: "Test_Staging_Env", token: "ms_test_••••••••p22m", created: "2023-09-20", status: "Revoked" },
  ]);

  const [webhooks, setWebhooks] = useState([
    { name: "Incident Handler Production", url: "https://webhooks.bank.internal/v1/mules..." }
  ]);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const [channels, setChannels] = useState({
    slack: true,
    teams: true,
    sms: true,
    email: true
  });
  const [showChannelsModal, setShowChannelsModal] = useState(false);
  const [tempChannels, setTempChannels] = useState(channels);

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

  const handleExportUsers = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Role,MFA Status,Last Login,Status\n"
      + users.map(u => `${u.name},${u.email},${u.role},${u.mfa},${u.lastLogin},${u.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "muleshield_users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("User list exported to compliance bundle.", "success");
  };

  const handleAddUserSubmit = async () => {
    if (!addUserName || !addUserEmail || !addUserPassword) {
      addToast("Please fill all required fields", "error");
      return;
    }
    const [firstName, ...lastNameParts] = addUserName.split(" ");
    const lastName = lastNameParts.join(" ") || "User";
    
    try {
      await apiClient.post("/api/v1/auth/register", {
        email: addUserEmail,
        password: addUserPassword,
        first_name: firstName,
        last_name: lastName,
        role: addUserRole
      });
      
      const newUser = {
        name: addUserName,
        email: addUserEmail,
        role: addUserRole,
        mfa: "Pending Setup",
        lastLogin: "Never",
        status: "Active"
      };
      
      setUsers([...users, newUser]);
      setShowAddUserModal(false);
      setAddUserName("");
      setAddUserEmail("");
      setAddUserPassword("");
      setAddUserRole("Investigator");
      addToast(`User ${addUserName} created successfully.`, "success");
    } catch (error) {
      addToast("Failed to create user. Ensure email is unique.", "error");
    }
  };

  const handleInviteSubmit = () => {
    if (!inviteEmail) return;
    const computedName = inviteName.trim() || inviteEmail.split("@")[0].replace(".", " ");
    const formattedName = computedName.charAt(0).toUpperCase() + computedName.slice(1);
    const newUser = {
      name: formattedName,
      email: inviteEmail,
      role: inviteRole,
      mfa: "Pending Setup",
      lastLogin: "Never",
      status: "Invited"
    };
    setUsers([...users, newUser]);
    setShowInviteModal(false);
    setInviteName("");
    setInviteEmail("");
    addToast(`Invitation email & Joining Letter generated for ${inviteEmail}`, "success");
    setLetterUserModal(newUser);
  };

  const handleDownloadLetter = (user: any) => {
    const letterText = `===============================================================
MULESHIELD AI | OFFICIAL EMPLOYMENT OFFER & JOINING LETTER
===============================================================

Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
Ref ID: MS-HR-2026-${Math.floor(1000 + Math.random() * 9000)}
Recipient: ${user.name} (${user.email})

Dear ${user.name},

We are delighted to formally offer you the position of ${user.role} at MuleShield AI Technologies Inc.

POSITION & RESPONSIBILITIES:
- Designation: ${user.role}
- Department: Enterprise Intelligence & Regulatory Systems
- Work Location: Remote / Regional Intelligence Hub
- Target Start Date: August 3, 2026

COMPENSATION & BENEFITS:
- Base Compensation: $145,000 USD / annum
- Performance Bonus: Up to 20% Annual Target Bonus
- Equity Grant: 25,000 ISO Stock Options (4-year vesting)
- Full Health, Dental & Vision Insurance starting Day 1

Please present this document along with your digital signature upon initial onboarding login.

Authorized By:
Dr. Elizabeth Vance, Chief Executive Officer
MuleShield AI Intelligence Suite
===============================================================`;

    const blob = new Blob([letterText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `MuleShield_Joining_Letter_${user.name.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Downloaded Joining Letter for ${user.name}`, "success");
  };

  const handleEditSubmit = () => {
    if (!editUserModal) return;
    setUsers(users.map(u => u.email === editUserModal.email ? { ...u, role: editRole, mfa: editMfa } : u));
    setEditUserModal(null);
    addToast(`Role configurations updated for ${editUserModal.name}`, "success");
  };

  const handleWebhookSubmit = () => {
    if (!webhookName || !webhookUrl) return;
    setWebhooks([...webhooks, { name: webhookName, url: webhookUrl }]);
    setShowWebhookModal(false);
    setWebhookName("");
    setWebhookUrl("");
    addToast(`Successfully registered webhook: ${webhookName}`, "success");
  };

  const handleChannelsSubmit = () => {
    setChannels(tempChannels);
    setShowChannelsModal(false);
    addToast("Notification channels configurations saved successfully.", "success");
  };

  const handleExportAudit = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,Actor,Action Type,Entity ID,IP Address,Verification\n"
      + auditLog.map(l => `${l.date},${l.actor},${l.action},${l.entity},${l.ip},${l.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "muleshield_audit_ledger.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Audit trail data exported successfully.", "success");
  };



  return (
    <div className="space-y-6">
      {/* Top main tabs */}
      <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
        <div className="flex flex-wrap gap-4 lg:gap-6">
          {["health", "users", "escalated_cases", "developer", "audit", "notifications"].map((tab) => (
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
                : tab === "escalated_cases"
                ? "Escalated Cases"
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
                onClick={handleExportUsers}
                className="px-4 py-2 border border-outline-variant/30 hover:border-primary/45 rounded-xl text-xs font-semibold text-on-surface hover:bg-white/5 transition-all"
              >
                Export User List
              </button>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-2 bg-secondary-container text-on-surface font-bold text-xs rounded-xl hover:opacity-90 transition-opacity"
              >
                Add User
              </button>
              <button
                onClick={() => setShowInviteModal(true)}
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
                        <div className="flex justify-end gap-2 text-on-surface-variant">
                          <button
                            onClick={() => setLetterUserModal(u)}
                            className="material-symbols-outlined text-base hover:text-primary transition-colors"
                            title="View / Download Joining Letter"
                          >
                            drafts
                          </button>
                          <button
                            onClick={() => {
                              setEditUserModal(u);
                              setEditRole(u.role);
                              setEditMfa(u.mfa);
                            }}
                            className="material-symbols-outlined text-base hover:text-primary transition-colors"
                            title="Edit User Role"
                          >
                            edit
                          </button>
                          <button
                            onClick={() => {
                              setUsers(users.filter(x => x.email !== u.email));
                              addToast(`Deauthorized security credential for: ${u.name}`, "warning");
                            }}
                            className="material-symbols-outlined text-base hover:text-risk-critical transition-colors"
                            title="Revoke User Access"
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

      {activeTab === "escalated_cases" && (
        <div className="space-y-6 text-left">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h2 className="text-xl font-bold text-on-surface">Escalated Case Registry</h2>
              <p className="text-body-sm text-on-surface-variant mt-1">Review, assign, and solve high-priority escalated investigations.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => addToast("Escalated case registry exported.", "success")}
                className="px-4 py-2 border border-outline-variant/30 hover:border-primary/45 rounded-xl text-xs font-semibold text-on-surface hover:bg-white/5 transition-all"
              >
                Export Registry
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-low max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                <thead className="sticky top-0 bg-surface-container-low/95 backdrop-blur-md z-10 border-b border-outline-variant/30">
                  <tr className="text-on-surface-variant font-label-mono text-[9px] uppercase tracking-widest">
                    <th className="px-4 py-4 w-72">Case / Customer</th>
                    <th className="px-4 py-4 w-32">Priority</th>
                    <th className="px-4 py-4 w-44">Escalation Reason</th>
                    <th className="px-4 py-4 w-36">Escalated On</th>
                    <th className="px-4 py-4 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {escalatedCases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant text-sm">
                        No active escalations.
                      </td>
                    </tr>
                  ) : escalatedCases.map((c, i) => (
                    <tr key={i} className="text-xs hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-4 py-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-secondary-container text-primary font-bold flex items-center justify-center border border-outline-variant/30 flex-shrink-0">
                          {c.customer.split(" ").map(n=>n[0]).join("")}
                        </span>
                        <div className="truncate">
                          <div className="font-bold text-on-surface truncate">{c.id}</div>
                          <div className="text-[10px] text-on-surface-variant font-label-mono truncate mt-0.5">{c.customer} • {c.account}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 border rounded font-label-mono text-[9px] uppercase font-bold ${
                          c.priority === 'CRITICAL' ? 'bg-risk-critical/10 border-risk-critical/20 text-risk-critical' :
                          c.priority === 'HIGH' ? 'bg-risk-high/10 border-risk-high/20 text-risk-high' :
                          'bg-risk-medium/10 border-risk-medium/20 text-risk-medium'
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4 truncate text-on-surface">{c.reason}</td>
                      <td className="px-4 py-4 font-label-mono text-on-surface-variant truncate">{c.escalationDate}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2 text-on-surface-variant">
                          <button
                            onClick={() => addToast(`Viewing history for case ${c.id}`, "info")}
                            className="material-symbols-outlined text-base hover:text-primary transition-colors"
                            title="View Case History"
                          >
                            history
                          </button>
                          <button
                            onClick={() => {
                              setEscalatedCases(escalatedCases.filter(x => x.id !== c.id));
                              addToast(`Case ${c.id} successfully solved.`, "success");
                            }}
                            className="material-symbols-outlined text-base hover:text-risk-low transition-colors"
                            title="Solve Case"
                          >
                            task_alt
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Escalation Telemetry sidebar */}
            <div className="lg:col-span-1 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
              <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">Escalation Telemetry</h3>
              <div className="space-y-4 text-xs font-label-mono">
                <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                  <div className="text-on-surface-variant text-[9px]">Active Escalations</div>
                  <div className="font-black text-2xl text-risk-high mt-1">{escalatedCases.length} <span className="text-xs text-risk-high">↑1</span></div>
                  <p className="text-[9px] text-on-surface-variant mt-1">Requiring immediate attention</p>
                </div>
                <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                  <div className="text-on-surface-variant text-[9px]">Avg Resolution Time</div>
                  <div className="font-black text-2xl text-on-surface mt-1">4.2 hrs <span className="text-xs text-risk-low">Optimal</span></div>
                  <p className="text-[9px] text-on-surface-variant mt-1">SLA Compliance 98%</p>
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
                <span className="px-2 py-0.5 bg-risk-low/10 border border-risk-low/20 text-risk-low text-[8px] font-bold rounded">{webhooks.length} Active</span>
              </h4>
              {webhooks.map((wh, idx) => (
                <div key={idx} className="p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl space-y-2 text-xs">
                  <h5 className="font-bold text-on-surface">{wh.name}</h5>
                  <p className="text-[10px] text-on-surface-variant font-label-mono truncate">{wh.url}</p>
                </div>
              ))}
              <button
                onClick={() => setShowWebhookModal(true)}
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
              onClick={handleExportAudit}
              className="px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-xs">download</span>
              Export Audit Data
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
              onClick={() => {
                setTempChannels(channels);
                setShowChannelsModal(true);
              }}
              className="px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl"
            >
              Configure Channels
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`p-4 rounded-xl border border-outline-variant/30 ${channels.slack ? "bg-surface-container-low" : "bg-surface-container-lowest opacity-50"} flex items-center justify-between`}>
              <div>
                <div className="text-[10px] font-label-mono text-on-surface-variant font-bold">Slack</div>
                <div className={`text-xs font-semibold ${channels.slack ? "text-risk-low" : "text-on-surface-variant"} mt-1 flex items-center gap-1.5`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${channels.slack ? "bg-risk-low animate-pulse" : "bg-on-surface-variant"}`}></span>
                  {channels.slack ? "Connected" : "Disabled"}
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border border-outline-variant/30 ${channels.teams ? "bg-surface-container-low" : "bg-surface-container-lowest opacity-50"} flex items-center justify-between`}>
              <div>
                <div className="text-[10px] font-label-mono text-on-surface-variant font-bold">MS Teams</div>
                <div className={`text-xs font-semibold ${channels.teams ? "text-risk-medium" : "text-on-surface-variant"} mt-1 flex items-center gap-1.5`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${channels.teams ? "bg-risk-medium" : "bg-on-surface-variant"}`}></span>
                  {channels.teams ? "Delayed (12s)" : "Disabled"}
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border border-outline-variant/30 ${channels.sms ? "bg-surface-container-low" : "bg-surface-container-lowest opacity-50"} flex items-center justify-between`}>
              <div>
                <div className="text-[10px] font-label-mono text-on-surface-variant font-bold">Global SMS</div>
                <div className={`text-xs font-semibold ${channels.sms ? "text-risk-low" : "text-on-surface-variant"} mt-1 flex items-center gap-1.5`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${channels.sms ? "bg-risk-low" : "bg-on-surface-variant"}`}></span>
                  {channels.sms ? "99.9% Delivery" : "Disabled"}
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border border-outline-variant/30 ${channels.email ? "bg-surface-container-low" : "bg-surface-container-lowest opacity-50"} flex items-center justify-between`}>
              <div>
                <div className="text-[10px] font-label-mono text-on-surface-variant font-bold">Email Relay</div>
                <div className={`text-xs font-semibold ${channels.email ? "text-risk-low" : "text-on-surface-variant"} mt-1 flex items-center gap-1.5`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${channels.email ? "bg-risk-low" : "bg-on-surface-variant"}`}></span>
                  {channels.email ? "Operational" : "Disabled"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    
      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-low p-6 rounded-2xl w-full max-w-md border border-outline-variant/30 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-on-surface">Invite New User</h3>
            <div>
              <label className="text-xs text-on-surface-variant mb-1 block">Full Name</label>
              <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface" placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant mb-1 block">Email Address</label>
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface" placeholder="email@muleshield.ai" />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant mb-1 block">Role</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface">
                <option>Admin</option>
                <option>Investigator</option>
                <option>Compliance Officer</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowInviteModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-white/5">Cancel</button>
              <button onClick={handleInviteSubmit} className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold">Send Invite</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-low p-6 rounded-2xl w-full max-w-md border border-outline-variant/30 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-on-surface">Edit User Access</h3>
            <p className="text-xs text-primary font-bold">{editUserModal.name}</p>
            <div>
              <label className="text-xs text-on-surface-variant mb-1 block">Role</label>
              <select value={editRole} onChange={e => setEditRole(e.target.value)} className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface">
                <option>Admin</option>
                <option>Investigator</option>
                <option>Compliance Officer</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-on-surface-variant mb-1 block">MFA Status</label>
              <select value={editMfa} onChange={e => setEditMfa(e.target.value)} className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface">
                <option>Enabled</option>
                <option>Disabled</option>
                <option>Pending Setup</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setEditUserModal(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-white/5">Cancel</button>
              <button onClick={handleEditSubmit} className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-low p-6 rounded-2xl w-full max-w-md border border-outline-variant/30 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-on-surface">Register Webhook</h3>
            <div>
              <label className="text-xs text-on-surface-variant mb-1 block">Endpoint Name</label>
              <input type="text" value={webhookName} onChange={e => setWebhookName(e.target.value)} className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface" placeholder="e.g. Splunk Ingestion" />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant mb-1 block">Target URL</label>
              <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface" placeholder="https://..." />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowWebhookModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-white/5">Cancel</button>
              <button onClick={handleWebhookSubmit} className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold">Save Webhook</button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Channels Modal */}
      {showChannelsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-low p-6 rounded-2xl w-full max-w-sm border border-outline-variant/30 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-on-surface">Notification Toggles</h3>
            <div className="space-y-3">
              {Object.keys(tempChannels).map((key) => (
                <div key={key} className="flex justify-between items-center bg-surface-container-highest p-3 rounded-xl border border-outline-variant/20">
                  <span className="text-sm font-semibold capitalize text-on-surface">{key}</span>
                  <button
                    onClick={() => setTempChannels({...tempChannels, [key]: !tempChannels[key as keyof typeof tempChannels]})}
                    className={`w-10 h-6 rounded-full transition-colors relative ${tempChannels[key as keyof typeof tempChannels] ? 'bg-primary' : 'bg-surface-container'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${tempChannels[key as keyof typeof tempChannels] ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowChannelsModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-white/5">Cancel</button>
              <button onClick={handleChannelsSubmit} className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold">Apply Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Offer / Joining Letter Modal */}
      {letterUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-low p-6 rounded-2xl w-full max-w-3xl border border-outline-variant/30 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">description</span>
                Official Offer Letter Preview (PDF Format)
              </h3>
              <button onClick={() => setLetterUserModal(null)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</button>
            </div>

            {/* Document Sheet Container (Stylized like the PDF mockup) */}
            <div className="bg-white text-slate-800 p-8 sm:p-12 rounded-xl shadow-2xl relative overflow-hidden font-sans space-y-6 select-text text-left">
              {/* Top Accent Graphics */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 clip-path-polygon transform translate-x-8 -translate-y-8 rotate-12 opacity-90 pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-24 h-24 bg-slate-900 clip-path-polygon transform -translate-x-6 -translate-y-6 opacity-95 pointer-events-none"></div>

              {/* Header with Logo */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 text-amber-400 rounded-xl flex items-center justify-center font-black text-xl border-2 border-amber-400">
                    MS
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-wider text-slate-900 uppercase">MULESHIELD AI</h1>
                    <p className="text-[10px] font-semibold text-slate-600 tracking-wide">Empowering The Digital Defenders</p>
                  </div>
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center py-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-wide uppercase">INTERNSHIP OFFER LETTER</h2>
              </div>

              {/* Recipient */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">To:</p>
                <p className="text-base font-black text-slate-900 uppercase tracking-wide">{letterUserModal.name}</p>
              </div>

              {/* Content Body */}
              <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-normal">
                <p className="font-bold text-slate-900 text-sm">Congratulations!</p>

                <p>
                  We are pleased to inform you that you have been successfully selected for <strong className="text-slate-900 font-bold">Cyber Security & AI Forensic Virtual Program ({letterUserModal.role})</strong> at <strong className="text-slate-900 font-bold">MuleShield AI</strong>.
                </p>

                <p>
                  This position has been carefully designed to emphasize <strong className="text-slate-900 font-bold">practical learning and real-world implementation</strong>, enabling you to build strong technical foundations and industry-relevant skills within your chosen domain.
                </p>

                <p className="font-bold text-slate-900">During the program, you will engage in:</p>

                <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                  <li>Hands-on, project-based learning aligned with industry standards</li>
                  <li>Practical exposure to real-world problem-solving and workflows</li>
                  <li>Portfolio-ready project development suitable for professional platforms</li>
                  <li>Focus on developing discipline, consistency, and a professional mindset essential for technical growth</li>
                </ul>

                <p>
                  The program will be conducted in virtual mode from <strong className="text-slate-900 font-bold">20 July 2026 to 20 August 2026</strong>. Active participation and a learning-oriented approach are expected throughout the duration of the program.
                </p>

                <p>We wish you a productive and successful journey with MuleShield AI.</p>
              </div>

              {/* Signature Block */}
              <div className="pt-6 flex justify-end">
                <div className="text-right space-y-1">
                  <p className="text-xs font-bold text-slate-600">Best Regards,</p>
                  <p className="font-serif italic text-lg font-bold text-slate-900 py-1">Karndeep Baror</p>
                  <p className="text-xs font-bold text-slate-900">Karndeep Baror</p>
                  <p className="text-[10px] font-medium text-slate-500">Founder of MuleShield AI & Digital Defenders</p>
                </div>
              </div>

              {/* Footer Accents */}
              <div className="border-t border-slate-200 pt-3 flex flex-wrap justify-between items-center text-[10px] font-semibold text-slate-600">
                <div className="flex items-center gap-1">
                  <span>✉</span> info@muleshield.site
                </div>
                <div className="flex items-center gap-1">
                  <span>🌐</span> www.muleshield.site
                </div>
              </div>

              {/* Bottom Yellow Accent Graphic */}
              <div className="absolute bottom-0 right-0 w-28 h-28 bg-amber-400 clip-path-polygon transform translate-x-6 translate-y-6 opacity-90 pointer-events-none"></div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-risk-low">check_circle</span>
                Document Status: Generated & Formatted for {letterUserModal.email}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setLetterUserModal(null)} className="px-3 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-white/5">Close</button>
                <button 
                  onClick={() => handleDownloadLetter(letterUserModal)} 
                  className="px-4 py-2 bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">download</span>
                  Download Letter
                </button>
                <button
                  onClick={async () => {
                    try {
                      await apiClient.post("/api/v1/admin/send-email", {
                        name: letterUserModal.name,
                        email: letterUserModal.email,
                        role: letterUserModal.role,
                      });
                      addToast(`Email successfully sent directly to ${letterUserModal.email}`, "success");
                      setLetterUserModal(null);
                    } catch (e) {
                      addToast("Failed to dispatch email", "error");
                    }
                  }}
                  className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-xs">mail</span>
                  Send Direct Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-outline-variant/10">
              <h3 className="text-lg font-bold text-on-surface">Add New System User</h3>
              <p className="text-xs text-on-surface-variant mt-1">Directly provision a new account with DB integration.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text"
                  value={addUserName}
                  onChange={e => setAddUserName(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                  placeholder="e.g. John Doe"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email"
                  value={addUserEmail}
                  onChange={e => setAddUserEmail(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                  placeholder="name@muleshield.ai"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password"
                  value={addUserPassword}
                  onChange={e => setAddUserPassword(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Assign Role</label>
                <select
                  value={addUserRole}
                  onChange={e => setAddUserRole(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Investigator">Investigator</option>
                  <option value="Auditor">Auditor</option>
                  <option value="Reporter">Reporter</option>
                  <option value="Complaint Officer">Complaint Officer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-outline-variant/10 flex justify-end gap-3 bg-surface-container-lowest">
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-white/5"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddUserSubmit}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
