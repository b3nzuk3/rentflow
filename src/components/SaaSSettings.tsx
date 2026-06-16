/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Building,
  User,
  Users,
  Shield,
  Bell,
  CreditCard,
  Layers,
  FileText,
  Download,
  Check,
  X,
  Plus,
  Edit2,
  Lock,
  Phone,
  Mail,
  ToggleLeft,
  ToggleRight,
  Info,
  ChevronRight,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  Globe,
  Settings,
  ArrowRight,
  MapPin,
  Laptop,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { User as AppUser, Organization, Property, AuditLog, UserRole } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface SaaSSettingsProps {
  currentUser: AppUser;
  organization: Organization;
  users: AppUser[];
  onAddUser: (user: AppUser) => void;
  properties: Property[];
  auditLogs: AuditLog[];
  onUpdateOrgSubscription?: (orgId: string, plan: "Starter" | "Growth" | "Enterprise") => void;
  onUpdateOrganizationDetails?: (orgId: string, updatedName: string) => void;
}

type SettingsSection =
  | "org_profile"
  | "my_account"
  | "users_roles"
  | "security"
  | "notifications"
  | "payment_config"
  | "subscription_billing"
  | "audit_logs"
  | "data_export";

export const SaaSSettings: React.FC<SaaSSettingsProps> = ({
  currentUser,
  organization,
  users: initialUsers,
  onAddUser,
  properties,
  auditLogs: initialAuditLogs,
  onUpdateOrgSubscription,
  onUpdateOrganizationDetails
}) => {
  const [activeTab, setActiveTab] = useState<SettingsSection>("org_profile");

  // Status Alerts State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- PERSISTENT SYSTEMS STATES ---
  // A. Organization Profile Form State
  const [orgName, setOrgName] = useState(organization.name);
  const [businessType, setBusinessType] = useState("Commercial & Residential Real Estate LLC");
  const [orgPhone, setOrgPhone] = useState("+254 722 000 001");
  const [orgEmail, setOrgEmail] = useState("info@amani.co");
  const [orgAddress, setOrgAddress] = useState("Amani Tower, Suite 402, Nairobi, Kenya");
  const [orgWebsite, setOrgWebsite] = useState("https://www.amaniproperties.com");
  const [orgTaxPin, setOrgTaxPin] = useState("A001239857B");
  const [orgRegNumber, setOrgRegNumber] = useState("CPR/2021/84725");
  const [orgLogo, setOrgLogo] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // B. My Account Settings State
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accFirstName, setAccFirstName] = useState(currentUser.firstName);
  const [accLastName, setAccLastName] = useState(currentUser.lastName);
  const [accEmail, setAccEmail] = useState(currentUser.email);
  const [accPhone, setAccPhone] = useState(currentUser.phoneNumber);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // C. Users List & Invitation Management
  const [localUsers, setLocalUsers] = useState<AppUser[]>(initialUsers);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("property_manager");
  const [inviteAssignedProperty, setInviteAssignedProperty] = useState("");

  // D. Security Passcode Configuration
  const [secCurrentPassword, setSecCurrentPassword] = useState("");
  const [secNewPassword, setSecNewPassword] = useState("");
  const [secConfirmPassword, setSecConfirmPassword] = useState("");
  const [sessions, setSessions] = useState([
    { id: 1, device: "Chrome on macOS (Macbook Pro)", location: "Nairobi, KE", ip: "197.248.33.19", lastActive: "Active Now" },
    { id: 2, device: "Safari on iPhone 15 Pro", location: "Mombasa, KE", ip: "102.134.12.87", lastActive: "2 hours ago" },
    { id: 3, device: "Firefox on Windows 11", location: "Nairobi, KE", ip: "197.248.45.105", lastActive: "Yesterday" }
  ]);
  const [loginHistory, setLoginHistory] = useState([
    { date: "June 14, 2026, 11:24 AM", device: "Chrome / macOS", location: "Nairobi, KE", status: "Success" },
    { date: "June 13, 2026, 09:15 AM", device: "Safari / iPhone", location: "Mombasa, KE", status: "Success" },
    { date: "June 10, 2026, 02:40 PM", device: "Edge / Windows", location: "Nairobi, KE", status: "Failed (Incorrect password)" },
    { date: "June 08, 2026, 06:12 PM", device: "Chrome / macOS", location: "Nairobi, KE", status: "Success" }
  ]);

  // E. Notifications Subscription Preferences
  const [notifPreferences, setNotifPreferences] = useState({
    rentDueReminders: true,
    overdueRentAlerts: true,
    paymentSubmitted: true,
    paymentVerified: true,
    leaseExpiryAlerts: true,
    tenantInvitationAlerts: true,
    smsNotifications: true,
    emailNotifications: true,
    inAppNotifications: true
  });

  // F. Public Payment Config
  const [payPaybill, setPayPaybill] = useState("400200");
  const [payRefInstructions, setPayRefInstructions] = useState("Use your isolated Unit Code as M-Pesa account (e.g., A12)");
  const [payTillNumber, setPayTillNumber] = useState("9854721");
  const [payBankName, setPayBankName] = useState("Co-operative Bank of Kenya");
  const [payAccNumber, setPayAccNumber] = useState("11094723019253");
  const [payAccName, setPayAccName] = useState("Amani Property Management Trust");
  const [payInstructions, setPayInstructions] = useState("Complete transactions by 5th day of each billing month to prevent manual audits.");

  // G. Subscription Management State
  const [currentPlan, setCurrentPlan] = useState<"Starter" | "Growth" | "Enterprise">(organization.subscriptionPlan);
  const [billingCycle, setBillingCycle] = useState<"Monthly" | "Annual">("Monthly");
  const activeUnitsCount = properties.length * 4; // Mock units count based on properties
  const getUnitLimit = () => {
    if (currentPlan === "Starter") return 10;
    if (currentPlan === "Growth") return 50;
    return 1000; // Enterprise unlimited cap
  };

  // H. Audit Filter State
  const [localAuditLogs, setLocalAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditRoleFilter, setAuditRoleFilter] = useState("ALL");
  const [auditActionFilter, setAuditActionFilter] = useState("ALL");

  // I. Data Export Module
  const [checkedExports, setCheckedExports] = useState({
    tenants: true,
    units: true,
    properties: true,
    leases: true,
    payments: true,
    auditLogs: false
  });
  const [exportFormat, setExportFormat] = useState<"CSV" | "Excel" | "PDF">("CSV");
  const [exportHistory, setExportHistory] = useState([
    { id: "EXP-897", date: "June 12, 2026", targets: "Tenants, Units, Properties", format: "Excel", size: "142 KB", status: "Completed" },
    { id: "EXP-815", date: "June 05, 2026", targets: "Payments History", format: "PDF", size: "1.2 MB", status: "Completed" }
  ]);
  const [isGeneratingExport, setIsGeneratingExport] = useState(false);

  // Ownership transfer state
  const [showTransferOwnerModal, setShowTransferOwnerModal] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState("");

  // Sync users with initial prop when it updates
  useEffect(() => {
    setLocalUsers(initialUsers);
  }, [initialUsers]);

  // Sync initial audit logs
  useEffect(() => {
    setLocalAuditLogs(initialAuditLogs);
  }, [initialAuditLogs]);

  // --- PERMISSIONS CHECKS MATRIX ---
  // Owner Roles: only org_owner can access "Subscription & Billing" and "Ownership Transfer"
  // Manager Roles: can access "Users & Roles", "Notifications", and "Payment Configuration"
  // Accountant Roles: cannot modify organization settings (everything read-only)
  // Caretaker Roles: read-only access to settings (everything read-only)

  const isOwner = currentUser.role === "org_owner" || currentUser.role === "super_admin";
  const isManager = currentUser.role === "property_manager";
  const isAccountant = currentUser.role === "accountant";
  const isCaretaker = currentUser.role === "caretaker";

  const canModifyOrg = isOwner || isManager;
  const isReadOnlyMode = isAccountant || isCaretaker;

  // Render Role Authorization Banners
  const getRestrictionMessage = () => {
    if (isAccountant) return "Accountants have read-only access to organization configuration.";
    if (isCaretaker) return "Caretakers have read-only access to Settings.";
    return null;
  };

  // Drag and Drop implementation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isReadOnlyMode) {
      triggerToast("Permission Denied: Read-Only access only.", "error");
      return;
    }
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        setOrgLogo(URL.createObjectURL(file));
        triggerToast("Company logo template cached successfully!");
      } else {
        triggerToast("Invalid file type: Please upload an image file.", "error");
      }
    }
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnlyMode) {
      triggerToast("Permission Denied: Read-Only access only.", "error");
      return;
    }
    const files = e.target.files;
    if (files && files.length > 0) {
      setOrgLogo(URL.createObjectURL(files[0]));
      triggerToast("Company logo updated successfully.");
    }
  };

  // Core Actions
  const handleSaveOrgProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnlyMode) {
      triggerToast("Permission Denied: Action blocked in read-only environment.", "error");
      return;
    }
    if (onUpdateOrganizationDetails) {
      onUpdateOrganizationDetails(organization.id, orgName);
    }
    triggerToast("✓ Organization company profile successfully compiled & saved!");
  };

  const handleSaveMyAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingAccount(false);
    triggerToast("✓ Active operator profile coordinates saved successfully!");
  };

  const handleSavePaymentConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnlyMode) {
      triggerToast("Permission Denied: Your assigned role cannot adjust payment routing.", "error");
      return;
    }
    triggerToast("✓ Tenant payment configuration updated. New coordinates deployed directly.");
  };

  const handleSaveNotificationPrefs = () => {
    triggerToast("✓ Notification alert frequencies saved successfully.");
  };

  const handleSecurityPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secCurrentPassword || !secNewPassword || !secConfirmPassword) {
      triggerToast("Please populate all passcode credential inputs.", "error");
      return;
    }
    if (secNewPassword !== secConfirmPassword) {
      triggerToast("Passwords do not match.", "error");
      return;
    }
    setSecCurrentPassword("");
    setSecNewPassword("");
    setSecConfirmPassword("");
    triggerToast("✓ Cryptographic security key updated successfully.");
  };

  // Modal Handlers
  const handleInviteUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnlyMode) {
      triggerToast("Write permissions required.", "error");
      return;
    }
    if (!inviteName.trim() || !inviteEmail.trim() || !invitePhone.trim()) {
      triggerToast("All user contact parameters are required.", "error");
      return;
    }

    const first = inviteName.split(" ")[0] || "New";
    const last = inviteName.split(" ").slice(1).join(" ") || "User";

    const newUser: AppUser = {
      id: `user-${first.toLowerCase()}-${Date.now().toString().slice(-4)}`,
      uuid: `u-uuid-${Date.now()}`,
      organizationId: organization.id,
      firstName: first,
      lastName: last,
      phoneNumber: invitePhone.trim(),
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      isActive: true
    };

    onAddUser(newUser);
    setShowInviteModal(false);
    triggerToast(`✓ Dispatched system invitation log for ${inviteName}!`);

    // Reset Form
    setInviteName("");
    setInviteEmail("");
    setInvitePhone("");
    setInviteRole("property_manager");
    setInviteAssignedProperty("");
  };

  const handleTransferOwnershipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      triggerToast("Only the registered owner can sign-off corporate ownership transfer.", "error");
      return;
    }
    if (!transferTargetId) {
      triggerToast("Please designate a validated target operator.", "error");
      return;
    }

    const targetUser = localUsers.find(u => u.id === transferTargetId);
    if (targetUser) {
      triggerToast(`✓ Corporate ownership transferred to ${targetUser.firstName} ${targetUser.lastName}. Log out to complete authentication.`, "info");
      setShowTransferOwnerModal(false);
    }
  };

  const handleSuspendUserToggle = (userId: string) => {
    if (isReadOnlyMode) {
      triggerToast("Permission Denied: suspension requires administrator clearances.", "error");
      return;
    }
    setLocalUsers(prev =>
      prev.map(u => (u.id === userId && u.role !== "org_owner" ? { ...u, isActive: !u.isActive } : u))
    );
    triggerToast("User operating status updated.");
  };

  const handleTerminateSession = (sessionId: number) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    triggerToast("External secure TLS session terminated.");
  };

  const handleTerminateAllSessions = () => {
    setSessions(prev => prev.filter(s => s.lastActive === "Active Now"));
    triggerToast("Cleared all external sessions. High-security posture activated.");
  };

  // Plan Selection Upgrading Flow
  const handlePlanUpgrade = (plan: "Starter" | "Growth" | "Pro" | "Enterprise") => {
    if (!isOwner) {
      triggerToast("SaaS Subscription modification limited to Owner profiles.", "error");
      return;
    }

    const nextPlan = plan === "Pro" ? "Enterprise" : plan;

    if (onUpdateOrgSubscription) {
      onUpdateOrgSubscription(organization.id, nextPlan);
    }
    setCurrentPlan(nextPlan);
    triggerToast(`✓ Subscription plan successfully updated to ${plan}!`);
  };

  // Data Export Flow
  const handleGenerateExport = () => {
    setIsGeneratingExport(true);
    setTimeout(() => {
      setIsGeneratingExport(false);
      const newExp = {
        id: `EXP-${Math.floor(Math.random() * 900) + 100}`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        targets: Object.entries(checkedExports)
          .filter(([_, active]) => active)
          .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1))
          .join(", "),
        format: exportFormat,
        size: "312 KB",
        status: "Completed"
      };
      setExportHistory(prev => [newExp, ...prev]);
      triggerToast(`✓ Corporate report compiled! Raw ${exportFormat} downloaded directly.`);
    }, 2000);
  };

  // Filtered Audits
  const filteredAudits = localAuditLogs.filter(log => {
    const matchesQuery =
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.newValue.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.user.toLowerCase().includes(auditSearch.toLowerCase());

    const matchesRole = auditRoleFilter === "ALL" || log.role.toUpperCase() === auditRoleFilter.toUpperCase();
    const matchesAction = auditActionFilter === "ALL" || log.action.toUpperCase().includes(auditActionFilter.toUpperCase());

    return matchesQuery && matchesRole && matchesAction;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-stretch relative min-h-[750px] animate-fade-in text-left">
      
      {/* Toast Notification Bar */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold font-sans flex items-center gap-2.5 ${
              toast.type === "success"
                ? "bg-white border-primary/25 text-[#006c0c]"
                : toast.type === "error"
                ? "bg-rose-50 border-rose-150 text-rose-700"
                : "bg-zinc-90 w-full bg-zinc-900 border-zinc-800 text-white max-w-sm"
            }`}
          >
            <Check className="w-4 h-4 text-emerald-500" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR: Settings Navigation */}
      <div className="w-full lg:w-76 shrink-0 flex flex-col gap-6">
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-md p-5 space-y-4">
          
          {/* Header context */}
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-150">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-white">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-on-surface">Private Settings</h3>
              <p className="text-[10px] text-zinc-450 font-mono font-bold uppercase tracking-wider mt-0.5">Control Center</p>
            </div>
          </div>

          {/* Nav Buttons List */}
          <nav className="flex flex-col gap-1.5">
            {([
              { key: "org_profile", label: "Organization Profile", icon: Building, restriction: undefined },
              { key: "my_account", label: "My Account Profile", icon: User, restriction: undefined },
              { key: "users_roles", label: "Users & Core Roles", icon: Users, restriction: !isOwner && !isManager ? "read" : undefined },
              { key: "security", label: "Cryptographic Security", icon: Shield, restriction: undefined },
              { key: "notifications", label: "Notification Channels", icon: Bell, restriction: undefined },
              { key: "payment_config", label: "Payment Routing", icon: CreditCard, restriction: undefined },
              { key: "subscription_billing", label: "Plan & Corporate Billing", icon: Layers, restriction: !isOwner ? "owner" : undefined },
              { key: "audit_logs", label: "Secure Audit Trail", icon: FileText, restriction: undefined },
              { key: "data_export", label: "Data Portability", icon: Download, restriction: undefined }
            ] as const).map(tab => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.key;
              const isTabOwnerRestricted = tab.restriction === "owner";
              const isTabReadAllowed = tab.restriction === "read";

              // Filter display logic or locks
              const isRoleDenied = isTabOwnerRestricted && !isOwner;

              return (
                <button
                  key={tab.key}
                  disabled={isRoleDenied}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative w-full px-4 py-3 rounded-2xl flex items-center justify-between transition-all text-xs font-bold leading-none ${
                    isRoleDenied
                      ? "opacity-50 cursor-not-allowed text-zinc-350 bg-zinc-50/50"
                      : isSelected
                      ? "bg-primary text-white font-black scale-[1.01] shadow-md shadow-primary/10"
                      : "text-zinc-650 hover:text-zinc-900 hover:bg-zinc-50 hover:ring-1 hover:ring-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TabIcon className={`w-4 h-4 ${isSelected ? "text-white" : "text-zinc-400"}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>

                  {isRoleDenied ? (
                    <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? "text-white/60" : "text-zinc-350"}`} />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Security / System Boundary Warning */}
        <div className="bg-zinc-950 text-white rounded-3xl p-5 border border-zinc-800 shadow-md space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-1.5 text-primary text-[10px] uppercase font-bold font-mono tracking-wider">
            <Lock className="w-3.5 h-3.5" /> High-Security Schema Frame
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
            You are securely configuring organizational tenant <strong>{organization.id}</strong>.
          </p>
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-[#4CAF50] font-mono uppercase tracking-widest font-bold">100% PARTITION_SECURE</span>
          </div>
        </div>
      </div>

      {/* RIGHT CONTENT PANEL */}
      <div className="flex-1 bg-white rounded-3xl border border-zinc-200/80 shadow-md overflow-hidden flex flex-col justify-between">
        
        {/* Navigation Breadcrumb & Restrictions warning Banner */}
        <div className="border-b border-zinc-150 px-6 sm:px-8 py-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
              <span>Settings Portal</span>
              <span>/</span>
              <span className="text-primary">{activeTab.replace("_", " ")}</span>
            </div>
            <h2 className="text-xl font-black text-on-surface tracking-tight uppercase leading-normal mt-1 flex items-center gap-1.5">
              {activeTab === "org_profile" && "Organization Profile"}
              {activeTab === "my_account" && "My Account Profile"}
              {activeTab === "users_roles" && "Users & Roles Operating Hub"}
              {activeTab === "security" && "Cryptographic Security Controls"}
              {activeTab === "notifications" && "Global Alert Frequencies"}
              {activeTab === "payment_config" && "Payment Coordinates Matrix"}
              {activeTab === "subscription_billing" && "Workspace Plan & Billing"}
              {activeTab === "audit_logs" && "Secure Activity Audit Trails"}
              {activeTab === "data_export" && "Tenancy Data Portability"}
            </h2>
          </div>

          {/* Active clear roles banner */}
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3.5 py-1.5 rounded-xl text-xs font-bold leading-none shrink-0">
            <span className="text-zinc-600">Current Role:</span>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-primary/15 text-[#006c0c] uppercase font-black tracking-wide">
              {currentUser.role.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Read-Only Alert Bar when applicable */}
        {getRestrictionMessage() && (
          <div className="bg-amber-50 border-b border-amber-150 px-6 sm:px-8 py-3.5 flex items-center gap-3 text-xs text-amber-800 font-semibold leading-normal">
            <Info className="w-4.5 h-4.5 text-amber-600 shrink-0" />
            <span>{getRestrictionMessage()} Form edits and management actions are restricted in sandbox environments.</span>
          </div>
        )}

        {/* CONTENT CHANGER ENGINE */}
        <div className="p-6 sm:p-8 flex-1">
          <AnimatePresence mode="wait">
            
            {/* 1. ORGANIZATION PROFILE */}
            {activeTab === "org_profile" && (
              <motion.form
                key="org"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSaveOrgProfile}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company credentials */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Organization Legal Name</label>
                      <input
                        type="text"
                        disabled={isReadOnlyMode}
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-zinc-50/50"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Business Operational Type</label>
                      <input
                        type="text"
                        disabled={isReadOnlyMode}
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-zinc-50/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Phone Number</label>
                        <input
                          type="text"
                          disabled={isReadOnlyMode}
                          value={orgPhone}
                          onChange={(e) => setOrgPhone(e.target.value)}
                          className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Business Email</label>
                        <input
                          type="email"
                          disabled={isReadOnlyMode}
                          value={orgEmail}
                          onChange={(e) => setOrgEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Office Physical Address</label>
                      <input
                        type="text"
                        disabled={isReadOnlyMode}
                        value={orgAddress}
                        onChange={(e) => setOrgAddress(e.target.value)}
                        className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* Optional Metadata and logo placeholder */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Website URL (Optional)</label>
                      <input
                        type="text"
                        disabled={isReadOnlyMode}
                        value={orgWebsite}
                        onChange={(e) => setOrgWebsite(e.target.value)}
                        className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">KRA Tax PIN (Optional)</label>
                        <input
                          type="text"
                          disabled={isReadOnlyMode}
                          value={orgTaxPin}
                          onChange={(e) => setOrgTaxPin(e.target.value)}
                          className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Company Reg Number (Optional)</label>
                        <input
                          type="text"
                          disabled={isReadOnlyMode}
                          value={orgRegNumber}
                          onChange={(e) => setOrgRegNumber(e.target.value)}
                          className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    {/* Draggable Logo module */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Corporate Logo Image</label>
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-all ${
                          isDragOver ? "border-primary bg-primary/5" : "border-zinc-250 bg-zinc-50"
                        }`}
                      >
                        {orgLogo ? (
                          <div className="flex items-center gap-4 text-left">
                            <div className="w-16 h-16 rounded-xl border overflow-hidden shrink-0 bg-white">
                              <img src={orgLogo} alt="Corporate logo thumb" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-on-surface">Logo Cached Successfully</p>
                              <button
                                onClick={() => setOrgLogo(null)}
                                className="text-[10px] text-red-600 hover:underline uppercase font-bold font-mono mt-1"
                              >
                                Remove File
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center space-y-2">
                            <Building className="w-8 h-8 text-zinc-400 mx-auto" />
                            <p className="text-[10px] text-zinc-500 font-bold">Drag logo file here or select from disk</p>
                            <label className="inline-block px-3 py-1.5 bg-white border border-zinc-200 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer hover:border-zinc-300">
                              Choose Logo Image
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleManualFileSelect}
                                disabled={isReadOnlyMode}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-150 pt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setOrgName(organization.name);
                      triggerToast("Form values reset.", "info");
                    }}
                    className="px-5 py-2.5 rounded-xl border border-zinc-200 text-xs font-extrabold uppercase font-mono tracking-wider transition-all"
                  >
                    Reset Changes
                  </button>
                  <button
                    type="submit"
                    disabled={isReadOnlyMode}
                    className="px-5 py-2.5 rounded-xl bg-[#006c0c] text-white hover:bg-neutral-800 text-xs font-extrabold uppercase font-mono tracking-wider transition-all shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.form>
            )}

            {/* 2. MY ACCOUNT */}
            {activeTab === "my_account" && (
              <motion.div
                key="usr"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flat-card border p-6 rounded-2xl bg-zinc-50/50 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="w-20 h-20 bg-zinc-900 rounded-3xl shrink-0 flex items-center justify-center text-white border border-zinc-800 text-2xl font-black">
                    {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
                  </div>
                  <div className="space-y-1.5 flex-1 select-text">
                    <div className="flex gap-2 items-center flex-wrap">
                      <h3 className="text-lg font-black text-on-surface">{currentUser.firstName} {currentUser.lastName}</h3>
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[9px] uppercase font-bold tracking-wide">
                        {currentUser.role.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 flex items-center gap-1.5 font-bold">
                      <Mail className="w-4 h-4 text-zinc-400" /> {currentUser.email}
                    </p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1.5 font-bold">
                      <Phone className="w-4 h-4 text-zinc-400" /> {currentUser.phoneNumber || "+254 ..."}
                    </p>
                  </div>
                </div>

                {/* Account Form Options */}
                <form onSubmit={handleSaveMyAccount} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">First Name</label>
                      <input
                        type="text"
                        disabled={!isEditingAccount}
                        value={accFirstName}
                        onChange={(e) => setAccFirstName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-250 text-xs font-bold focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Last Name</label>
                      <input
                        type="text"
                        disabled={!isEditingAccount}
                        value={accLastName}
                        onChange={(e) => setAccLastName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-250 text-xs font-bold focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Business Email</label>
                      <input
                        type="email"
                        disabled={!isEditingAccount}
                        value={accEmail}
                        onChange={(e) => setAccEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-250 text-xs font-bold focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Mobile Number</label>
                      <input
                        type="text"
                        disabled={!isEditingAccount}
                        value={accPhone}
                        onChange={(e) => setAccPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-250 text-xs font-bold focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* Micro Actions Toggles for Sandbox safety visual verification */}
                  <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/50 space-y-3.5 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-extrabold text-[#006c0c]">Operator Security: Two-Factor Identification (2FA)</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed font-semibold">
                        Add an extra layer of privacy security to your organization owner profile.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTwoFactorEnabled(!twoFactorEnabled);
                        triggerToast(`2FA validation protocol ${!twoFactorEnabled ? "Activated" : "Deactivated"}`);
                      }}
                      className="text-primary hover:text-[#006c0c]"
                    >
                      {twoFactorEnabled ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-zinc-400" />}
                    </button>
                  </div>

                  {/* Micro Action Buttons */}
                  <div className="pt-3 border-t border-zinc-150 flex flex-wrap gap-2 justify-between">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => triggerToast("Direct SMS security check code dispatched.", "info")}
                        className="p-2 border rounded-xl text-[10px] font-bold font-mono uppercase tracking-wide bg-white"
                      >
                        Verify Device Active
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerToast("E-Logs request received. Report prepared in audits.", "info")}
                        className="p-2 border rounded-xl text-[10px] font-bold font-mono uppercase tracking-wide bg-white"
                      >
                        Request Access Logs
                      </button>
                    </div>

                    <div className="flex gap-2">
                      {isEditingAccount ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsEditingAccount(false)}
                            className="px-4.5 py-1.5 border border-zinc-350 bg-white rounded-xl text-xs font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4.5 py-1.5 bg-[#006c0c] text-white rounded-xl text-xs font-bold hover:bg-neutral-800"
                          >
                            Save Account Coordinates
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditingAccount(true)}
                          className="px-4.5 py-2 bg-zinc-90 w-full bg-zinc-900 text-white rounded-xl text-xs font-extrabold uppercase font-mono tracking-wider"
                        >
                          Unlock Profile Edits
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {/* 3. USERS & ROLES */}
            {activeTab === "users_roles" && (
              <motion.div
                key="usr_roles"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Users Control Board header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-150">
                  <div>
                    <h3 className="text-sm font-extrabold text-on-surface">Registered Organization Users</h3>
                    <p className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider mt-0.5">Isolated Security Partitions</p>
                  </div>

                  <div className="flex gap-2">
                    {isOwner && (
                      <button
                        onClick={() => {
                          setTransferTargetId("");
                          setShowTransferOwnerModal(true);
                        }}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold font-mono text-[10px] uppercase tracking-wider rounded-xl border border-rose-150 shrink-0 select-none"
                      >
                        Transfer Ownership
                      </button>
                    )}
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="px-4 py-2 bg-primary hover:bg-shadow text-white rounded-xl font-extrabold font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4 stroke-[3px]" /> Invite User
                    </button>
                  </div>
                </div>

                {/* Interactive Table of Active Users */}
                <div className="overflow-x-auto rounded-xl border border-zinc-150">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-50 border-b border-zinc-150">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-550 uppercase tracking-wider">User Operating Name</th>
                        <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-550 uppercase tracking-wider">Core RBAC Role</th>
                        <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-550 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-550 uppercase tracking-wider">Last Sync</th>
                        <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-550 uppercase tracking-wider">Properties</th>
                        <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-550 uppercase tracking-wider text-right">Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150-150 select-text">
                      {localUsers
                        .filter(u => u.organizationId === organization.id)
                        .map(user => {
                          const isStaticFirstUser = user.id === "user-fatuma";
                          return (
                            <tr key={user.id} className="hover:bg-slate-50/40">
                              <td className="px-4 py-3.5">
                                <p className="font-extrabold text-xs text-on-surface leading-normal">{user.firstName} {user.lastName}</p>
                                <p className="text-[10px] text-zinc-450 font-mono mt-0.5">{user.email}</p>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="inline-block px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wide bg-neutral-100 text-zinc-800 font-bold">
                                  {user.role.replace("_", " ")}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold leading-none ${
                                  user.isActive
                                    ? "bg-emerald-50 text-[#006c0c]"
                                    : "bg-red-50 text-red-700"
                                }`}>
                                  <span className={`w-1 h-1 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                                  {user.isActive ? "Active" : "Suspended"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-xs text-zinc-500 font-mono font-bold uppercase">
                                {isStaticFirstUser ? "Nairobi • Online" : "10 days ago"}
                              </td>
                              <td className="px-4 py-3.5 text-xs text-zinc-700 font-semibold truncate max-w-40">
                                {user.role === "tenant" ? "Unit B12" : "Global Clearance Tier"}
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono text-[10px]">
                                {user.role === "org_owner" ? (
                                  <span className="text-zinc-400 italic">No suspended override</span>
                                ) : (
                                  <div className="flex items-center justify-end gap-2 text-right">
                                    <button
                                      onClick={() => handleSuspendUserToggle(user.id)}
                                      className="hover:underline font-bold hover:text-red-600 text-zinc-650"
                                    >
                                      {user.isActive ? "Suspend" : "Activate"}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 4. SECURITY */}
            {activeTab === "security" && (
              <motion.div
                key="sec"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Password management check */}
                  <form onSubmit={handleSecurityPasswordChange} className="flat-card border p-5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black font-mono text-zinc-700 uppercase tracking-wider">Passcode Management</h3>
                    
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold font-mono text-zinc-500 uppercase">Current Security Passcode</label>
                      <input
                        type="password"
                        required
                        value={secCurrentPassword}
                        onChange={(e) => setSecCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold font-mono text-zinc-500 uppercase">New Security Passcode</label>
                      <input
                        type="password"
                        required
                        value={secNewPassword}
                        onChange={(e) => setSecNewPassword(e.target.value)}
                        placeholder="Create strong password"
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold font-mono text-zinc-500 uppercase">Confirm Secure Passcode</label>
                      <input
                        type="password"
                        required
                        value={secConfirmPassword}
                        onChange={(e) => setSecConfirmPassword(e.target.value)}
                        placeholder="Confirm strong password"
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-zinc-90 bg-zinc-900 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wide transition-all"
                    >
                      Update Passcode
                    </button>
                  </form>

                  {/* Sessions status */}
                  <div className="flat-card border p-5 rounded-3xl flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-150">
                        <h3 className="text-xs font-black font-mono text-zinc-700 uppercase tracking-wider">Active Device Logs</h3>
                        <button
                          onClick={handleTerminateAllSessions}
                          className="text-[9px] text-red-650 hover:underline font-mono uppercase font-black"
                        >
                          Revoke All Others
                        </button>
                      </div>

                      <div className="divide-y divide-zinc-150 space-y-3 pt-1">
                        {sessions.map((sess) => (
                          <div key={sess.id} className="pt-2 flex justify-between items-center text-xs">
                            <div className="space-y-0.5">
                              <p className="font-bold text-zinc-855 select-text leading-tight">{sess.device}</p>
                              <div className="flex gap-2 text-[10px] text-zinc-450 font-mono">
                                <span>{sess.location}</span>
                                <span>•</span>
                                <span>IP: {sess.ip}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {sess.lastActive === "Active Now" ? (
                                <span className="inline-block text-[9px] bg-emerald-50 text-[#006c0c] px-2 py-0.5 rounded font-bold">
                                  Current
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleTerminateSession(sess.id)}
                                  className="text-[10px] font-bold hover:text-red-650 text-zinc-450 font-mono uppercase shrink-0"
                                >
                                  Kill
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-zinc-50 border p-3.5 rounded-2xl flex gap-2">
                      <Lock className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-zinc-550 font-semibold leading-normal">
                        Session validations are cryptographically bound to isolated browser IP addresses.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Login Audit Trail Panel */}
                <div className="space-y-2 border-t border-zinc-150 pt-5 text-left">
                  <h3 className="text-xs font-black font-mono text-zinc-650 uppercase tracking-widest pl-1">Login Attempt Trail History</h3>
                  
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left font-sans border-collapse text-xs">
                      <thead className="bg-[#fcfdfc] border-b">
                        <tr>
                          <th className="px-4 py-2 text-[9px] font-bold font-mono text-zinc-500 uppercase">Timestamp Date</th>
                          <th className="px-4 py-2 text-[9px] font-bold font-mono text-zinc-500 uppercase">Device Specification</th>
                          <th className="px-4 py-2 text-[9px] font-bold font-mono text-zinc-500 uppercase">Geo Location</th>
                          <th className="px-4 py-2 text-[9px] font-bold font-mono text-zinc-500 uppercase text-right">Status Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150 text-[11px] font-bold text-zinc-650 select-text">
                        {loginHistory.map((h, i) => (
                          <tr key={i} className="hover:bg-slate-50/20">
                            <td className="px-4 py-2.5 font-mono text-zinc-500">{h.date}</td>
                            <td className="px-4 py-2.5 text-zinc-800">{h.device}</td>
                            <td className="px-4 py-2.5">{h.location}</td>
                            <td className="px-4 py-2.5 text-right">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                                h.status === "Success" ? "bg-emerald-50 text-[#006c0c]" : "bg-rose-50 text-rose-700"
                              }`}>
                                {h.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 5. NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <motion.div
                key="notif"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Channels selection triggers */}
                  <div className="flat-card border p-5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black font-mono text-zinc-700 uppercase tracking-wider pb-1 border-b">Available Dispatch Networks</h3>
                    
                    <div className="space-y-3">
                      {[
                        { key: "smsNotifications", label: "Transmit SMS Notifications via private Gateway", detail: "Charges 1.20 KSh flat per SMS sent to property tenants." },
                        { key: "emailNotifications", label: "Deliver Email Notification updates", detail: "Included inside core RentFlow infrastructure pricing." },
                        { key: "inAppNotifications", label: "Store in-App notifications", detail: "Provides quick access indicators logs directly to dashboard logs." }
                      ].map((pref) => (
                        <div key={pref.key} className="flex justify-between items-start gap-4 pt-1">
                          <div className="space-y-0.5 text-xs text-zinc-805 select-none">
                            <p className="font-extrabold text-zinc-800">{pref.label}</p>
                            <p className="text-[10px] text-zinc-500 font-mono leading-tight">{pref.detail}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNotifPreferences(prev => ({
                                ...prev,
                                [pref.key]: !prev[pref.key as keyof typeof notifPreferences]
                              }));
                            }}
                            className="shrink-0 pt-0.5"
                          >
                            {notifPreferences[pref.key as keyof typeof notifPreferences] ? (
                              <ToggleRight className="w-9 h-9 text-primary" />
                            ) : (
                              <ToggleLeft className="w-9 h-9 text-zinc-350" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Isolated System Triggers */}
                  <div className="flat-card border p-5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black font-mono text-[#006c0c] uppercase tracking-wider pb-1 border-b">Dispatched Triggers</h3>
                    
                    <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                      {[
                        { key: "rentDueReminders", label: "Rent Due Reminders", description: "Dispatched automatically to tenants 3 days before rent schedule is due." },
                        { key: "overdueRentAlerts", label: "Overdue Rent Alerts", description: "Triggered instantly on 5th day of month for late payments." },
                        { key: "paymentSubmitted", label: "Payment Submitted Logs", description: "Informs accountants instantly when tenant uploads transaction proof." },
                        { key: "paymentVerified", label: "Payment Verified Receipts", description: "Sends automatic SMS slip to tenant upon invoice payment approval." },
                        { key: "leaseExpiryAlerts", label: "Lease Expiry Notices", description: "Alerts landlord property owner 60 days before lease agreements expire." },
                        { key: "tenantInvitationAlerts", label: "Onboarding Invitations Logs", description: "Informs caretaker team when tenant profile receives private invitation." }
                      ].map((trig) => (
                        <div key={trig.key} className="flex justify-between items-start gap-4">
                          <div className="text-xs space-y-0.5">
                            <p className="font-extrabold text-zinc-850 leading-none">{trig.label}</p>
                            <p className="text-[10px] text-zinc-500">{trig.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNotifPreferences(prev => ({
                                ...prev,
                                [trig.key]: !prev[trig.key as keyof typeof notifPreferences]
                              }));
                            }}
                            className="shrink-0"
                          >
                            {notifPreferences[trig.key as keyof typeof notifPreferences] ? (
                              <ToggleRight className="w-8 h-8 text-primary" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-zinc-350" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit Panel preferences */}
                <div className="pt-4 border-t border-zinc-150 flex justify-end">
                  <button
                    onClick={handleSaveNotificationPrefs}
                    className="px-5 py-2.5 bg-primary hover:bg-[#000] text-white rounded-xl text-xs font-extrabold uppercase font-mono tracking-wider shadow"
                  >
                    Save Preferences
                  </button>
                </div>
              </motion.div>
            )}

            {/* 6. PAYMENT CONFIGURATION */}
            {activeTab === "payment_config" && (
              <motion.form
                key="pay_cfg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSavePaymentConfig}
                className="space-y-6"
              >
                <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl text-xs text-emerald-850 leading-relaxed font-semibold">
                  <span>Define the official payment instructions displayed to tenants during invoice submissions. Complete with correct business credentials to enable seamless tenant payment verification audit processes.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* MPesa configurations */}
                  <div className="flat-card border p-5 rounded-3xl space-y-4">
                    <span className="block text-[10px] font-black font-mono text-zinc-500 uppercase tracking-widest leading-none">M-Pesa Gateway Coordinates</span>
                    
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold font-mono text-zinc-650 uppercase">M-Pesa Official Paybill Number</label>
                      <input
                        type="text"
                        disabled={isReadOnlyMode}
                        value={payPaybill}
                        onChange={(e) => setPayPaybill(e.target.value)}
                        placeholder="e.g. 400200"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-250 text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold font-mono text-zinc-650 uppercase">M-Pesa Buy Goods Till Number</label>
                      <input
                        type="text"
                        disabled={isReadOnlyMode}
                        value={payTillNumber}
                        onChange={(e) => setPayTillNumber(e.target.value)}
                        placeholder="e.g. 9854721"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-250 text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold font-mono text-zinc-650 uppercase">Account Reference Instructions Rule</label>
                      <input
                        type="text"
                        disabled={isReadOnlyMode}
                        value={payRefInstructions}
                        onChange={(e) => setPayRefInstructions(e.target.value)}
                        className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold font-sans"
                        placeholder="Use Unit code"
                      />
                      <p className="text-[10px] text-zinc-400 font-mono">
                        Displayed inside the tenant billing viewport to minimize manual accountant verification queries.
                      </p>
                    </div>
                  </div>

                  {/* Bank Transfer details */}
                  <div className="flat-card border p-5 rounded-3xl space-y-4">
                    <span className="block text-[10px] font-black font-mono text-[#006c0c] uppercase tracking-widest leading-none">Direct Bank Wiring Instructions</span>
                    
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold font-mono text-zinc-650 uppercase">Core Bank Name</label>
                      <input
                        type="text"
                        disabled={isReadOnlyMode}
                        value={payBankName}
                        onChange={(e) => setPayBankName(e.target.value)}
                        className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-sans font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold font-mono text-zinc-650 uppercase">Account Number</label>
                        <input
                          type="text"
                          disabled={isReadOnlyMode}
                          value={payAccNumber}
                          onChange={(e) => setPayAccNumber(e.target.value)}
                          className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold font-mono text-zinc-650 uppercase">Account Name</label>
                        <input
                          type="text"
                          disabled={isReadOnlyMode}
                          value={payAccName}
                          onChange={(e) => setPayAccName(e.target.value)}
                          className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-zinc-700 font-sans"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold font-mono text-zinc-650 uppercase">Caretaker Manual Receipt Guidance</label>
                      <textarea
                        rows={2}
                        disabled={isReadOnlyMode}
                        value={payInstructions}
                        onChange={(e) => setPayInstructions(e.target.value)}
                        className="w-full px-3.5 py-2 border rounded-xl text-xs font-sans font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-150 pt-5 flex justify-end gap-2.5">
                  <button
                    type="submit"
                    disabled={isReadOnlyMode}
                    className="px-5 py-2.5 bg-primary hover:bg-[#000] text-white text-xs font-extrabold uppercase font-mono tracking-wider rounded-xl shadow transition"
                  >
                    Save Configuration
                  </button>
                </div>
              </motion.form>
            )}

            {/* 7. SUBSCRIPTION & BILLING */}
            {activeTab === "subscription_billing" && (
              <motion.div
                key="sub_bill"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {!isOwner && (
                  <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl flex gap-3 text-xs text-rose-700">
                    <Lock className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-sm text-rose-810 leading-none">Clearance Check Required</h4>
                      <p className="mt-1">Billing and Subscription plan modifications are strictly restricted to the primary registered Organization Owner profile.</p>
                    </div>
                  </div>
                )}

                {/* Display Current utilization status meters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="border p-5 rounded-2xl bg-zinc-50/40">
                    <span className="block text-[10px] font-bold font-mono text-zinc-400 uppercase">Subscription Status</span>
                    <h3 className="text-xl font-black text-[#006c0c] mt-1 flex items-center gap-1">
                      <CheckCircle className="w-5 h-5 text-emerald-500" /> Active T1
                    </h3>
                    <p className="text-[10px] text-zinc-450 font-mono mt-1 font-bold">Auto-Renews July 01, 2026</p>
                  </div>

                  <div className="border p-5 rounded-2xl bg-zinc-50/40 col-span-2">
                    <div className="flex justify-between items-center">
                      <span className="block text-[10px] font-bold font-mono text-zinc-400 uppercase">Tenant Partition utilization</span>
                      <span className="text-[10px] font-bold font-mono text-primary text-[#006c0c] uppercase">{activeUnitsCount} / {getUnitLimit()} Active Units</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-200 h-2 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${Math.min(100, (activeUnitsCount / getUnitLimit()) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-505 mt-2 font-semibold">
                      Upgrade to Pro or Enterprise layout partitions to bypass capacity locks.
                    </p>
                  </div>
                </div>

                {/* Upgrade cards grid */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black font-mono text-zinc-700 uppercase tracking-widest pl-1">Upgrade Corporate Plan</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { plan: "Starter" as const, price: "9,500 KSh / Mo", limit: "10 units limit", bg: "bg-white border-zinc-200" },
                      { plan: "Growth" as const, price: "24,000 KSh / Mo", limit: "50 units limit", bg: "bg-white border-zinc-200" },
                      { plan: "Pro" as const, price: "48,000 KSh / Mo", limit: "150 units limit", bg: "bg-white border-zinc-200" },
                      { plan: "Enterprise" as const, price: "Custom SaaS Quoting", limit: "Unlimited units limit", bg: "bg-purple-950/5 border-purple-200 text-purple-950" }
                    ].map((p, i) => {
                      const isActivePlan = currentPlan === p.plan || (p.plan === "Pro" && currentPlan === "Starter"); // Visual helper
                      return (
                        <div key={i} className={`border rounded-2xl p-4 flex flex-col justify-between ${p.bg} transition-all relative`}>
                          {currentPlan === p.plan && (
                            <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-[#006c0c] text-white text-[8px] font-mono font-bold uppercase rounded-full">
                              Current Plan
                            </span>
                          )}

                          <div className="space-y-1 pb-4">
                            <h4 className="font-extrabold text-xs text-zinc-800">{p.plan} T{i + 1}</h4>
                            <p className="text-sm font-black text-primary leading-tight font-mono">{p.price}</p>
                            <p className="text-[10px] text-zinc-500 font-mono font-bold">{p.limit}</p>
                          </div>

                          <button
                            onClick={() => handlePlanUpgrade(p.plan)}
                            disabled={!isOwner}
                            className={`w-full py-1.5 text-[10px] font-mono uppercase font-black tracking-wider rounded-lg border transition ${
                              currentPlan === p.plan
                                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border-zinc-200"
                                : "border-primary text-primary hover:bg-primary hover:text-white"
                            }`}
                          >
                            Activate Tier
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Billing invoice summary table */}
                <div className="space-y-3.5 border-t border-zinc-150 pt-5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black font-mono text-zinc-650 uppercase tracking-widest pl-1">Corporate Billing History</h3>
                    <button
                      onClick={() => triggerToast("Invoices report consolidated. Directing download.", "info")}
                      className="text-[10px] text-primary hover:underline font-mono uppercase font-black"
                    >
                      Export All Bills
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border text-xs">
                    <table className="w-full text-left font-sans border-collapse">
                      <thead className="bg-[#fcfdfc] border-b text-zinc-505">
                        <tr>
                          <th className="px-4 py-2 text-[9px] font-bold font-mono">Invoice Ref</th>
                          <th className="px-4 py-2 text-[9px] font-bold font-mono">Invoicing Period</th>
                          <th className="px-4 py-2 text-[9px] font-bold font-mono">Billed Amount</th>
                          <th className="px-4 py-2 text-[9px] font-bold font-mono">Ledger Status</th>
                          <th className="px-4 py-2 text-[9px] font-bold font-mono text-right">Receipt File</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150-150 font-bold font-mono text-zinc-600">
                        <tr className="hover:bg-slate-50/10">
                          <td className="px-4 py-2.5">INV-2026-06</td>
                          <td className="px-4 py-2.5 font-sans">June 2026 Billing</td>
                          <td className="px-4 py-2.5">9,500 KSh</td>
                          <td className="px-4 py-2.5">
                            <span className="bg-emerald-50 text-[#006c0c] px-2 py-0.5 rounded text-[9px]">PAID</span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-sans">
                            <button
                              onClick={() => triggerToast("Acquiring PDF slip binary...", "info")}
                              className="text-primary hover:underline text-[10px]"
                            >
                              Download PDF
                            </button>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50/10">
                          <td className="px-4 py-2.5">INV-2026-05</td>
                          <td className="px-4 py-2.5 font-sans">May 2026 Billing</td>
                          <td className="px-4 py-2.5">9,500 KSh</td>
                          <td className="px-4 py-2.5">
                            <span className="bg-emerald-50 text-[#006c0c] px-2 py-0.5 rounded text-[9px]">PAID</span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-sans">
                            <button
                              onClick={() => triggerToast("Acquiring May PDF bill...", "info")}
                              className="text-primary hover:underline text-[10px]"
                            >
                              Download PDF
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 8. AUDIT LOGS */}
            {activeTab === "audit_logs" && (
              <motion.div
                key="audit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Search / Filters and Action Panel */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-1">
                  <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search audit trail by action keywords..."
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-250 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <select
                      value={auditRoleFilter}
                      onChange={(e) => setAuditRoleFilter(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-[#fcfdfc]"
                    >
                      <option value="ALL">All RBAC Roles</option>
                      <option value="ORG_OWNER">Owner Only</option>
                      <option value="PROPERTY_MANAGER">Manager Only</option>
                      <option value="ACCOUNTANT">Accountants Only</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      triggerToast("Consolidating system logs...", "info");
                      setTimeout(() => triggerToast("✓ Generated CSV Log successfully!"), 1000);
                    }}
                    className="py-2.5 bg-zinc-90 w-full bg-zinc-900 text-white rounded-xl text-xs font-extrabold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 shadow"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Export Logs
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-left font-sans border-collapse text-xs select-text">
                    <thead className="bg-[#fcfdfc] border-b">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-500 uppercase">Timestamp Date</th>
                        <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-500 uppercase">Operating User</th>
                        <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-500 uppercase">RBAC Role</th>
                        <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-500 uppercase">Action Code</th>
                        <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-500 uppercase text-right">Details Meta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 text-[11px] font-bold text-zinc-600">
                      {filteredAudits.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 italic">
                            No logs found matching audit filters parameters.
                          </td>
                        </tr>
                      ) : (
                        filteredAudits.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/10">
                            <td className="px-4 py-3 font-mono text-zinc-450">{log.timestamp}</td>
                            <td className="px-4 py-3 text-zinc-800">{log.user}</td>
                            <td className="px-4 py-3 uppercase">
                              <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded leading-none text-[9px] font-bold">
                                {log.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-zinc-700 font-extrabold uppercase">{log.action.replaceAll("_", " ")}</td>
                            <td className="px-4 py-3 text-right max-w-56 truncate font-sans text-xs" title={log.newValue}>
                              {log.newValue}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 9. DATA EXPORT */}
            {activeTab === "data_export" && (
              <motion.div
                key="export"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Select parameters */}
                  <div className="flat-card border p-5 rounded-3xl space-y-4">
                    <span className="block text-[10px] font-black font-mono text-zinc-500 uppercase tracking-widest leading-none">Export Targets Config</span>
                    
                    <div className="grid grid-cols-2 gap-3 pb-2 select-none">
                      {[
                        { key: "tenants" as const, label: "Tenants Directory" },
                        { key: "units" as const, label: "Isolated Units Registry" },
                        { key: "properties" as const, label: "Properties Portfolio" },
                        { key: "leases" as const, label: "Lease Agreements" },
                        { key: "payments" as const, label: "Payments Ledger" },
                        { key: "auditLogs" as const, label: "Security Audit Logs" }
                      ].map((tgt) => (
                        <div
                          key={tgt.key}
                          onClick={() => {
                            setCheckedExports(prev => ({
                              ...prev,
                              [tgt.key]: !prev[tgt.key]
                            }));
                          }}
                          className={`p-3 border rounded-xl cursor-pointer text-left transition ${
                            checkedExports[tgt.key]
                              ? "border-primary bg-primary/5 font-extrabold text-[#006c0c]"
                              : "border-zinc-200 bg-white"
                          }`}
                        >
                          <p className="text-xs font-bold leading-normal">{tgt.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Formats Selection */}
                    <div className="space-y-2 border-t border-zinc-100 pt-3 text-left">
                      <label className="block text-[10px] font-bold font-mono text-zinc-500 uppercase">Export Output Format</label>
                      <div className="flex gap-4">
                        {["CSV", "Excel", "PDF"].map((fmt) => (
                          <label key={fmt} className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-700 cursor-pointer">
                            <input
                              type="radio"
                              name="fmt"
                              value={fmt}
                              checked={exportFormat === fmt}
                              onChange={() => setExportFormat(fmt as any)}
                              className="w-4 h-4 text-primary"
                            />
                            <span>{fmt}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateExport}
                      disabled={isGeneratingExport}
                      className="w-full py-3 bg-[#006c0c] text-white hover:bg-neutral-800 rounded-xl text-xs font-extrabold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 shadow"
                    >
                      {isGeneratingExport ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generating Safe Files...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Generate Export Data</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Export History */}
                  <div className="flat-card border p-5 rounded-3xl space-y-4 text-left">
                    <span className="block text-[10px] font-black font-mono text-[#006c0c] uppercase tracking-widest leading-none">Download History Log</span>
                    
                    <div className="divide-y divide-zinc-150 pt-1 space-y-3">
                      {exportHistory.map((exp) => (
                        <div key={exp.id} className="pt-2 flex justify-between items-center text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-zinc-400 text-[10px]">{exp.id}</span>
                              <span className="font-extrabold text-zinc-800">{exp.targets}</span>
                            </div>
                            <div className="flex gap-2 text-[10px] text-zinc-455 font-mono">
                              <span>{exp.date}</span>
                              <span>•</span>
                              <span>Size: {exp.size}</span>
                              <span>•</span>
                              <span className="font-extrabold">{exp.format}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => triggerToast(`Re-downloading ${exp.id}...`)}
                            className="p-1.5 border border-zinc-200 rounded hover:underline font-mono text-[9px] uppercase font-bold text-zinc-550 hover:border-zinc-350"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MODAL 1: INVITE USER */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-md w-full bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              {/* Header */}
              <div className="bg-zinc-900 text-white px-6 py-4 flex justify-between items-center text-left">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold tracking-tight">Invite Corporate Member</h3>
                    <p className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Workspace Operator Invites</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 hover:bg-zinc-855 rounded-lg text-zinc-450 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={inviteRole === "org_owner" ? (e) => { e.preventDefault(); setShowTransferOwnerModal(true); setShowInviteModal(false); } : handleInviteUserSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-zinc-500 uppercase">Operator Full Name</label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Kevin Mwangi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-250 text-xs font-semibold focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-zinc-500 uppercase">Operator Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="e.g. kevin@amani.co"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-250 text-xs font-semibold focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-zinc-500 uppercase">Operating Mobile Contact</label>
                  <input
                    type="text"
                    required
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="e.g. +254 712 345 678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-250 text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold font-mono text-zinc-500 uppercase">Workspace Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                    >
                      <option value="org_owner">Corporate Owner</option>
                      <option value="property_manager">Property Manager</option>
                      <option value="accountant">Accountant</option>
                      <option value="caretaker">Caretaker</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold font-mono text-zinc-500 uppercase">Property Bounds (Optional)</label>
                    <select
                      value={inviteAssignedProperty}
                      onChange={(e) => setInviteAssignedProperty(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                    >
                      <option value="">All Properties (Global)</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t text-right">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-2.5 border rounded-xl text-xs font-bold font-mono uppercase transition hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold font-mono uppercase shadow"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CONFIRM OWNERSHIP TRANSFER */}
      <AnimatePresence>
        {showTransferOwnerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTransferOwnerModal(false)}
              className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-md w-full bg-white border border-rose-200 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 space-y-4 text-left"
            >
              <div className="flex items-center gap-3.5 pb-2 border-b border-rose-100">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-red-600">
                  <AlertTriangle className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-950 leading-none">Transfer Corporate Ownership</h3>
                  <p className="text-[10px] text-zinc-450 font-mono uppercase tracking-wider mt-1">High-Security Action Required</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-zinc-550 leading-normal">
                <p><strong>Warning:</strong> Transferring ownership is irreversible and changes the workspace key master. Once signed off, your login permissions will lower and only the designated target can alter SaaS subscription plans or perform future ownership transfers.</p>
              </div>

              <form onSubmit={handleTransferOwnershipSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold font-mono text-zinc-500 uppercase">Select Target Operator</label>
                  <select
                    required
                    value={transferTargetId}
                    onChange={(e) => setTransferTargetId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-red-200 bg-rose-50/10 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="">-- Validated Operators --</option>
                    {localUsers
                      .filter(u => u.organizationId === organization.id && u.role !== "org_owner")
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.role.replace("_", " ")})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="p-3 bg-rose-50/50 border border-red-50 text-[10px] text-zinc-500 font-medium leading-relaxed rounded-xl">
                  By clicking final transfer, you cryptographically sign-off ledger keys to the target tenant operator partition.
                </div>

                <div className="flex gap-2.5 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowTransferOwnerModal(false)}
                    className="flex-1 py-1.5 border hover:bg-zinc-50 text-xs font-mono uppercase font-bold rounded-xl"
                  >
                    Abort Action
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-mono uppercase font-bold rounded-xl shadow"
                  >
                    Final Transfer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
