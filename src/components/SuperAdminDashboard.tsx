/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Building,
  Shield,
  TrendingUp,
  Server,
  Activity,
  CheckCircle,
  Database,
  Lock,
  Plus,
  X,
  Zap,
  Globe,
  Copy,
  Send,
  Link,
  Check,
  ExternalLink,
  Mail,
  Phone,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { Organization, Payment, User } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface SuperAdminDashboardProps {
  organizations: Organization[];
  allPayments: Payment[];
  users: User[];
  onToggleOrgActive: (id: string) => void;
  onAddOrganization: (name: string, subscriptionPlan: "Starter" | "Growth" | "Enterprise") => string;
  onSendInvite: (orgId: string, email: string, phone: string, orgName: string, inviteUrl: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  organizations,
  allPayments,
  users,
  onToggleOrgActive,
  onAddOrganization,
  onSendInvite,
}) => {
  // Aggregate stats across all organizations
  const totalOrgs = organizations.length;
  const totalVerifiedPayments = allPayments.filter(p => p.status === "Verified");
  const totalGlobalRevenue = totalVerifiedPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingGlobalPayments = allPayments.filter(p => p.status === "Pending").length;

  const starterCount = organizations.filter(o => o.subscriptionPlan === "Starter").length;
  const growthCount = organizations.filter(o => o.subscriptionPlan === "Growth").length;
  const enterpriseCount = organizations.filter(o => o.subscriptionPlan === "Enterprise").length;

  // New Organization Form States
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgPlan, setNewOrgPlan] = useState<"Starter" | "Growth" | "Enterprise">("Starter");
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Post-provisioning state (keeps modal in onboarding view so user gets invite details!)
  const [provisionedOrgId, setProvisionedOrgId] = useState<string | null>(null);
  const [provisionedOrgName, setProvisionedOrgName] = useState<string>("");

  // Email / Phone sending states in the post-provision modal
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // General "Send Invite" modal state (for already registered orgs)
  const [activeInviteOrg, setActiveInviteOrg] = useState<Organization | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  const handleCopyOnboardingLink = (orgId: string) => {
    const signupUrl = `${window.location.origin}/?signup=true&inviteOrgId=${orgId}`;
    navigator.clipboard.writeText(signupUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getSignupUrl = (orgId: string) => {
    return `${window.location.origin}/?signup=true&inviteOrgId=${orgId}`;
  };

  const handleSubmitNewOrg = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");
    setProvisionedOrgId(null);

    if (!newOrgName.trim()) {
      setFormError("Organization name is required.");
      return;
    }

    if (organizations.some(o => o.name.toLowerCase() === newOrgName.trim().toLowerCase())) {
      setFormError("An organization with this prefix or name already exists.");
      return;
    }

    // Call state update and capture the actual generated ID!
    const generatedId = onAddOrganization(newOrgName.trim(), newOrgPlan);
    setProvisionedOrgId(generatedId);
    setProvisionedOrgName(newOrgName.trim());
    setSuccessMsg("✓ SaaS Tenant Workspace successfully partitioned!");
    
    // Clear registration fields
    setNewOrgName("");
    setNewOrgPlan("Starter");
    setOwnerEmail("");
    setOwnerPhone("");
    setInviteSuccess(false);
  };

  // Submit invitation dispatch
  const handleDispatchInvite = (orgId: string, orgName: string, email: string, phone: string, fromRegistration: boolean) => {
    const url = getSignupUrl(orgId);
    onSendInvite(orgId, email.trim(), phone.trim(), orgName, url);
    
    if (fromRegistration) {
      setInviteSuccess(true);
    } else {
      setActiveInviteOrg(null);
      alert(`✓ Onboarding Invitation link successfully transmitted to ${email}!`);
    }
  };

  // Check if an organization already has an owner user registered
  const isOrgOnboarded = (orgId: string) => {
    return users.some(u => u.organizationId === orgId && u.role === "org_owner");
  };

  // Get organization owner email if onboarded
  const getOrgOwnerEmail = (orgId: string) => {
    const owner = users.find(u => u.organizationId === orgId && u.role === "org_owner");
    return owner ? `${owner.firstName} ${owner.lastName} (${owner.email})` : "Awaiting Sign Up";
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Super Admin Notice Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-4">
          <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <Shield className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#006c0c] text-sm">RentFlow Global Platform Command Center</h3>
            <p className="text-xs text-on-surface-variant font-semibold mt-0.5">
              Signed in as <span className="font-black">Super Administrator</span> • Safe Multitenant Cryptographic Isolation Architecture active.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold font-mono">
          <Server className="w-3.5 h-3.5 animate-pulse" />
          SYSTEM_ONLINE
        </div>
      </div>

      {/* Global Telemetry Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="flat-card rounded-2xl p-5 space-y-3 shadow-sm bg-white">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="text-xs font-bold font-mono uppercase">Subscribed Organizations</span>
            <Building className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-on-surface tracking-tight">{totalOrgs}</h2>
            <p className="text-[10px] text-on-surface-variant mt-1 font-bold">Safe SaaS schema bounds</p>
          </div>
        </div>

        <div className="flat-card rounded-2xl p-5 space-y-3 shadow-sm bg-white">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="text-xs font-bold font-mono uppercase">Global Processed Volume</span>
            <TrendingUp className="w-4.5 h-4.5 text-[#006c0c]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-on-surface tracking-tight">KSh {totalGlobalRevenue.toLocaleString()}</h2>
            <p className="text-[10px] text-primary font-bold mt-1">✓ {totalVerifiedPayments.length} verified invoices</p>
          </div>
        </div>

        <div className="flat-card rounded-2xl p-5 space-y-3 shadow-sm bg-white">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="text-xs font-bold font-mono uppercase">Global Queue Pending</span>
            <Activity className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-on-surface tracking-tight">{pendingGlobalPayments}</h2>
            <p className="text-[10px] text-amber-600 font-bold mt-1">Requires ledger verification</p>
          </div>
        </div>

        <div className="flat-card rounded-2xl p-5 space-y-3 shadow-sm bg-white">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="text-xs font-bold font-mono uppercase font-black">Audit Status</span>
            <Database className="w-4.5 h-4.5 text-[#006c0c]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-emerald-850 text-[#006c0c]">Active</h2>
            <p className="text-[10px] text-on-surface-variant mt-1 font-bold">100% On-Chain Simulated Ledgers</p>
          </div>
        </div>
      </section>

      {/* Subscription details and Directory grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Tier Distribution Cards & Safety Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flat-card rounded-2xl p-6 space-y-6 bg-white shadow-sm">
            <h3 className="font-extrabold text-xs text-on-surface uppercase tracking-wider font-mono">Billing Distribution</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-light-outline pb-2.5">
                <div>
                  <p className="text-xs font-black text-on-surface">Starter Plan</p>
                  <p className="text-[10px] text-on-surface-variant font-mono">Limit: 10 units max</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-extrabold font-mono rounded bg-blue-50 text-blue-800">
                  {starterCount} Tenant{starterCount !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-light-outline pb-2.5">
                <div>
                  <p className="text-xs font-black text-on-surface">Growth Plan</p>
                  <p className="text-[10px] text-on-surface-variant font-mono">Limit: 50 units max</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-extrabold font-mono rounded bg-primary/10 text-primary">
                  {growthCount} Tenant{growthCount !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-black text-on-surface">Enterprise Plan</p>
                  <p className="text-[10px] text-on-surface-variant font-mono font-bold">Limit: Unlimited units</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-extrabold font-mono rounded bg-purple-50 text-purple-800 font-bold">
                  {enterpriseCount} Tenant{enterpriseCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 text-white p-5 rounded-2xl space-y-3 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#4CAF50]/10 rounded-full blur-2xl" />
            <span className="text-[9px] font-black font-mono text-[#4CAF50] uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Tenant Isolation Security Rule
            </span>
            <p className="text-xs text-zinc-350 leading-relaxed font-semibold">
              RentFlow is designed with cryptographically validated multitenant boundaries. Database access constraints completely prevent unauthorized cross-tenant data requests.
            </p>
          </div>
        </div>

        {/* Multi-Tenant Organization Manager */}
        <div className="lg:col-span-8 flat-card rounded-2xl p-6 space-y-5 bg-white shadow-sm">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-100">
            <div>
              <h3 className="font-extrabold text-sm text-on-surface">Tenant Organizations Directory</h3>
              <p className="text-xs text-on-surface-variant font-mono font-bold uppercase tracking-wider mt-0.5">Isolated Security Partitions</p>
            </div>
            
            <button
              onClick={() => {
                setProvisionedOrgId(null);
                setSuccessMsg("");
                setShowAddOrgModal(true);
              }}
              className="px-4.5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-black font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-sm transform shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[3px]" /> Register Tenant Org
            </button>
          </div>

          {/* Search Table Utility */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter tenant organizations by name or key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-250 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-zinc-50/50"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-150">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-150">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider">Tenant Organization</th>
                  <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider">SaaS Tier</th>
                  <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider">Ownership Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider text-right">Dispatch &amp; Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150">
                {filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-xs text-zinc-400 font-bold">
                      <AlertCircle className="w-8 h-8 mx-auto text-zinc-350 mb-2" />
                      No organizations matching search filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map(org => {
                    const onboarded = isOrgOnboarded(org.id);
                    return (
                      <tr key={org.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-4">
                          <p className="font-extrabold text-xs text-on-surface leading-normal">{org.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono font-bold uppercase mt-0.5">Partition: {org.id}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block px-2 py-0.5 rounded font-black font-mono text-[9px] uppercase tracking-wide ${
                            org.subscriptionPlan === "Enterprise"
                              ? "bg-purple-100 text-purple-800"
                              : org.subscriptionPlan === "Growth"
                              ? "bg-primary/10 text-primary"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {org.subscriptionPlan}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-bold text-xs">
                          {onboarded ? (
                            <div className="space-y-0.5">
                              <span className="text-[#006c0c] flex items-center gap-1 font-bold">
                                <UserCheck className="w-3.5 h-3.5" /> Active Owner Owner
                              </span>
                              <span className="text-[10px] text-zinc-450 font-mono text-slate-500">{getOrgOwnerEmail(org.id)}</span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] inline-block">
                                Awaiting Signup
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleCopyOnboardingLink(org.id)}
                                  className="text-primary hover:underline font-mono text-[9px] font-bold flex items-center gap-0.5"
                                  title="Copy signup invitation link for this tenant company owner"
                                >
                                  <Link className="w-2.5 h-2.5" /> Copy Invite Link
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            {!onboarded && (
                              <button
                                onClick={() => {
                                  setOwnerEmail("");
                                  setOwnerPhone("");
                                  setActiveInviteOrg(org);
                                }}
                                className="p-1 px-2.5 text-[10px] bg-primary/15 hover:bg-primary/25 border border-primary/20 text-[#006c0c] rounded-lg font-black tracking-wider font-mono uppercase transition-all"
                                title="Send onboarding link to owner client via Email/SMS"
                              >
                                Send Invite
                              </button>
                            )}
                            <button
                              onClick={() => onToggleOrgActive(org.id)}
                              className={`text-[10px] font-mono uppercase tracking-wider font-black px-2.5 py-1 rounded-lg border transition-all ${
                                org.isActive
                                  ? "border-red-250 text-red-650 hover:bg-red-50/50"
                                  : "border-primary/20 text-primary hover:bg-primary/5"
                              }`}
                            >
                              {org.isActive ? "Suspend" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Register Organization dialog */}
      <AnimatePresence>
        {showAddOrgModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!provisionedOrgId) setShowAddOrgModal(false);
              }}
              className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-xl w-full bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              {/* Header */}
              <div className="bg-zinc-900 text-white px-6 py-4.5 flex justify-between items-center text-left">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold tracking-tight">Provision SaaS Tenant</h3>
                    <p className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider">Tenant Partition Creator</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddOrgModal(false)}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-450 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* TWO SIDES FORM: Partition creation OR Post-Creation Invitation */}
              {!provisionedOrgId ? (
                /* STEP 1: DEFINE COMPANY PROFILE */
                <form onSubmit={handleSubmitNewOrg} className="p-6 space-y-5 text-left">
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-650 font-medium">
                      {formError}
                    </div>
                  )}

                  {/* Organization Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold font-mono text-zinc-700 uppercase tracking-wider">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      placeholder="e.g. Amani Property Management"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                      autoFocus
                    />
                    <p className="text-[10px] text-zinc-400 font-mono">
                      This will instantly allocate an isolated tenant partition ID &amp; private ledger namespace.
                    </p>
                  </div>

                  {/* Subscription / Plan Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold font-mono text-zinc-700 uppercase tracking-wider">
                      Select Core Subscription Plan
                    </label>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {/* Starter Card */}
                      <div
                        onClick={() => setNewOrgPlan("Starter")}
                        className={`border p-3.5 rounded-2xl cursor-pointer text-left transition-all ${
                          newOrgPlan === "Starter"
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-zinc-200 hover:border-zinc-300 bg-white"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold font-mono text-xs mb-2">
                          10
                        </div>
                        <h4 className="text-xs font-extrabold text-zinc-800">Starter T1</h4>
                        <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Cap: 10 units</p>
                      </div>

                      {/* Growth Card */}
                      <div
                        onClick={() => setNewOrgPlan("Growth")}
                        className={`border p-3.5 rounded-2xl cursor-pointer text-left transition-all ${
                          newOrgPlan === "Growth"
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-zinc-200 hover:border-zinc-300 bg-white"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                          <Zap className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-extrabold text-zinc-800">Growth T2</h4>
                        <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Cap: 50 units</p>
                      </div>

                      {/* Enterprise Card */}
                      <div
                        onClick={() => setNewOrgPlan("Enterprise")}
                        className={`border-2 p-3.5 rounded-2xl cursor-pointer text-left transition-all ${
                          newOrgPlan === "Enterprise"
                            ? "border-purple-350 bg-purple-50/20 ring-1 ring-purple-300"
                            : "border-zinc-200 hover:border-zinc-300 bg-white"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                          <Globe className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-extrabold text-zinc-800">Enterprise</h4>
                        <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Unlimited units</p>
                      </div>
                    </div>
                  </div>

                  {/* Info Note */}
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex gap-2">
                    <Shield className="w-4.5 h-4.5 text-zinc-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-zinc-500 leading-normal font-semibold">
                      Provisioning instantly establishes database namespaces, generates encrypted isolated ledger tables, and secures API isolation barriers.
                    </p>
                  </div>

                  {/* Footer buttons */}
                  <div className="flex gap-2.5 pt-2 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setShowAddOrgModal(false)}
                      className="flex-1 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all shadow-md"
                    >
                      Provision Workspace &gt;
                    </button>
                  </div>
                </form>
              ) : (
                /* STEP 2: DISPLAY GENERATED ONBOARDING LINK & TRANSMIT IT */
                <div className="p-6 space-y-5 text-left animate-fade-in">
                  <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl text-xs text-emerald-850 font-semibold space-y-1">
                    <p className="text-sm font-black text-emerald-900">✓ Storage Partition Created Successfully!</p>
                    <p>SaaS Tenant Partition <strong>{provisionedOrgId}</strong> was encrypted and allocated to the registry.</p>
                  </div>

                  {/* Invite Link Display Card */}
                  <div className="space-y-1.5 bg-zinc-50 border border-zinc-200 p-4.5 rounded-2xl">
                    <span className="block text-[10px] font-black font-mono text-zinc-500 uppercase tracking-wider">
                      Company Owner Signup Onboarding Url
                    </span>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        readOnly
                        value={getSignupUrl(provisionedOrgId)}
                        className="w-full bg-white px-3 py-2 border border-zinc-200 rounded-xl text-xs font-mono font-semibold"
                      />
                      <button
                        onClick={() => handleCopyOnboardingLink(provisionedOrgId)}
                        className="p-2.5 bg-white border border-zinc-200 hover:border-primary hover:bg-primary/5 rounded-xl transition-all"
                        title="Copy onboarding url to clipboard"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                      </button>
                    </div>
                    <p className="text-[9px] text-zinc-400 font-mono">
                      Visit this link to complete onboarding of organization owner and setup administrator credentials.
                    </p>
                  </div>

                  {/* Send invite fields */}
                  <div className="space-y-3.5 border-t border-zinc-150 pt-4">
                    <div className="flex items-center gap-1.5 text-xs font-black text-zinc-700 font-mono uppercase">
                      <Send className="w-3.5 h-3.5" /> Dispatch Invitation Link
                    </div>

                    {inviteSuccess ? (
                      <div className="p-3 bg-blue-50 border border-blue-150 rounded-xl text-xs text-primary font-bold">
                        ✓ Onboarding invitation SMS and Email dispatched to the tenant owner.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-extrabold font-mono text-zinc-500 uppercase">Owner Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
                            <input
                              type="email"
                              placeholder="client@company.com"
                              value={ownerEmail}
                              onChange={(e) => setOwnerEmail(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 rounded-xl border border-zinc-350 text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-extrabold font-mono text-zinc-500 uppercase">Owner Mobile Number</label>
                          <div className="relative">
                            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
                            <input
                              type="text"
                              placeholder="+254 712 345 678"
                              value={ownerPhone}
                              onChange={(e) => setOwnerPhone(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 rounded-xl border border-zinc-350 text-xs font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {!inviteSuccess && (
                        <button
                          onClick={() => {
                            if (!ownerEmail.trim() || !ownerPhone.trim()) {
                              alert("Please enter Owner Email and Phone number to send invite.");
                              return;
                            }
                            handleDispatchInvite(provisionedOrgId, provisionedOrgName, ownerEmail, ownerPhone, true);
                          }}
                          className="flex-1 py-2.5 bg-[#006c0c] hover:bg-neutral-800 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" /> Transmit Invite
                        </button>
                      )}
                      
                      {/* One Click Simulate sandbox test */}
                      <button
                        onClick={() => {
                          window.location.href = getSignupUrl(provisionedOrgId);
                        }}
                        className="flex-1 py-2.5 bg-zinc-900 hover:bg-primary-hover text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-sm"
                        title="Logout of Superadmin and immediately test company sign up view!"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Test Signup Form
                      </button>
                    </div>
                  </div>

                  {/* Back/Close Option */}
                  <div className="pt-3 border-t border-zinc-150 text-right">
                    <button
                      onClick={() => setShowAddOrgModal(false)}
                      className="px-4 py-2 hover:bg-zinc-100 text-zinc-650 rounded-xl text-xs font-bold font-mono uppercase tracking-wide transition-all"
                    >
                      Close Workspace Manager
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Dispatch Invitation Dialog */}
      <AnimatePresence>
        {activeInviteOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveInviteOrg(null)}
              className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-lg w-full bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 space-y-5 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-zinc-150">
                <h3 className="text-sm font-extrabold text-on-surface">Dispatch Corporate Invitation</h3>
                <button
                  onClick={() => setActiveInviteOrg(null)}
                  className="p-1 hover:bg-zinc-100 rounded text-zinc-400"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div>
                <p className="text-xs text-zinc-600 leading-relaxed font-semibold">
                  This compiles a private registration e-sign token link and transits it directly to the designated owner contact for <strong>{activeInviteOrg.name}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold font-mono text-zinc-500 uppercase">Owner Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="executive@company.com"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-zinc-350 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold font-mono text-zinc-500 uppercase">Owner Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="+254 712 ... ..."
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-zinc-350 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* URL Reference Check box */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                <span className="block text-[9px] font-bold font-mono text-zinc-400 uppercase leading-none">Invitation Signup URL Preview</span>
                <span className="block text-[10px] font-mono select-all break-all text-primary font-bold">
                  {getSignupUrl(activeInviteOrg.id)}
                </span>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-zinc-150">
                <button
                  onClick={() => setActiveInviteOrg(null)}
                  className="flex-1 py-2.5 bg-zinc-105 hover:bg-zinc-100 text-zinc-650 rounded-xl text-xs font-bold font-mono uppercase transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!ownerEmail.trim() || !ownerPhone.trim()) {
                      alert("Email & phone coordinates required.");
                      return;
                    }
                    handleDispatchInvite(activeInviteOrg.id, activeInviteOrg.name, ownerEmail, ownerPhone, false);
                  }}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold font-mono uppercase transition-all shadow-sm"
                >
                  Dispatch Invite
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
