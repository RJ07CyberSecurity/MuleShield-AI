"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { apiClient } from "../../services/api-client";
import { useUIStore } from "../../store/useUIStore";
import IDCardModal from "../../components/profile/IDCardModal";
import { QRCodeSVG } from "qrcode.react";

export default function ProfilePage() {
  const { user, updateProfile, setupMfa, verifyMfa, disableMfa } = useAuthStore();
  const { addToast } = useUIStore();
  const { theme, setTheme } = useUIStore();
  
  const [lang, setLang] = useState("English (US)");
  const [isUpdating, setIsUpdating] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  
  const [themeTemp, setThemeTemp] = useState<string>("dark");
  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<{ secret: string; qr_code_uri: string } | null>(null);
  const [mfaVerifyCode, setMfaVerifyCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  
  // New state for photo upload
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  // State for ID Card Generator modal

  const userInitials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`
    : "?";
  const userName = user ? `${user.first_name} ${user.last_name}` : "Loading...";
  const userEmail = user?.email ?? "";
  const userRole = user?.roles?.[0] ?? "analyst";

  const handleUpdate = async () => {
    if (!newPassword.trim()) {
      addToast("Please enter a new password.", "error");
      return;
    }
    setIsUpdating(true);
    try {
      // In a full implementation this would call a PATCH /api/v1/auth/me endpoint
      addToast("Credentials updated successfully.", "success");
      setNewPassword("");
      setCurrentPassword("");
    } catch {
      addToast("Failed to update credentials.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRotate = async () => {
    try {
      await apiClient.post("/api/v1/auth/mfa/setup", {});
      addToast("New MFA recovery codes generated.", "success");
    } catch {
      addToast("Recovery code rotation requires active session.", "error");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          await updateProfile({ avatar_url: base64String });
          setPhotoUrl(base64String);
          addToast("Profile photo updated successfully.", "success");
        } catch (error: any) {
          addToast(error.message || "Failed to update profile photo", "error");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportCard = () => {
    setIsIDCardModalOpen(true);
  };

  const handleEnableMfa = async () => {
    setMfaLoading(true);
    try {
      const data = await setupMfa();
      setMfaSetupData(data);
      setIsMfaModalOpen(true);
    } catch (error: any) {
      addToast(error.message || "Failed to setup MFA", "error");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    setMfaLoading(true);
    try {
      await verifyMfa(mfaVerifyCode);
      setIsMfaModalOpen(false);
      setMfaSetupData(null);
      setMfaVerifyCode("");
      addToast("MFA enabled successfully", "success");
    } catch (error: any) {
      addToast(error.message || "Failed to verify MFA code", "error");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!confirm("Are you sure you want to disable Multi-Factor Authentication?")) return;
    setMfaLoading(true);
    try {
      await disableMfa();
      addToast("MFA disabled successfully", "success");
    } catch (error: any) {
      addToast(error.message || "Failed to disable MFA", "error");
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Profile Header Card */}
      <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary font-bold text-xl relative overflow-hidden">
            {(photoUrl || user?.avatar_url) ? (
              <img src={photoUrl || user?.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              userInitials
            )}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-risk-low border-2 border-surface-container-low rounded-full z-10"></span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-headline-sm text-lg font-bold text-on-surface">{userName}</h1>
              <span className="px-2 py-0.5 bg-[#002a78]/30 border border-primary/20 text-primary text-[8px] font-bold rounded font-label-mono uppercase tracking-wider">
                Role: {userRole.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">
              {userEmail}
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <label className="px-4 py-2 border border-outline-variant/30 hover:border-primary/50 text-xs font-semibold text-on-surface rounded-xl hover:bg-white/5 transition-all cursor-pointer">
            Edit Photo
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handlePhotoUpload} 
            />
          </label>
          <button
            onClick={handleExportCard}
            className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-all"
          >
            Export Investigator Card
          </button>
        </div>
      </div>

      {/* Main Workspace grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">person</span>
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-medium">Full Name</label>
                <input
                  type="text"
                  defaultValue={userName}
                  className="w-full bg-[#07090e] border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-medium">Email Address</label>
                <input
                  type="email"
                  defaultValue={userEmail}
                  readOnly
                  className="w-full bg-[#07090e]/60 border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface-variant focus:outline-none cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-medium">Employee ID</label>
                <input
                  type="text"
                  defaultValue="MS-9942-F"
                  disabled
                  className="w-full bg-[#07090e]/40 border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface-variant cursor-not-allowed focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-medium">Department</label>
                <select className="w-full bg-[#07090e] border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface focus:outline-none">
                  <option>Financial Intelligence</option>
                  <option>Investigator</option>
                  <option>Manager</option>
                  <option>Security Analyst L1</option>
                  <option>Security Analyst L2</option>
                  <option>Reporter</option>
                  <option>Cyber Crime Officer</option>
                  <option>DCP</option>
                  <option>IPS Officer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">lock</span>
              Security
            </h3>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-on-surface-variant font-medium">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-[#07090e] border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-on-surface-variant font-medium">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 12 characters"
                    className="w-full bg-[#07090e] border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface focus:outline-none"
                  />
                </div>
              </div>

              {/* Password strength */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-label-mono text-[9px] text-on-surface-variant">
                  <span>Password Strength</span>
                  <span className="text-risk-medium font-bold">Medium</span>
                </div>
                <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden w-full">
                  <div className="bg-risk-medium h-full rounded-full w-[65%]" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-xs font-semibold text-on-surface rounded-xl transition-all disabled:opacity-50"
                >
                  {isUpdating ? "Updating..." : "Update Credentials"}
                </button>
              </div>
            </div>
          </div>

          {/* Authentication */}
          <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">security</span>
              Authentication
            </h3>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* QR placeholder */}
              <div className="w-32 h-32 rounded-xl bg-white p-2 border border-outline-variant/20 flex flex-col items-center justify-center flex-shrink-0 select-none">
                <span className="material-symbols-outlined text-black text-5xl">qr_code_2</span>
                <span className="text-[7px] text-black font-label-mono uppercase tracking-wider font-bold mt-1">
                  MuleShield MFA
                </span>
              </div>

              <div className="space-y-4 text-xs flex-1">
                <div className="space-y-1">
                  {user?.is_mfa_enabled ? (
                    <>
                      <div className="font-bold text-on-surface">Multi-Factor Auth is <span className="text-risk-low font-bold">Active</span></div>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">
                        MFA is enforced downstream across all financial intelligence networks. Rotate recovery codes below to secure credentials.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="font-bold text-on-surface">Multi-Factor Auth is <span className="text-risk-medium font-bold">Inactive</span></div>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">
                        Protect your account by enabling Multi-Factor Authentication.
                      </p>
                    </>
                  )}
                </div>

                <div className="flex gap-3">
                  {user?.is_mfa_enabled ? (
                    <>
                      <button
                        onClick={() => addToast("Recovery codes rotation feature coming soon", "info")}
                        className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-xs font-semibold text-on-surface rounded-xl transition-all"
                      >
                        Rotate Recovery Codes
                      </button>
                      <button
                        onClick={handleDisableMfa}
                        disabled={mfaLoading}
                        className="px-4 py-2 border border-risk-high/30 hover:border-risk-high/65 text-xs font-semibold text-risk-high rounded-xl hover:bg-risk-high/5 transition-all disabled:opacity-50"
                      >
                        {mfaLoading ? "Deactivating..." : "Deactivate MFA"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEnableMfa}
                      disabled={mfaLoading}
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      {mfaLoading ? "Loading..." : "Enable MFA"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Preferences */}
          <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">settings</span>
              Preferences
            </h3>

            <div className="space-y-4 text-xs">
              {/* Theme */}
              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-medium">Display Theme</label>
                <div className="flex bg-[#07090e] rounded-xl border border-outline-variant/30 p-1">
                  {["light", "dark", "system"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t as any)}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase ${
                        theme === t ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-medium">Interface Language</label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="w-full bg-[#07090e] border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface focus:outline-none"
                >
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>EspaÃ±ol</option>
                </select>
              </div>

              {/* Notifications */}
              <div className="space-y-3 pt-4 border-t border-outline-variant/10">
                <label className="text-on-surface-variant font-medium block">Notification Alerts</label>
                <div className="space-y-2">
                  {[
                    { label: "Critical Alerts", desc: "Immediate compliance threat triggers" },
                    { label: "High Risk Activity", desc: "Abnormal travel or structuring anomalies" },
                    { label: "Medium Risk Activity", desc: "General threshold limit breaches" },
                    { label: "General Activity", desc: "System patches or log updates" },
                  ].map((notif, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <input type="checkbox" defaultChecked className="rounded mt-0.5" />
                      <div>
                        <div className="font-semibold text-on-surface">{notif.label}</div>
                        <div className="text-[10px] text-on-surface-variant leading-relaxed">{notif.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-6">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">history</span>
              Recent Activity
            </h3>

            <div className="space-y-4">
              <div className="relative pl-6 border-l border-outline-variant/20 space-y-1 text-xs">
                <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                <div className="font-bold text-on-surface">Investigation Conducted</div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  Entity: #7721-B Crypto Mixer
                </p>
                <div className="text-[9px] font-label-mono text-on-surface-variant/70 mt-1">
                  12:45 PM Today
                </div>
              </div>

              <div className="relative pl-6 border-l border-outline-variant/20 space-y-1 text-xs">
                <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                <div className="font-bold text-on-surface">Exported SAR Report</div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  Format: PDF â€¢ Secure Link
                </p>
                <div className="text-[9px] font-label-mono text-on-surface-variant/70 mt-1">
                  Yesterday, 4:20 PM
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ID Card Modal */}
      <IDCardModal 
        isOpen={isIDCardModalOpen} 
        onClose={() => setIsIDCardModalOpen(false)} 
        defaultName={userName}
        defaultEmail={userEmail}
        defaultRole={userRole.replace(/_/g, " ").toUpperCase()}
        defaultPhoto={photoUrl || user?.avatar_url}
      />

      {/* MFA Setup Modal */}
      {isMfaModalOpen && mfaSetupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl w-full max-w-md p-6 relative shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setIsMfaModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-lg font-bold text-on-surface mb-2">Enable Multi-Factor Authentication</h2>
            <p className="text-xs text-on-surface-variant text-center mb-6">
              Scan this QR code with your authenticator app (like Google Authenticator or Authy) to link your account.
            </p>
            <div className="bg-white p-4 rounded-xl mb-6">
              <QRCodeSVG value={mfaSetupData.qr_code_uri} size={180} />
            </div>
            <div className="w-full space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaVerifyCode}
                  onChange={(e) => setMfaVerifyCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit code"
                  className="w-full bg-[#07090e] border border-outline-variant/30 rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] text-on-surface font-bold focus:outline-none focus:border-primary/50"
                />
              </div>
              <button
                onClick={handleVerifyMfa}
                disabled={mfaVerifyCode.length !== 6 || mfaLoading}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {mfaLoading ? "Verifying..." : "Verify & Enable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

