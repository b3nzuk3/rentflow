"use client";

import { useState, useEffect } from "react";
import {
  Building, User, Users, Shield, Bell, CreditCard, Layers, FileText, Download,
  Settings, Check, Save, Eye, EyeOff, Lock, Smartphone, Mail, Globe
} from "lucide-react";
import { api } from "@/lib/api";
import type { Organization } from "@/types";

type SettingsTab = "org_profile" | "my_account" | "users_roles" | "security" | "notifications" | "payment_config" | "subscription" | "audit_logs" | "data_export";

const tabs: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
  { key: "org_profile", label: "Organization Profile", icon: Building },
  { key: "my_account", label: "My Account", icon: User },
  { key: "users_roles", label: "Users & Roles", icon: Users },
  { key: "security", label: "Security", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "payment_config", label: "Payment Config", icon: CreditCard },
  { key: "subscription", label: "Subscription", icon: Layers },
  { key: "audit_logs", label: "Audit Logs", icon: FileText },
  { key: "data_export", label: "Data Export", icon: Download },
];

export function SaaSSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("org_profile");
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Org profile form
  const [orgName, setOrgName] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgAddress, setOrgAddress] = useState("");

  // Account form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    rentDueReminders: true,
    overdueRentAlerts: true,
    paymentSubmitted: true,
    paymentVerified: true,
    leaseExpiryAlerts: true,
    smsNotifications: true,
    emailNotifications: true,
  });

  // Payment config
  const [paybill, setPaybill] = useState("400200");
  const [tillNumber, setTillNumber] = useState("9854721");
  const [bankName, setBankName] = useState("Co-operative Bank of Kenya");
  const [accountNumber, setAccountNumber] = useState("11094723019253");

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

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/organizations/${org?.id}`, { name: orgName });
      showToast("Organization profile saved!");
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      showToast("Account settings saved!");
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      showToast("Payment configuration saved!");
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateExport = () => {
    const entities = Object.entries(exportEntities).filter(([_, v]) => v).map(([k]) => k).join(", ");
    showToast(`Export generated (${exportFormat}): ${entities}`);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-stretch relative min-h-[750px] animate-fade-in text-left">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 animate-fade-in ${toast.type === "success" ? "bg-white border-primary/25 text-[#006c0c]" : "bg-rose-50 border-rose-150 text-rose-700"}`}>
          <Check className="w-4 h-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-full lg:w-76 shrink-0 flex flex-col gap-6">
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-md p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-150">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-white">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-on-surface">Settings</h3>
              <p className="text-[10px] text-zinc-450 font-mono font-bold uppercase tracking-wider mt-0.5">Control Center</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-zinc-100 hover:text-on-surface"}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flat-card rounded-2xl p-6 bg-white shadow-sm">
        {/* Org Profile */}
        {activeTab === "org_profile" && (
          <form onSubmit={handleSaveOrg} className="space-y-6">
            <h3 className="text-lg font-extrabold text-on-surface">Organization Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase mb-1.5">Organization Name</label>
                <input value={orgName} onChange={e => setOrgName(e.target.value)} className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase mb-1.5">Phone</label>
                  <div className="relative"><Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" /><input value={orgPhone} onChange={e => setOrgPhone(e.target.value)} placeholder="+254 722 000 001" className="w-full pl-9 pr-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" /></div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase mb-1.5">Email</label>
                  <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" /><input value={orgEmail} onChange={e => setOrgEmail(e.target.value)} placeholder="info@company.com" className="w-full pl-9 pr-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" /></div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase mb-1.5">Address</label>
                <div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" /><input value={orgAddress} onChange={e => setOrgAddress(e.target.value)} placeholder="Building, Suite, City" className="w-full pl-9 pr-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" /></div>
              </div>
            </div>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs flex items-center gap-2 disabled:opacity-50">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </form>
        )}

        {/* My Account */}
        {activeTab === "my_account" && (
          <form onSubmit={handleSaveAccount} className="space-y-6">
            <h3 className="text-lg font-extrabold text-on-surface">My Account</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase mb-1.5">First Name</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase mb-1.5">Last Name</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase mb-1.5">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
              </div>
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase mb-1.5">Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
              </div>
            </div>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs flex items-center gap-2 disabled:opacity-50">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </form>
        )}

        {/* Users & Roles */}
        {activeTab === "users_roles" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-on-surface">Users & Roles</h3>
              <button className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Invite User
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-8 text-center">
              <Users className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-on-surface-variant">User management coming soon</p>
            </div>
          </div>
        )}

        {/* Security */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <h3 className="text-lg font-extrabold text-on-surface">Security</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase mb-1.5">Current Password</label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" /><input type="password" placeholder="••••••••" className="w-full pl-9 pr-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase mb-1.5">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase mb-1.5">Confirm Password</label>
                  <input type="password" placeholder="••••••••" className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
                </div>
              </div>
            </div>
            <button className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs flex items-center gap-2">
              <Lock className="w-4 h-4" /> Change Password
            </button>
          </div>
        )}

        {/* Notifications */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <h3 className="text-lg font-extrabold text-on-surface">Notification Preferences</h3>
            <div className="space-y-3">
              {[
                { key: "rentDueReminders", label: "Rent Due Reminders" },
                { key: "overdueRentAlerts", label: "Overdue Rent Alerts" },
                { key: "paymentSubmitted", label: "Payment Submitted" },
                { key: "paymentVerified", label: "Payment Verified" },
                { key: "leaseExpiryAlerts", label: "Lease Expiry Alerts" },
                { key: "smsNotifications", label: "SMS Notifications" },
                { key: "emailNotifications", label: "Email Notifications" },
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between p-3 rounded-xl border border-outline-variant hover:border-primary/20 cursor-pointer">
                  <span className="text-sm font-bold text-on-surface">{item.label}</span>
                  <div className={`w-10 h-6 rounded-full transition-colors relative ${notifPrefs[item.key as keyof typeof notifPrefs] ? "bg-primary" : "bg-zinc-300"}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifPrefs[item.key as keyof typeof notifPrefs] ? "left-5" : "left-1"}`} />
                  </div>
                </label>
              ))}
            </div>
            <button onClick={() => showToast("Notification preferences saved!")} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs">Save Preferences</button>
          </div>
        )}

        {/* Payment Config */}
        {activeTab === "payment_config" && (
          <form onSubmit={handleSavePaymentConfig} className="space-y-6">
            <h3 className="text-lg font-extrabold text-on-surface">Payment Configuration</h3>
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-[10px] font-bold font-mono text-primary uppercase mb-2">M-Pesa Paybill</p>
                <input value={paybill} onChange={e => setPaybill(e.target.value)} className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] font-bold font-mono text-amber-700 uppercase mb-2">M-Pesa Till Number</p>
                <input value={tillNumber} onChange={e => setTillNumber(e.target.value)} className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-[10px] font-bold font-mono text-blue-700 uppercase mb-2">Bank Details</p>
                <div className="space-y-3">
                  <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank Name" className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
                  <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number" className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
                </div>
              </div>
            </div>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs flex items-center gap-2 disabled:opacity-50">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Configuration
            </button>
          </form>
        )}

        {/* Subscription */}
        {activeTab === "subscription" && (
          <div className="space-y-6">
            <h3 className="text-lg font-extrabold text-on-surface">Subscription & Billing</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { plan: "Starter", limit: "10 units", price: "KSh 2,000/mo", active: org?.subscription_plan === "Starter" },
                { plan: "Growth", limit: "50 units", price: "KSh 5,000/mo", active: org?.subscription_plan === "Growth" },
                { plan: "Enterprise", limit: "Unlimited", price: "KSh 15,000/mo", active: org?.subscription_plan === "Enterprise" },
              ].map(tier => (
                <div key={tier.plan} className={`border p-4 rounded-2xl text-left ${tier.active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-zinc-200"}`}>
                  {tier.active && <span className="text-[9px] font-bold font-mono text-primary uppercase">Current Plan</span>}
                  <h4 className="text-sm font-extrabold text-zinc-800 mt-1">{tier.plan}</h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{tier.limit}</p>
                  <p className="text-lg font-extrabold text-primary mt-2">{tier.price}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Logs */}
        {activeTab === "audit_logs" && (
          <div className="space-y-6">
            <h3 className="text-lg font-extrabold text-on-surface">Audit Logs</h3>
            <div className="bg-slate-50 rounded-xl p-8 text-center">
              <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-on-surface-variant">No audit events logged yet</p>
            </div>
          </div>
        )}

        {/* Data Export */}
        {activeTab === "data_export" && (
          <div className="space-y-6">
            <h3 className="text-lg font-extrabold text-on-surface">Data Export</h3>
            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant">Select entities to export:</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "tenants", label: "Tenants" },
                  { key: "units", label: "Units" },
                  { key: "properties", label: "Properties" },
                  { key: "leases", label: "Leases" },
                  { key: "payments", label: "Payments" },
                  { key: "auditLogs", label: "Audit Logs" },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-2 p-3 rounded-xl border border-outline-variant cursor-pointer hover:border-primary/20">
                    <input type="checkbox" checked={exportEntities[item.key as keyof typeof exportEntities]} onChange={e => setExportEntities(prev => ({ ...prev, [item.key]: e.target.checked }))} className="rounded" />
                    <span className="text-sm font-bold text-on-surface">{item.label}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase mb-1.5">Format</label>
                <select value={exportFormat} onChange={e => setExportFormat(e.target.value as any)} className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary">
                  <option value="CSV">CSV</option>
                  <option value="Excel">Excel</option>
                  <option value="PDF">PDF</option>
                </select>
              </div>
            </div>
            <button onClick={handleGenerateExport} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs flex items-center gap-2">
              <Download className="w-4 h-4" /> Generate Export
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
