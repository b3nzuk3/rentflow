/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Plus,
  MapPin,
  Users,
  CreditCard,
  ChevronRight,
  FileText,
  CheckCircle,
  AlertTriangle,
  Download,
  Building,
  Shield,
  HelpCircle,
  TrendingUp,
  Inbox
} from "lucide-react";
import { Property, Payment, Unit, Lease, User, Organization, LandlordTab } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface LandlordDashboardProps {
  organization: Organization;
  currentUser: User;
  properties: Property[];
  units: Unit[];
  leases: Lease[];
  payments: Payment[];
  activities: { id: string; text: string; boldText?: string; time: string; type: string }[];
  setActiveTab: (tab: LandlordTab) => void;
  onAddProperty: (name: string, location: string, unitsCount: number) => void;
}

export const LandlordDashboard: React.FC<LandlordDashboardProps> = ({
  organization,
  currentUser,
  properties,
  units,
  leases,
  payments,
  activities,
  setActiveTab,
  onAddProperty,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPropName, setNewPropName] = useState("");
  const [newPropLocation, setNewPropLocation] = useState("Nairobi, Westlands");
  const [newPropUnits, setNewPropUnits] = useState("10");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim()) return;
    onAddProperty(newPropName, newPropLocation, parseInt(newPropUnits) || 12);
    setNewPropName("");
    setShowAddModal(false);
  };

  // 1. Role-Based Permissions (RBAC)
  const isCaretaker = currentUser.role === "caretaker";
  const isAccountant = currentUser.role === "accountant";
  const cannotManageProperties = isCaretaker || isAccountant;
  const cannotViewFinancials = isCaretaker;

  // 2. Dynamic Financial Calculations for the active organization
  const orgProperties = properties.filter(p => p.organizationId === organization.id);
  const orgPropertyIds = orgProperties.map(p => p.id);
  
  const orgUnits = units.filter(u => u.organizationId === organization.id);
  const totalUnitsCount = orgUnits.length;
  const occupiedUnitsCount = orgUnits.filter(u => u.status === "Occupied").length;
  const occupancyRate = totalUnitsCount > 0 ? Math.round((occupiedUnitsCount / totalUnitsCount) * 100) : 0;
  const vacantUnitsCount = orgUnits.filter(u => u.status === "Vacant").length;

  const orgLeases = leases.filter(l => l.organizationId === organization.id && l.status === "Active");
  
  // Expected Rent: Total monthly rent specified in active leases
  const expectedRent = orgLeases.reduce((sum, l) => sum + l.monthlyRent, 0);

  // Collected Rent: Sum of "Verified" payments in the organization
  const orgPayments = payments.filter(p => p.organizationId === organization.id);
  const collectedRent = orgPayments
    .filter(p => p.status === "Verified")
    .reduce((sum, p) => sum + p.amount, 0);

  // Outstanding Rent: Expected minus Collected (floor at 0)
  const outstandingRent = Math.max(0, expectedRent - collectedRent);

  // Pending Payments queue count
  const pendingPaymentsCount = orgPayments.filter(p => p.status === "Pending").length;

  // Subscription plan active units tracker
  const planLimits = {
    Starter: 10,
    Growth: 50,
    Enterprise: 100000000
  };
  const activeLimit = planLimits[organization.subscriptionPlan] || 10;
  const limitReached = totalUnitsCount >= activeLimit;

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* SaaS Organization & Plan Context Bar */}
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-on-surface">{organization.name}</h3>
              <span className={`px-2 py-0.5 text-[10px] font-extrabold font-mono rounded ${
                organization.subscriptionPlan === "Enterprise"
                  ? "bg-purple-100 text-purple-800"
                  : organization.subscriptionPlan === "Growth"
                  ? "bg-primary/10 text-primary"
                  : "bg-blue-100 text-blue-800"
              }`}>
                {organization.subscriptionPlan} Plan
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              Acting as: <span className="font-bold text-primary uppercase">{currentUser.firstName} {currentUser.lastName} ({currentUser.role.replace("_", " ")})</span>
            </p>
          </div>
        </div>

        {/* Units allocation meter against Billing model limits */}
        <div className="w-full sm:w-auto min-w-[200px] flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs font-bold font-mono">
            <span className="text-on-surface-variant">Allocated Units Limit</span>
            <span className="text-on-surface">
              {totalUnitsCount} / {organization.subscriptionPlan === "Enterprise" ? "Unlimited" : activeLimit}
            </span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${limitReached ? "bg-red-500" : "bg-primary"}`}
              style={{ width: `${Math.min(100, (totalUnitsCount / activeLimit) * 100)}%` }}
            ></div>
          </div>
          {limitReached && organization.subscriptionPlan !== "Enterprise" && (
            <p className="text-[10px] font-bold text-red-650 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              Units limit reached. Upgrade subscription.
            </p>
          )}
        </div>
      </div>

      {/* Welcome Title Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold font-mono tracking-widest text-primary uppercase mb-1">
            RentFlow Command
          </p>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">
            Habari, {currentUser.firstName}
          </h2>
          <p className="text-xs font-semibold text-on-surface-variant mt-0.5">
            Real-time rent reconciliation, tenancy log auditing, and collection operations.
          </p>
        </div>
        {!cannotManageProperties && (
          <div>
            <button
              onClick={() => {
                if (limitReached && organization.subscriptionPlan !== "Enterprise") {
                  alert("Your Starter/Growth plan limit has been met. Upgrade to increase capacity!");
                  return;
                }
                setShowAddModal(true);
              }}
              className="px-5 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-primary-hover transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-4.5 h-4.5" />
              Add Property
            </button>
          </div>
        )}
      </section>

      {/* Bento Grid Metrics containing dynamic data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Expected Monthly collections */}
        <div className="flat-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-44 h-44 bg-neutral-200/5 rounded-full blur-2xl transition-transform group-hover:scale-110 duration-500"></div>
          <div className="flex justify-between items-start mb-6 z-10">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Building className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold font-mono px-2.5 py-1 bg-surface-container rounded-full text-on-surface-variant">
              Target Cycle
            </span>
          </div>
          <div className="z-10">
            <p className="text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant">
              Expected Rent (Leases)
            </p>
            <h3 className="text-3xl font-extrabold text-on-surface tracking-tight mt-1">
              {cannotViewFinancials ? "KSh ••••••" : `KSh ${expectedRent.toLocaleString()}`}
            </h3>
            <p className="text-[10px] text-on-surface-variant font-mono mt-1">
              Active Leases: {orgLeases.length}
            </p>
          </div>
        </div>

        {/* Collected Rent */}
        <div className={`flat-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group ${collectedRent > 0 ? "border-primary/20 bg-primary/[0.01]" : ""}`}>
          <div className="flex justify-between items-start mb-6 z-10 border-b border-outline-variant/10 pb-3">
            <div className="p-3 bg-emerald-100 rounded-xl text-primary">
              <CreditCard className="w-6 h-6" />
            </div>
            {collectedRent > 0 && expectedRent > 0 && (
              <span className="text-xs font-bold font-mono px-3 py-1 bg-primary/10 text-primary rounded-full">
                {Math.round((collectedRent / expectedRent) * 100)}% collected
              </span>
            )}
          </div>
          <div className="z-10">
            <p className="text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant">
              Collected Rent (Verified)
            </p>
            <h3 className="text-3xl font-extrabold text-primary tracking-tight mt-1 animate-fade-in">
              {cannotViewFinancials ? "KSh ••••••" : `KSh ${collectedRent.toLocaleString()}`}
            </h3>
            <p className="text-[10px] text-on-surface-variant font-mono mt-1">
              Settled Ledger transactions
            </p>
          </div>
        </div>

        {/* Outstanding Overdue Balance */}
        <div className="flat-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6 border-b border-outline-variant/10 pb-3">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-800">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant">
              Outstanding Balance
            </p>
            <h3 className={`text-3xl font-extrabold tracking-tight mt-1 ${outstandingRent > 0 ? "text-amber-800" : "text-on-surface"}`}>
              {cannotViewFinancials ? "KSh ••••••" : `KSh ${outstandingRent.toLocaleString()}`}
            </h3>
            <p className="text-[10px] text-on-surface-variant font-mono mt-1">
              Due but unreconciled
            </p>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="flat-card rounded-2xl p-6 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-6 border-b border-outline-variant/10 pb-3">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-700">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold font-mono px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
              {occupancyRate}%
            </span>
          </div>
          <div>
            <p className="text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant">
              Occupancy Rate
            </p>
            <h3 className="text-3xl font-extrabold text-on-surface tracking-tight mt-1">
              {occupiedUnitsCount} <span className="text-on-surface-variant font-normal text-md">/ {totalUnitsCount} Units</span>
            </h3>
            <div className="w-full bg-surface-container rounded-full h-1 mt-3">
              <div
                className="bg-indigo-600 h-1 rounded-full transition-all duration-700"
                style={{ width: `${occupancyRate || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approval warning queue */}
      {pendingPaymentsCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-800 shrink-0">
              <Inbox className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-amber-850">Outstanding Payment Verification items</p>
              <p className="text-xs text-amber-700">
                There are <span className="font-bold">{pendingPaymentsCount} pending</span> tenant receipt submissions waiting for matching audits.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("payments")}
            className="px-4 py-2 bg-amber-800 text-white hover:bg-amber-900 rounded-xl font-bold text-xs shrink-0 transition-all active:scale-95 shadow-sm"
          >
            Review Queue
          </button>
        </div>
      )}

      {/* Main Grid Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Properties List (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-extrabold tracking-tight text-on-surface">Isolated Portfolio Units</h4>
            <button
              onClick={() => setActiveTab("properties")}
              className="text-primary font-bold text-sm tracking-tight flex items-center gap-1 hover:underline"
            >
              View Property Tree
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {orgProperties.length === 0 ? (
            <div className="text-center p-10 bg-white border border-outline-variant rounded-2xl">
              <Building className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-sm font-bold text-on-surface-variant">No properties registered.</p>
              <p className="text-xs text-on-surface-variant mt-1">Draft a new property above to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orgProperties.map(prop => {
                const propUnits = orgUnits.filter(u => u.propertyId === prop.id);
                const propOccupied = propUnits.filter(u => u.status === "Occupied").length;
                const propOccupancy = propUnits.length > 0 ? Math.round((propOccupied / propUnits.length) * 100) : 0;

                return (
                  <div
                    key={prop.id}
                    className="bg-white rounded-2xl border border-outline-variant overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300 group cursor-pointer"
                    onClick={() => setActiveTab("properties")}
                  >
                    <div className="h-40 w-full overflow-hidden relative">
                      {prop.image ? (
                        <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 hover:opacity-90"
                          src={prop.image}
                          alt={prop.name}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <Building className="w-10 h-10" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="bg-primary/90 backdrop-blur-sm px-3 py-1 text-white text-[10px] font-bold font-mono rounded-full">
                          Tenant Isolated
                        </span>
                      </div>
                    </div>
                    <div className="p-5 text-left">
                      <h5 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors text-on-surface">
                        {prop.name}
                      </h5>
                      <p className="text-xs text-on-surface-variant font-mono font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {prop.location}
                      </p>
                      <div className="mt-4 flex justify-between items-center pt-3 border-t border-outline-variant text-xs font-bold font-mono">
                        <span className="text-on-surface-variant">
                          {propUnits.length} Units Mapped
                        </span>
                        <span className="text-primary">
                          {propOccupancy}% Occupied
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Audit / Activities Panel */}
        <div className="flat-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-base font-extrabold tracking-tight mb-5">Tenant Event Streams</h4>
            <div className="space-y-5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1 text-left">
              {activities.length === 0 ? (
                <p className="text-xs font-mono text-on-surface-variant text-center py-6">No recent action streams logging.</p>
              ) : (
                activities.slice(0, 7).map((act, idx) => (
                  <div key={act.id} className="flex gap-3 relative">
                    {idx < activities.length - 1 && (
                      <div className="absolute left-3 top-6 bottom-[-20px] w-0.5 bg-outline-variant/60" />
                    )}

                    <div className="w-6.5 h-6.5 rounded-full flex items-center justify-center shrink-0 z-10 bg-primary/10 text-primary">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>

                    <div>
                      <p className="text-xs text-on-surface leading-normal font-medium">
                        {act.text}{" "}
                        {act.boldText && <span className="font-extrabold text-primary">{act.boldText}</span>}
                      </p>
                      <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">
                        {act.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => {
              // trigger CSV export
              const header = "Time,ActivityStream\n";
              const rows = activities.map(a => `"${a.time}","${a.text} ${a.boldText || ''}"`).join("\n");
              const blob = new Blob([header + rows], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `${organization.id}_rentflow_audit_activities.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="mt-6 w-full py-2.5 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            Download Action Log CSV
          </button>
        </div>
      </div>

      {/* Add Property Dialog Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
                <h3 className="text-base font-extrabold tracking-tight text-primary">Invite New Property Portfolio</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold font-mono text-on-surface mb-1.5 uppercase">
                    Property Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Greenwood Apartments Phase II"
                    value={newPropName}
                    onChange={e => setNewPropName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background-custom"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold font-mono text-on-surface mb-1.5 uppercase">
                      Location
                    </label>
                    <select
                      value={newPropLocation}
                      onChange={e => setNewPropLocation(e.target.value)}
                      className="w-full px-3 py-2.5 border border-outline-variant rounded-xl text-sm bg-background-custom"
                    >
                      <option value="Nairobi, Westlands">Nairobi, Westlands</option>
                      <option value="Nairobi, Kilimani">Nairobi, Kilimani</option>
                      <option value="Nairobi, Karen">Nairobi, Karen</option>
                      <option value="Mombasa, Nyali">Mombasa, Nyali</option>
                      <option value="Kisumu, Milimani">Kisumu, Milimani</option>
                      <option value="Nakuru, Section 58">Nakuru, Section 58</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-mono text-on-surface mb-1.5 uppercase">
                      Draft Units Count
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={newPropUnits}
                      onChange={e => setNewPropUnits(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background-custom"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 border border-outline-variant rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                  >
                    Confirm Portfolio
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
