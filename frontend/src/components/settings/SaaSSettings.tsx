"use client";

import { useState, useEffect } from "react";
import {
  Building, User, Users, Shield, Bell, CreditCard, Layers, FileText, Download,
  Check, X, Plus, Lock, Phone, Mail, Globe, Settings, ChevronRight, Search,
  AlertTriangle, CheckCircle, Info, Eye, EyeOff, Smartphone, MapPin, Laptop
} from "lucide-react";
import { api } from "@/lib/api";
import type { Organization } from "@/types";

type SettingsTab = "org_profile" | "my_account" | "users_roles" | "security" | "notifications" | "payment_config" | "subscription_billing" | "audit_logs" | "data_export";

const tabs: { key: SettingsTab; label: string; icon: React.ElementType; ownerOnly?: boolean }[] = [
  { key: "org_profile", label: "Organization Profile", icon: Building },
  { key: "my_account", label: "My Account Profile", icon: User },
  { key: "users_roles", label: "Users & Core Roles", icon: Users },
  { key: "security", label: "Cryptographic Security", icon: Shield },
  { key: "notifications", label: "Notification Channels", icon: Bell },
  { key: "payment_config", label: "Payment Routing", icon: CreditCard },
  { key: "subscription_billing", label: "Plan & Corporate Billing", icon: Layers, ownerOnly: true },
  { key: "audit_logs", label: "Secure Audit Trail", icon: FileText },
  { key: "data_export", label: "Data Portability", icon: Download },
];

export function SaaSSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("org_profile");
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Org profile
  const [orgName, setOrgName] = useState("");
  const [businessType, setBusinessType] = useState("Commercial & Residential Real Estate LLC");
  const [orgPhone, setOrgPhone] = useState("+254 722 000 001");
  const [orgEmail, setOrgEmail] = useState("info@amani.co");
  const [orgAddress, setOrgAddress] = useState("Amani Tower, Suite 402, Nairobi, Kenya");
  const [orgWebsite, setOrgWebsite] = useState("https://www.amaniproperties.com");
  const [orgTaxPin, setOrgTaxPin] = useState("A001239857B");
  const [orgRegNumber, setOrgRegNumber] = useState("CPR/2021/84725");

  // Account
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accFirstName, setAccFirstName] = useState("Fatuma");
  const [accLastName, setAccLastName] = useState("Ali");
  const [accEmail, setAccEmail] = useState("fatuma.ali@amani.com");
  const [accPhone, setAccPhone] = useState("+254 712 345 678");

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

  useEffect(() => {
    loadOrg();
  }, []);

  const loadOrg = async () => {
    try {
      const res = await api.get("/organizations/me");
      setOrg(res.data);
      setOrgName(res.data.name || "");
    } catch (err) {
      console.error("Failed to load org", err);
    } finally {
      setLoading(false);
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
      await api.patch(`/organizations/${org?.id}`, { name: orgName });
      showToast("✓ Organization profile saved!");
    } catch { showToast("Failed to save", "error"); }
    finally { setSaving(false); }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingAccount(false);
    showToast("✓ Account settings saved!");
  };

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { showToast("✓ Payment configuration saved!"); }
    catch { showToast("Failed to save", "error"); }
    finally { setSaving(false); }
  };

  const handleGenerateExport = () => {
    const entities = Object.entries(exportEntities).filter(([_, v]) => v).map(([k]) => k).join(", ");
    showToast(`✓ Export generated (${exportFormat}): ${entities}`);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const currentPlan = org?.subscription_plan || "Starter";
  const activeUnitsCount = 10;
  const getUnitLimit = () => { if (currentPlan === "Starter") return 10; if (currentPlan === "Growth") return 50; return 1000; };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-stretch relative min-h-[750px] animate-fade-in text-left">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 animate-fade-in ${toast.type === "success" ? "bg-white border-primary/25 text-[#006c0c]" : toast.type === "error" ? "bg-rose-50 border-rose-150 text-rose-700" : "bg-zinc-900 border-zinc-800 text-white max-w-sm"}`}>
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <div className="w-full lg:w-76 shrink-0 flex flex-col gap-6">
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-md p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-150">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-white"><Settings className="w-5 h-5" /></div>
            <div>
              <h3 className="font-extrabold text-sm text-on-surface">Private Settings</h3>
              <p className="text-[10px] text-zinc-450 font-mono font-bold uppercase tracking-wider mt-0.5">Control Center</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1.5">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`relative w-full px-4 py-3 rounded-2xl flex items-center justify-between transition-all text-xs font-bold leading-none ${isActive ? "bg-primary text-white font-black scale-[1.01] shadow-md shadow-primary/10" : "text-zinc-650 hover:text-zinc-900 hover:bg-zinc-50 hover:ring-1 hover:ring-zinc-200"}`}>
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

        {/* Security info card */}
        <div className="bg-zinc-950 text-white rounded-3xl p-5 border border-zinc-800 shadow-md space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-1.5 text-primary text-[10px] uppercase font-bold font-mono tracking-wider">
            <Lock className="w-3.5 h-3.5" /> High-Security Schema Frame
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
            You are securely configuring organizational tenant <strong>{org?.id}</strong>.
          </p>
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-[#4CAF50] font-mono uppercase tracking-widest font-bold">100% PARTITION_SECURE</span>
          </div>
        </div>
      </div>

      {/* RIGHT CONTENT PANEL */}
      <div className="flex-1 bg-white rounded-3xl border border-zinc-200/80 shadow-md overflow-hidden flex flex-col justify-between">
        {/* Header breadcrumb */}
        <div className="border-b border-zinc-150 px-6 sm:px-8 py-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
              <span>Settings Portal</span><span>/</span>
              <span className="text-primary">{activeTab.replace(/_/g, " ")}</span>
            </div>
            <h2 className="text-xl font-black text-on-surface tracking-tight uppercase leading-normal mt-1">
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
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3.5 py-1.5 rounded-xl text-xs font-bold leading-none shrink-0">
            <span className="text-zinc-600">Current Role:</span>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-primary/15 text-[#006c0c] uppercase font-black tracking-wide">Org Owner</span>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 sm:p-8 flex-1">

          {/* 1. ORG PROFILE */}
          {activeTab === "org_profile" && (
            <form onSubmit={handleSaveOrg} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Organization Legal Name</label>
                    <input value={orgName} onChange={e => setOrgName(e.target.value)} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-zinc-50/50" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Business Operational Type</label>
                    <input value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-zinc-50/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Phone Number</label>
                      <input value={orgPhone} onChange={e => setOrgPhone(e.target.value)} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Business Email</label>
                      <input value={orgEmail} onChange={e => setOrgEmail(e.target.value)} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Office Physical Address</label>
                    <input value={orgAddress} onChange={e => setOrgAddress(e.target.value)} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Website URL (Optional)</label>
                    <input value={orgWebsite} onChange={e => setOrgWebsite(e.target.value)} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">KRA Tax PIN (Optional)</label>
                      <input value={orgTaxPin} onChange={e => setOrgTaxPin(e.target.value)} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Company Reg Number (Optional)</label>
                      <input value={orgRegNumber} onChange={e => setOrgRegNumber(e.target.value)} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                  {/* Logo upload */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold font-mono text-zinc-500 uppercase">Corporate Logo Image</label>
                    <div className="border-2 border-dashed border-zinc-250 bg-zinc-50 rounded-2xl p-4 flex flex-col items-center justify-center">
                      <Building className="w-8 h-8 text-zinc-400 mb-2" />
                      <p className="text-[10px] text-zinc-500 font-bold">Drag logo file here or select from disk</p>
                      <label className="mt-2 inline-block px-3 py-1.5 bg-white border border-zinc-200 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer hover:border-zinc-300">
                        Choose Logo Image <input type="file" accept="image/*" className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-zinc-150 pt-5 flex justify-end gap-3">
                <button type="button" onClick={() => { setOrgName(org?.name || ""); showToast("Form values reset.", "info"); }} className="px-5 py-2.5 rounded-xl border border-zinc-200 text-xs font-extrabold uppercase font-mono tracking-wider">Reset Changes</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-[#006c0c] text-white hover:bg-neutral-800 text-xs font-extrabold uppercase font-mono tracking-wider transition-all shadow-md disabled:opacity-50">Save Changes</button>
              </div>
            </form>
          )}

          {/* 2. MY ACCOUNT */}
          {activeTab === "my_account" && (
            <div className="space-y-6">
              <div className="flat-card border p-6 rounded-2xl bg-zinc-50/50 flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="w-20 h-20 bg-zinc-900 rounded-3xl shrink-0 flex items-center justify-center text-white border border-zinc-800 text-2xl font-black">FA</div>
                <div className="space-y-1.5 flex-1 select-text">
                  <div className="flex gap-2 items-center flex-wrap">
                    <h3 className="text-lg font-black text-on-surface">{accFirstName} {accLastName}</h3>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[9px] uppercase font-bold tracking-wide">Org Owner</span>
                  </div>
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5 font-bold"><Mail className="w-4 h-4 text-zinc-400" /> {accEmail}</p>
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5 font-bold"><Phone className="w-4 h-4 text-zinc-400" /> {accPhone}</p>
                </div>
                <button onClick={() => setIsEditingAccount(!isEditingAccount)} className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-bold">{isEditingAccount ? "Cancel" : "Edit Profile"}</button>
              </div>
              {isEditingAccount && (
                <form onSubmit={handleSaveAccount} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">First Name</label><input value={accFirstName} onChange={e => setAccFirstName(e.target.value)} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" /></div>
                    <div className="space-y-1"><label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Last Name</label><input value={accLastName} onChange={e => setAccLastName(e.target.value)} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" /></div>
                  </div>
                  <div className="space-y-1"><label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Email</label><input value={accEmail} onChange={e => setAccEmail(e.target.value)} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" /></div>
                  <div className="space-y-1"><label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Phone</label><input value={accPhone} onChange={e => setAccPhone(e.target.value)} className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" /></div>
                  <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs">Save Changes</button>
                </form>
              )}
            </div>
          )}

          {/* 3. USERS & ROLES */}
          {activeTab === "users_roles" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-on-surface">Organization Users</h3>
                <button className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Invite User</button>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 text-center"><Users className="w-10 h-10 text-zinc-300 mx-auto mb-2" /><p className="text-xs font-bold text-on-surface-variant">User management coming soon</p></div>
            </div>
          )}

          {/* 4. SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <h3 className="text-sm font-extrabold text-on-surface">Change Password</h3>
              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5"><label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Current Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" /><input type="password" placeholder="••••••••" className="w-full pl-9 pr-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" /></div></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">New Password</label><input type="password" placeholder="••••••••" className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" /></div>
                  <div className="space-y-1.5"><label className="block text-xs font-extrabold font-mono text-zinc-500 uppercase">Confirm Password</label><input type="password" placeholder="••••••••" className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20" /></div>
                </div>
              </div>
              <button className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</button>
            </div>
          )}

          {/* 5. NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-sm font-extrabold text-on-surface">Notification Preferences</h3>
              <div className="space-y-3">
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
                  <label key={item.key} className="flex items-center justify-between p-3 rounded-xl border border-outline-variant hover:border-primary/20 cursor-pointer">
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
            <form onSubmit={handleSavePaymentConfig} className="space-y-6">
              <h3 className="text-sm font-extrabold text-on-surface">Payment Configuration</h3>
              <div className="space-y-4">
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
            <div className="space-y-6">
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-1">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input type="text" placeholder="Search audit trails..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-250 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <select className="px-3 py-2.5 rounded-xl border border-zinc-250 text-xs font-bold"><option>ALL Roles</option></select>
                <select className="px-3 py-2.5 rounded-xl border border-zinc-250 text-xs font-bold"><option>ALL Actions</option></select>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 text-center"><FileText className="w-10 h-10 text-zinc-300 mx-auto mb-2" /><p className="text-xs font-bold text-on-surface-variant">No audit events logged yet</p></div>
            </div>
          )}

          {/* 9. DATA EXPORT */}
          {activeTab === "data_export" && (
            <div className="space-y-6">
              <h3 className="text-sm font-extrabold text-on-surface">Data Export</h3>
              <div className="space-y-4">
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
                  <select value={exportFormat} onChange={e => setExportFormat(e.target.value as any)} className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"><option value="CSV">CSV</option><option value="Excel">Excel</option><option value="PDF">PDF</option></select>
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
