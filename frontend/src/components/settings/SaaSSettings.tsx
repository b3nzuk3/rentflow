"use client";

import { useState, useEffect } from "react";
import {
  Building, UserCircle, Users, Bell, CreditCard, Layers, FileText, Download,
  Check, X, Plus, Lock, Phone, Mail, Globe, Settings, ChevronRight, Search,
  AlertTriangle, CheckCircle, Info, Eye, EyeOff, Smartphone, MapPin, Laptop, ArrowRight, Clock
} from "lucide-react";
import { api } from "@/lib/api";
import type { Organization, User, UserRole, Property } from "@/types";

type SettingsTab = "org_profile" | "my_account" | "users_roles" | "notifications" | "payment_config" | "subscription_billing" | "audit_logs" | "data_export";

const tabs: { key: SettingsTab; label: string; icon: React.ElementType; ownerOnly?: boolean }[] = [
  { key: "org_profile", label: "Organization Profile", icon: Building, ownerOnly: true },
  { key: "my_account", label: "My Account Profile", icon: UserCircle },
  { key: "users_roles", label: "Users & Core Roles", icon: Users, ownerOnly: true },
  { key: "notifications", label: "Notification Channels", icon: Bell },
  { key: "payment_config", label: "Payment Routing", icon: CreditCard },
  { key: "subscription_billing", label: "Plan & Corporate Billing", icon: Layers, ownerOnly: true },
  { key: "audit_logs", label: "Secure Audit Trail", icon: FileText },
  { key: "data_export", label: "Data Portability", icon: Download },
];

const roleLabels: Record<string, string> = {
  org_owner: "Org Owner",
  property_manager: "Property Manager",
  accountant: "Accountant",
  caretaker: "Caretaker",
};

export function SaaSSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("my_account");
  const [org, setOrg] = useState<Organization | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Org profile
  const [orgName, setOrgName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgTaxPin, setOrgTaxPin] = useState("");
  const [orgRegNumber, setOrgRegNumber] = useState("");

  // Account
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accFirstName, setAccFirstName] = useState("");
  const [accLastName, setAccLastName] = useState("");
  const [accEmail, setAccEmail] = useState("");
  const [accPhone, setAccPhone] = useState("");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState({
    rentDueReminders: true, overdueRentAlerts: true, paymentSubmitted: true,
    paymentVerified: true, leaseExpiryAlerts: true, tenantInvitationAlerts: true,
    smsNotifications: true, emailNotifications: true, inAppNotifications: true,
  });

  // Payment config
  const [payPaybill, setPayPaybill] = useState("400200");
  const [payTillNumber, setPayTillNumber] = useState("9854721");
  const [payBankName, setPayBankName] = useState("Co-operative Bank of Kenya");
  const [payAccNumber, setPayAccNumber] = useState("11094723019253");
  const [payAccName, setPayAccName] = useState("Amani Property Management Trust");

  // Data export
  const [exportFormat, setExportFormat] = useState<"CSV" | "Excel" | "PDF">("CSV");
  const [exportEntities, setExportEntities] = useState({
    tenants: true, units: true, properties: true, leases: true, payments: true, auditLogs: false,
  });

  // Users & Roles
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    role: "property_manager" as UserRole,
  });
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditEntityFilter, setAuditEntityFilter] = useState("");
  const [auditActions, setAuditActions] = useState<string[]>([]);
  const [auditEntities, setAuditEntities] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === "audit_logs") {
      loadAuditLogs();
      loadAuditFilters();
    }
  }, [activeTab, auditSearch, auditActionFilter, auditEntityFilter]);

  const loadData = async () => {
    try {
      const [orgRes, userRes, propsRes] = await Promise.all([
        api.get("/organizations/me").catch(() => null),
        api.get("/users/me").catch(() => null),
        api.get("/properties/").catch(() => null),
      ]);
      if (orgRes) {
        const o = orgRes.data;
        setOrg(o);
        setOrgName(o.name || "");
        setBusinessType(o.business_type || "");
        setOrgPhone(o.phone || "");
        setOrgEmail(o.email || "");
        setOrgAddress(o.address || "");
        setOrgWebsite(o.website || "");
        setOrgTaxPin(o.tax_pin || "");
        setOrgRegNumber(o.reg_number || "");
      }
      if (userRes) {
        const u = userRes.data;
        setUser(u);
        setAccFirstName(u.first_name || "");
        setAccLastName(u.last_name || "");
        setAccEmail(u.email || "");
        setAccPhone(u.phone_number || "");
      } else {
        // Fallback to stored user
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          setUser(u);
          setAccFirstName(u.first_name || "");
          setAccLastName(u.last_name || "");
          setAccEmail(u.email || "");
          setAccPhone(u.phone_number || "");
        }
      }
      if (propsRes) {
        setProperties(propsRes.data || []);
      }
      await loadUsers();
    } catch (err) {
      console.error("Failed to load settings data", err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get("/users/");
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to load users", err);
      showToast("Failed to load users", "error");
    } finally {
      setUsersLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch(`/organizations/${org?.id}`, {
        name: orgName,
        business_type: businessType || undefined,
        phone: orgPhone || undefined,
        email: orgEmail || undefined,
        address: orgAddress || undefined,
        website: orgWebsite || undefined,
        tax_pin: orgTaxPin || undefined,
        reg_number: orgRegNumber || undefined,
      });
      setOrg(res.data);
      showToast("✓ Organization profile saved!");
    } catch { showToast("Failed to save", "error"); }
    finally { setSaving(false); }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch("/users/me", {
        first_name: accFirstName,
        last_name: accLastName,
        email: accEmail,
        phone_number: accPhone,
      });
      setUser(res.data);
      // Update stored user in localStorage
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem("user", JSON.stringify({ ...parsed, ...res.data }));
      }
      setIsEditingAccount(false);
      showToast("✓ Account settings saved!");
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to save", "error");
    }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { showToast("Passwords do not match", "error"); return; }
    if (newPassword.length < 8) { showToast("Password must be at least 8 characters", "error"); return; }
    setChangingPassword(true);
    try {
      await api.patch("/users/me/password", { current_password: currentPassword, new_password: newPassword });
      showToast("✓ Password updated!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) { showToast(err.response?.data?.detail || "Failed to change password", "error"); }
    finally { setChangingPassword(false); }
  };

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { showToast("✓ Payment configuration saved!"); }
    catch { showToast("Failed to save", "error"); }
    finally { setSaving(false); }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (auditSearch) params.set("search", auditSearch);
      if (auditActionFilter) params.set("action", auditActionFilter);
      if (auditEntityFilter) params.set("entity", auditEntityFilter);
      const { data } = await api.get(`/audit?${params.toString()}`);
      setAuditLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setAuditLoading(false);
    }
  };

  const loadAuditFilters = async () => {
    try {
      const [actionsRes, entitiesRes] = await Promise.all([
        api.get("/audit/actions").catch(() => ({ data: [] })),
        api.get("/audit/entities").catch(() => ({ data: [] })),
      ]);
      setAuditActions(actionsRes.data);
      setAuditEntities(entitiesRes.data);
    } catch {}
  };

  const getActionColor = (action: string) => {
    if (action.startsWith("CREATE") || action.startsWith("INVITE")) return "bg-emerald-50 text-emerald-700";
    if (action.startsWith("UPDATE") || action.startsWith("VERIFY") || action.startsWith("SIGN") || action.startsWith("TOGGLE")) return "bg-blue-50 text-blue-700";
    if (action.startsWith("DELETE")) return "bg-red-50 text-red-700";
    return "bg-slate-50 text-slate-700";
  };

  const handleGenerateExport = async () => {
    const selectedEntities = Object.entries(exportEntities).filter(([_, v]) => v).map(([k]) => k);
    if (selectedEntities.length === 0) {
      showToast("Select at least one entity to export", "error");
      return;
    }
    for (const entity of selectedEntities) {
      try {
        const response = await api.get(`/export/${entity}`, { responseType: "blob" });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${entity}_export.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        showToast(`Failed to export ${entity}`, "error");
      }
    }
    showToast(`✓ Exported ${selectedEntities.length} file(s)`);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const currentPlan = org?.subscription_plan || "Starter";
  const activeUnitsCount = 10;
  const getUnitLimit = () => { if (currentPlan === "Starter") return 10; if (currentPlan === "Growth") return 50; return 1000; };

  const filteredTabs = tabs.filter(tab => {
    if (tab.ownerOnly && user?.role !== "org_owner") return false;
    return true;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-10 items-stretch relative min-h-[750px] animate-fade-in text-left">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 animate-fade-in ${toast.type === "success" ? "bg-white border-primary/25 text-[#006c0c]" : toast.type === "error" ? "bg-rose-50 border-rose-150 text-rose-700" : "bg-zinc-900 border-zinc-800 text-white max-w-sm"}`}>
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-md p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-150">
            <div className="w-11 h-11 rounded-2xl bg-zinc-900 flex items-center justify-center text-white"><Settings className="w-5 h-5" /></div>
            <div>
              <h3 className="font-extrabold text-sm text-on-surface">Settings</h3>
              <p className="text-[10px] text-zinc-450 font-mono font-bold uppercase tracking-wider mt-1">Control Center</p>
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            {filteredTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`relative w-full px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all text-xs font-bold leading-none ${isActive ? "bg-primary text-white font-black scale-[1.01] shadow-md shadow-primary/10" : "text-zinc-650 hover:text-zinc-900 hover:bg-zinc-50 hover:ring-1 hover:ring-zinc-200"}`}>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-zinc-400"}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${isActive ? "text-white/60" : "text-zinc-350"}`} />
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* RIGHT CONTENT PANEL */}
      <div className="flex-1 bg-white rounded-3xl border border-zinc-200/80 shadow-md overflow-hidden flex flex-col justify-between">
        {/* Header breadcrumb */}
        <div className="border-b border-zinc-150 px-8 sm:px-10 py-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
              <span>Settings Portal</span><span>/</span>
              <span className="text-primary">{activeTab.replace(/_/g, " ")}</span>
            </div>
            <h2 className="text-2xl font-black text-on-surface tracking-tight uppercase leading-normal mt-2">
              {activeTab === "org_profile" && "Organization Profile"}
              {activeTab === "my_account" && "My Account Profile"}
              {activeTab === "users_roles" && "Users & Roles Operating Hub"}
              {activeTab === "notifications" && "Global Alert Frequencies"}
              {activeTab === "payment_config" && "Payment Coordinates Matrix"}
              {activeTab === "subscription_billing" && "Workspace Plan & Billing"}
              {activeTab === "audit_logs" && "Secure Activity Audit Trails"}
              {activeTab === "data_export" && "Tenancy Data Portability"}
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-xl text-xs font-bold leading-none shrink-0">
            <span className="text-zinc-600">Current Role:</span>
            <span className="px-2.5 py-0.5 rounded font-mono text-[10px] bg-primary/15 text-[#006c0c] uppercase font-black tracking-wide">{roleLabels[user?.role || ""] || user?.role}</span>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8 sm:p-10 flex-1">

          {/* 1. ORG PROFILE */}
          {activeTab === "org_profile" && (
            <form onSubmit={handleSaveOrg} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Organization Legal Name</label>
                    <input value={orgName} onChange={e => setOrgName(e.target.value)} className="w-full px-4 py-3.5 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-zinc-50/50" required />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Business Operational Type</label>
                    <input value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full px-4 py-3.5 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-zinc-50/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Phone Number</label>
                      <input value={orgPhone} onChange={e => setOrgPhone(e.target.value)} className="w-full px-4 py-3.5 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Business Email</label>
                      <input value={orgEmail} onChange={e => setOrgEmail(e.target.value)} className="w-full px-4 py-3.5 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Office Physical Address</label>
                    <input value={orgAddress} onChange={e => setOrgAddress(e.target.value)} className="w-full px-4 py-3.5 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Website URL (Optional)</label>
                    <input value={orgWebsite} onChange={e => setOrgWebsite(e.target.value)} className="w-full px-4 py-3.5 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">KRA Tax PIN (Optional)</label>
                      <input value={orgTaxPin} onChange={e => setOrgTaxPin(e.target.value)} className="w-full px-4 py-3.5 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Company Reg Number (Optional)</label>
                      <input value={orgRegNumber} onChange={e => setOrgRegNumber(e.target.value)} className="w-full px-4 py-3.5 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                  {/* Logo upload */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Corporate Logo Image</label>
                    <div className="border-2 border-dashed border-zinc-250 bg-zinc-50 rounded-2xl p-6 flex flex-col items-center justify-center">
                      <Building className="w-10 h-10 text-zinc-400 mb-3" />
                      <p className="text-xs text-zinc-500 font-bold">Drag logo file here or select from disk</p>
                      <label className="mt-3 inline-block px-4 py-2 bg-white border border-zinc-200 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer hover:border-zinc-300">
                        Choose Logo Image <input type="file" accept="image/*" className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-zinc-150 pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => { setOrgName(org?.name || ""); showToast("Form values reset.", "info"); }} className="px-6 py-3 rounded-xl border border-zinc-200 text-xs font-extrabold uppercase font-mono tracking-wider">Reset Changes</button>
                <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl bg-[#006c0c] text-white hover:bg-neutral-800 text-xs font-extrabold uppercase font-mono tracking-wider transition-all shadow-md disabled:opacity-50">Save Changes</button>
              </div>
            </form>
          )}

          {/* 2. MY ACCOUNT */}
          {activeTab === "my_account" && (
            <div className="space-y-8">
              <div className="flat-card border p-7 rounded-2xl bg-zinc-50/50 flex flex-col md:flex-row gap-7 items-start md:items-center">
                <div className="w-24 h-24 bg-zinc-900 rounded-3xl shrink-0 flex items-center justify-center text-white border border-zinc-800 text-3xl font-black">FA</div>
                <div className="space-y-2 flex-1 select-text">
                  <div className="flex gap-2.5 items-center flex-wrap">
                    <h3 className="text-xl font-black text-on-surface">{accFirstName} {accLastName}</h3>
                    <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono text-[9px] uppercase font-bold tracking-wide">Org Owner</span>
                  </div>
                  <p className="text-sm text-zinc-500 flex items-center gap-2 font-bold"><Mail className="w-4 h-4 text-zinc-400" /> {accEmail}</p>
                  <p className="text-sm text-zinc-500 flex items-center gap-2 font-bold"><Phone className="w-4 h-4 text-zinc-400" /> {accPhone}</p>
                </div>
                <button onClick={() => setIsEditingAccount(!isEditingAccount)} className="px-5 py-2.5 border border-zinc-200 rounded-xl text-xs font-bold">{isEditingAccount ? "Cancel" : "Edit Profile"}</button>
              </div>
              {isEditingAccount && (
                <form onSubmit={handleSaveAccount} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2"><label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">First Name</label><input value={accFirstName} onChange={e => setAccFirstName(e.target.value)} className="w-full px-4 py-3.5 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" /></div>
                    <div className="space-y-2"><label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Last Name</label><input value={accLastName} onChange={e => setAccLastName(e.target.value)} className="w-full px-4 py-3.5 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" /></div>
                  </div>
                  <div className="space-y-2"><label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Email</label><input value={accEmail} onChange={e => setAccEmail(e.target.value)} className="w-full px-4 py-3.5 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" /></div>
                  <div className="space-y-2"><label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Phone</label><input value={accPhone} onChange={e => setAccPhone(e.target.value)} className="w-full px-4 py-3.5 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" /></div>
                  <button type="submit" className="px-7 py-3 bg-primary text-white rounded-xl font-bold text-xs">Save Changes</button>
                </form>
              )}

              {/* Change Password */}
              <div className="flat-card border p-7 rounded-2xl bg-zinc-50/50 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-zinc-150">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Lock className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-lg font-extrabold text-on-surface">Change Password</h3>
                    <p className="text-[10px] font-mono text-zinc-450 uppercase tracking-wider">Update your account password</p>
                  </div>
                </div>
                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-4 py-3.5 pr-12 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-zinc-50/50"
                        disabled={changingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                        aria-label={showCurrentPw ? "Hide password" : "Show password"}
                      >
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 8 characters)"
                        className="w-full px-4 py-3.5 pr-12 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-zinc-50/50"
                        disabled={changingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                        aria-label={showNewPw ? "Hide password" : "Show password"}
                      >
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-450 font-mono">Minimum 8 characters</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-3.5 pr-12 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-zinc-50/50"
                        disabled={changingPassword}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-7 py-3 bg-[#006c0c] text-white hover:bg-neutral-800 rounded-xl font-bold text-xs uppercase font-mono tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {changingPassword ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 3. USERS & ROLES */}
          {activeTab === "users_roles" && (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-150">
                <div>
                  <h3 className="text-base font-extrabold text-on-surface">Registered Organization Users</h3>
                  <p className="text-xs text-zinc-400 font-mono font-bold uppercase tracking-wider mt-1">Isolated Security Partitions</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold font-mono text-[10px] uppercase tracking-wider rounded-xl border border-rose-150 shrink-0">Transfer Ownership</button>
                  <button onClick={() => setShowInviteModal(true)} className="px-4 py-2 bg-primary hover:bg-shadow text-white rounded-xl font-extrabold font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm"><Plus className="w-4 h-4 stroke-[3px]" /> Invite User</button>
                </div>
              </div>

              {/* Users Table */}
              {usersLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-8 text-center">
                  <Users className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-on-surface-variant">No users found</p>
                  <p className="text-[10px] text-zinc-450 font-mono mt-1">Click "Invite User" to add team members</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-150">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-50 border-b border-zinc-150">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-550 uppercase tracking-wider">User Operating Name</th>
                        <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-550 uppercase tracking-wider">Core RBAC Role</th>
                        <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-550 uppercase tracking-wider">Properties</th>
                        <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-550 uppercase tracking-wider text-right">Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 select-text">
                      {users.filter(u => u.role !== "tenant" && u.role !== "super_admin").map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/40">
                          <td className="px-4 py-3.5">
                            <p className="font-extrabold text-xs text-on-surface leading-normal">{user.first_name} {user.last_name}</p>
                            <p className="text-[10px] text-zinc-450 font-mono mt-0.5">{user.email}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-block px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wide bg-neutral-100 text-zinc-800 font-bold">{user.role.replace("_", " ")}</span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-zinc-700 font-semibold truncate max-w-40">
                            {user.role === "org_owner" ? "All Properties" : 
                             user.assigned_property_ids?.length ? 
                               user.assigned_property_ids.map(id => properties.find(p => p.id === id)?.name || id).join(", ") :
                               "No properties assigned"}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-[10px]">
                            {user.role === "org_owner" ? (
                              <span className="text-zinc-400 italic">No suspended override</span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      await api.patch(`/users/${user.id}/toggle`);
                                      showToast(user.is_active ? "User suspended" : "User activated");
                                      loadUsers();
                                    } catch {
                                      showToast("Failed to update user status", "error");
                                    }
                                  }}
                                  className={`hover:underline font-bold ${user.is_active ? "hover:text-red-600 text-zinc-650" : "hover:text-emerald-600 text-zinc-650"}`}
                                >
                                  {user.is_active ? "Suspend" : "Activate"}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Invite User Modal */}
              {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                  <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-2xl w-full max-w-md animate-slide-up">
                    <div className="flex items-center justify-between p-5 border-b border-zinc-150">
                      <h3 className="text-lg font-black text-on-surface">Invite New User</h3>
                      <button onClick={() => { setShowInviteModal(false); setInviteForm({ first_name: "", last_name: "", email: "", phone_number: "", role: "property_manager" }); setSelectedPropertyIds([]); }} className="w-8 h-8 rounded-xl hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setInviteSubmitting(true);
                      try {
                        await api.post("/users/invite", { ...inviteForm, property_ids: selectedPropertyIds });
                        showToast("User invited successfully!");
                        setShowInviteModal(false);
                        setInviteForm({ first_name: "", last_name: "", email: "", phone_number: "", role: "property_manager" });
                        setSelectedPropertyIds([]);
                        loadUsers();
                      } catch (err: any) {
                        showToast(err.response?.data?.detail || "Failed to invite user", "error");
                      } finally {
                        setInviteSubmitting(false);
                      }
                    }} className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">First Name</label>
                          <input value={inviteForm.first_name} onChange={e => setInviteForm({ ...inviteForm, first_name: e.target.value })} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-zinc-50/50" required />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Last Name</label>
                          <input value={inviteForm.last_name} onChange={e => setInviteForm({ ...inviteForm, last_name: e.target.value })} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-zinc-50/50" required />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Email</label>
                        <input type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-zinc-50/50" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Phone Number</label>
                        <input type="tel" value={inviteForm.phone_number} onChange={e => setInviteForm({ ...inviteForm, phone_number: e.target.value })} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-zinc-50/50" required />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Role</label>
                        <select value={inviteForm.role} onChange={e => setInviteForm({ ...inviteForm, role: e.target.value as UserRole })} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-zinc-50/50">
                          <option value="property_manager">Property Manager</option>
                          <option value="accountant">Accountant</option>
                          <option value="caretaker">Caretaker</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Assigned Properties</label>
                        <div className="border border-zinc-250 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                          {properties.map(prop => (
                            <label key={prop.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPropertyIds.includes(prop.id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedPropertyIds([...selectedPropertyIds, prop.id]);
                                  } else {
                                    setSelectedPropertyIds(selectedPropertyIds.filter(id => id !== prop.id));
                                  }
                                }}
                                className="rounded"
                              />
                              <span className="text-xs font-bold">{prop.name}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">{prop.location}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-2 border-t border-zinc-150">
                        <button type="button" onClick={() => { setShowInviteModal(false); setInviteForm({ first_name: "", last_name: "", email: "", phone_number: "", role: "property_manager" }); setSelectedPropertyIds([]); }} className="px-5 py-2.5 rounded-xl border border-zinc-200 text-xs font-extrabold uppercase font-mono tracking-wider hover:bg-zinc-50">Cancel</button>
                        <button type="submit" disabled={inviteSubmitting} className="px-5 py-2.5 rounded-xl bg-[#006c0c] text-white hover:bg-neutral-800 text-xs font-extrabold uppercase font-mono tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center gap-2">
                          {inviteSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null} Send Invite
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* 5. NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-8">
              <h3 className="text-base font-extrabold text-on-surface">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { key: "rentDueReminders", label: "Rent Due Reminders" },
                  { key: "overdueRentAlerts", label: "Overdue Rent Alerts" },
                  { key: "paymentSubmitted", label: "Payment Submitted" },
                  { key: "paymentVerified", label: "Payment Verified" },
                  { key: "leaseExpiryAlerts", label: "Lease Expiry Alerts" },
                  { key: "tenantInvitationAlerts", label: "Tenant Invitation Alerts" },
                  { key: "smsNotifications", label: "SMS Notifications" },
                  { key: "emailNotifications", label: "Email Notifications" },
                  { key: "inAppNotifications", label: "In-App Notifications" },
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-outline-variant hover:border-primary/20 cursor-pointer">
                    <span className="text-sm font-bold text-on-surface">{item.label}</span>
                    <button onClick={() => setNotifPrefs(p => ({ ...p, [item.key]: !p[item.key as keyof typeof notifPrefs] }))} className={`w-10 h-6 rounded-full transition-colors relative ${notifPrefs[item.key as keyof typeof notifPrefs] ? "bg-primary" : "bg-zinc-300"}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifPrefs[item.key as keyof typeof notifPrefs] ? "left-5" : "left-1"}`} />
                    </button>
                  </label>
                ))}
              </div>
              <button onClick={() => showToast("✓ Notification preferences saved!")} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs">Save Preferences</button>
            </div>
          )}

          {/* 6. PAYMENT CONFIG */}
          {activeTab === "payment_config" && (
            <form onSubmit={handleSavePaymentConfig} className="space-y-8">
              <h3 className="text-base font-extrabold text-on-surface">Payment Configuration</h3>
              <div className="space-y-5">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-[10px] font-bold font-mono text-primary uppercase mb-2">M-Pesa Paybill</p>
                  <input value={payPaybill} onChange={e => setPayPaybill(e.target.value)} className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-[10px] font-bold font-mono text-amber-700 uppercase mb-2">M-Pesa Till Number</p>
                  <input value={payTillNumber} onChange={e => setPayTillNumber(e.target.value)} className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-[10px] font-bold font-mono text-blue-700 uppercase mb-2">Bank Details</p>
                  <div className="space-y-3">
                    <input value={payBankName} onChange={e => setPayBankName(e.target.value)} placeholder="Bank Name" className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    <input value={payAccNumber} onChange={e => setPayAccNumber(e.target.value)} placeholder="Account Number" className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    <input value={payAccName} onChange={e => setPayAccName(e.target.value)} placeholder="Account Name" className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs flex items-center gap-2 disabled:opacity-50">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null} Save Configuration
              </button>
            </form>
          )}

          {/* 7. SUBSCRIPTION */}
          {activeTab === "subscription_billing" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="border p-5 rounded-2xl bg-zinc-50/40">
                  <span className="block text-[10px] font-bold font-mono text-zinc-400 uppercase">Subscription Status</span>
                  <h3 className="text-xl font-black text-[#006c0c] mt-1 flex items-center gap-1"><CheckCircle className="w-5 h-5 text-emerald-500" /> Active T1</h3>
                  <p className="text-[10px] text-zinc-450 font-mono mt-1 font-bold">Auto-Renews July 01, 2026</p>
                </div>
                <div className="border p-5 rounded-2xl bg-zinc-50/40 col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="block text-[10px] font-bold font-mono text-zinc-400 uppercase">Tenant Partition utilization</span>
                    <span className="text-[10px] font-bold font-mono text-primary uppercase">{activeUnitsCount} / {getUnitLimit()} Active Units</span>
                  </div>
                  <div className="w-full bg-zinc-200 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, (activeUnitsCount / getUnitLimit()) * 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-zinc-505 mt-2 font-semibold">Upgrade to Pro or Enterprise to bypass capacity locks.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black font-mono text-zinc-700 uppercase tracking-widest pl-1">Upgrade Corporate Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { plan: "Starter" as const, price: "9,500 KSh / Mo", limit: "10 units limit", tier: 1 },
                    { plan: "Growth" as const, price: "24,000 KSh / Mo", limit: "50 units limit", tier: 2 },
                    { plan: "Pro" as const, price: "48,000 KSh / Mo", limit: "150 units limit", tier: 3 },
                    { plan: "Enterprise" as const, price: "Custom SaaS Quoting", limit: "Unlimited units", tier: 4 },
                  ].map(p => {
                    const isActive = currentPlan === p.plan;
                    return (
                      <div key={p.plan} className={`border rounded-2xl p-4 flex flex-col justify-between ${isActive ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-zinc-200 bg-white"} transition-all relative`}>
                        {isActive && <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-[#006c0c] text-white text-[8px] font-mono font-bold uppercase rounded-full">Current Plan</span>}
                        <div className="space-y-1 pb-4">
                          <h4 className="font-extrabold text-xs text-zinc-800">{p.plan} T{p.tier}</h4>
                          <p className="text-sm font-black text-primary leading-tight font-mono">{p.price}</p>
                          <p className="text-[10px] text-zinc-500 font-mono font-bold">{p.limit}</p>
                        </div>
                        <button disabled={isActive} className={`w-full py-1.5 text-[10px] font-mono uppercase font-black tracking-wider rounded-lg border transition ${isActive ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border-zinc-200" : "border-primary text-primary hover:bg-primary hover:text-white"}`}>Activate Tier</button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Billing history table */}
              <div className="space-y-3.5 border-t border-zinc-150 pt-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black font-mono text-zinc-650 uppercase tracking-widest pl-1">Corporate Billing History</h3>
                  <button onClick={() => showToast("Invoices report consolidated.", "info")} className="text-[10px] text-primary hover:underline font-mono uppercase font-black">Export All Bills</button>
                </div>
                <div className="overflow-x-auto rounded-xl border text-xs">
                  <table className="w-full text-left font-sans border-collapse">
                    <thead className="bg-[#fcfdfc] border-b text-zinc-505">
                      <tr>
                        <th className="px-4 py-2 text-[9px] font-bold font-mono">Invoice Ref</th>
                        <th className="px-4 py-2 text-[9px] font-bold font-mono">Period</th>
                        <th className="px-4 py-2 text-[9px] font-bold font-mono">Amount</th>
                        <th className="px-4 py-2 text-[9px] font-bold font-mono">Status</th>
                        <th className="px-4 py-2 text-[9px] font-bold font-mono text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 font-bold font-mono text-zinc-600">
                      <tr className="hover:bg-slate-50/10">
                        <td className="px-4 py-2.5">INV-2026-06</td>
                        <td className="px-4 py-2.5 font-sans">June 2026</td>
                        <td className="px-4 py-2.5">9,500 KSh</td>
                        <td className="px-4 py-2.5"><span className="bg-emerald-50 text-[#006c0c] px-2 py-0.5 rounded text-[9px]">PAID</span></td>
                        <td className="px-4 py-2.5 text-right font-sans"><button onClick={() => showToast("Downloading PDF...", "info")} className="text-primary hover:underline text-[10px]">Download PDF</button></td>
                      </tr>
                      <tr className="hover:bg-slate-50/10">
                        <td className="px-4 py-2.5">INV-2026-05</td>
                        <td className="px-4 py-2.5 font-sans">May 2026</td>
                        <td className="px-4 py-2.5">9,500 KSh</td>
                        <td className="px-4 py-2.5"><span className="bg-emerald-50 text-[#006c0c] px-2 py-0.5 rounded text-[9px]">PAID</span></td>
                        <td className="px-4 py-2.5 text-right font-sans"><button onClick={() => showToast("Downloading PDF...", "info")} className="text-primary hover:underline text-[10px]">Download PDF</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 8. AUDIT LOGS */}
          {activeTab === "audit_logs" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-1">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={e => setAuditSearch(e.target.value)}
                    placeholder="Search audit trails..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-250 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <select
                  value={auditActionFilter}
                  onChange={e => setAuditActionFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-zinc-250 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">ALL Actions</option>
                  {auditActions.map(a => (
                    <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
                  ))}
                </select>
                <select
                  value={auditEntityFilter}
                  onChange={e => setAuditEntityFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-zinc-250 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">ALL Entities</option>
                  {auditEntities.map(en => (
                    <option key={en} value={en}>{en}</option>
                  ))}
                </select>
              </div>

              {auditLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-8 text-center"><FileText className="w-10 h-10 text-zinc-300 mx-auto mb-2" /><p className="text-xs font-bold text-on-surface-variant">No audit events logged yet</p></div>
              ) : (
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="divide-y divide-zinc-100">
                    {auditLogs.map((log, i) => (
                      <div key={log.id ?? i} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className={`px-2 py-0.5 text-[10px] font-bold font-mono uppercase rounded border shrink-0 ${getActionColor(log.action)}`}>
                              {log.action?.replace(/_/g, " ")}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
                                <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-[10px] font-mono">{log.entity}</span>
                                {log.previous_value && log.new_value && (
                                  <>
                                    <span className="text-on-surface-variant truncate max-w-[120px]">{log.previous_value}</span>
                                    <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                                    <span className="text-primary truncate max-w-[120px]">{log.new_value}</span>
                                  </>
                                )}
                                {log.new_value && !log.previous_value && (
                                  <span className="text-primary truncate">{log.new_value}</span>
                                )}
                                {log.previous_value && !log.new_value && (
                                  <span className="text-red-600 line-through truncate">{log.previous_value}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-on-surface-variant shrink-0">
                            <Clock className="w-3 h-3" />
                            {log.created_at ? new Date(log.created_at).toLocaleString() : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 9. DATA EXPORT */}
          {activeTab === "data_export" && (
            <div className="space-y-8">
              <h3 className="text-base font-extrabold text-on-surface">Data Export</h3>
              <div className="space-y-5">
                <p className="text-xs text-on-surface-variant">Select entities to export:</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "tenants", label: "Tenants" }, { key: "units", label: "Units" },
                    { key: "properties", label: "Properties" }, { key: "leases", label: "Leases" },
                    { key: "payments", label: "Payments" }, { key: "auditLogs", label: "Audit Logs" },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2 p-3 rounded-xl border border-outline-variant cursor-pointer hover:border-primary/20">
                      <input type="checkbox" checked={exportEntities[item.key as keyof typeof exportEntities]} onChange={e => setExportEntities(p => ({ ...p, [item.key]: e.target.checked }))} className="rounded" />
                      <span className="text-sm font-bold text-on-surface">{item.label}</span>
                    </label>
                  ))}
                </div>
                <div><label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase mb-1.5">Format</label>
                  <select value={exportFormat} onChange={e => setExportFormat(e.target.value as any)} className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"><option value="CSV">CSV</option><option value="Excel" disabled>Excel</option><option value="PDF" disabled>PDF</option></select>
                  <p className="text-[10px] font-medium text-zinc-450 mt-1.5">CSV export is currently available. Excel &amp; PDF support coming soon.</p>
                </div>
              </div>
              <button onClick={handleGenerateExport} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs flex items-center gap-2"><Download className="w-4 h-4" /> Generate Export</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
