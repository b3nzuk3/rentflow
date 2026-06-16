/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  FileText,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  UserPlus,
  AlertTriangle,
  Lock,
  Building,
  Key,
  X,
  Mail,
  Smartphone,
  Check
} from "lucide-react";
import { Lease, Tenant, Unit, Property, User, Organization } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface LandlordLeasesProps {
  currentUser: User;
  organization: Organization;
  leases: Lease[];
  tenants: Tenant[];
  units: Unit[];
  properties: Property[];
  onDraftLease: (
    tenantData: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      nationalId: string;
    },
    leaseData: {
      unitId: string;
      monthlyRent: number;
      securityDeposit: number;
      startDate: string;
      endDate: string;
    }
  ) => void;
}

export const LandlordLeases: React.FC<LandlordLeasesProps> = ({
  currentUser,
  organization,
  leases,
  tenants,
  units,
  properties,
  onDraftLease,
}) => {
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [tenantFn, setTenantFn] = useState("");
  const [tenantLn, setTenantLn] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantIdCard, setTenantIdCard] = useState("");

  const [leaseUnitId, setLeaseUnitId] = useState("");
  const [leaseRent, setLeaseRent] = useState("");
  const [leaseDeposit, setLeaseDeposit] = useState("");
  const [leaseStart, setLeaseStart] = useState("2026-06-01");
  const [leaseEnd, setLeaseEnd] = useState("2027-05-31");

  const [activeTabFilter, setActiveTabFilter] = useState<string>("All");

  // RBAC permissions checks
  const isCaretaker = currentUser.role === "caretaker";
  const isAccountant = currentUser.role === "accountant";
  const cannotDraft = isCaretaker || isAccountant;
  const cannotViewFinancials = isCaretaker;

  // Handle active property units
  const orgUnits = units.filter(u => u.organizationId === organization.id);
  const orgLeases = leases.filter(l => l.organizationId === organization.id);

  // Available vacant units for new leases
  const vacantUnits = orgUnits.filter(u => u.status === "Vacant");

  const handleUnitChange = (id: string) => {
    setLeaseUnitId(id);
    const targetUnit = units.find(u => u.id === id);
    if (targetUnit) {
      setLeaseRent(targetUnit.rentAmount.toString());
      setLeaseDeposit(targetUnit.rentAmount.toString()); // Deposit default = 1 month rent
    }
  };

  const handleDraftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaseUnitId) {
      alert("Please select a vacant unit.");
      return;
    }
    onDraftLease(
      {
        firstName: tenantFn,
        lastName: tenantLn,
        email: tenantEmail,
        phoneNumber: tenantPhone,
        nationalId: tenantIdCard || "ID-MOCK",
      },
      {
        unitId: leaseUnitId,
        monthlyRent: parseInt(leaseRent) || 30000,
        securityDeposit: parseInt(leaseDeposit) || 30000,
        startDate: leaseStart,
        endDate: leaseEnd,
      }
    );

    // Clear state
    setTenantFn("");
    setTenantLn("");
    setTenantEmail("");
    setTenantPhone("");
    setTenantIdCard("");
    setLeaseUnitId("");
    setShowDraftModal(false);
  };

  // Resolve Lease helper
  const getLeaseMeta = (lease: Lease) => {
    const tenant = tenants.find(t => t.id === lease.tenantId);
    const unit = units.find(u => u.id === lease.unitId);
    const property = unit ? properties.find(p => p.id === unit.propertyId) : null;

    return {
      tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : "Unknown Tenant",
      unitCode: unit ? unit.unitCode : "N/A",
      propertyName: property ? property.name : "Unassigned Property",
    };
  };

  const filteredLeases = orgLeases.filter(l => {
    if (activeTabFilter === "All") return true;
    return l.status === activeTabFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Title */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Lease Agreements Portfolio</h2>
          <p className="text-on-surface-variant font-medium mt-1">
            Authorize agreements, check security deposits, and draft legally binding African tenancy structures.
          </p>
        </div>
        {!cannotDraft && (
          <button
            onClick={() => setShowDraftModal(true)}
            className="px-5 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-primary-hover transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-4.5 h-4.5" />
            New Tenant Invite &amp; Lease
          </button>
        )}
      </section>

      {/* Segment Selector tabs */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider shrink-0 mr-1.5">
              Lease State:
            </span>
            {(["All", "Draft", "Active", "Expired", "Completed"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTabFilter(tab)}
                className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${
                  activeTabFilter === tab
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-white text-on-surface-variant border-outline-variant hover:border-primary/40"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Leases Table */}
        <div className="overflow-x-auto">
          {filteredLeases.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">
              <FileText className="w-12 h-12 mx-auto stroke-1 opacity-25 mb-3 text-on-surface-variant/40" />
              <p className="text-sm font-bold text-on-surface">No agreements fit this category filter.</p>
              <p className="text-xs text-on-surface-variant mt-1">Draft a new tenant transaction to establish rent structures.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50">
                <tr className="border-b border-outline-variant">
                  <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase">Tenant Name</th>
                  <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase">Rental unit space</th>
                  <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase text-right">Commitment Rent</th>
                  <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase">Term Dates</th>
                  <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase">Agreement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/65">
                {filteredLeases.map(lease => {
                  const meta = getLeaseMeta(lease);
                  return (
                    <tr key={lease.id} className="hover:bg-primary/[0.01] transition-colors">
                      {/* Tenant Name */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center font-mono text-xs">
                            LE
                          </div>
                          <div>
                            <p className="font-extrabold text-sm text-on-surface">{meta.tenantName}</p>
                            <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">Lease UUID: #{lease.uuid.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Space code */}
                      <td className="px-6 py-4.5">
                        <p className="font-bold text-xs text-on-surface">{meta.propertyName}</p>
                        <p className="text-[10px] text-primary font-mono font-bold uppercase mt-0.5">Unit {meta.unitCode}</p>
                      </td>

                      {/* Rent (Masked for Caretaker role) */}
                      <td className="px-6 py-4.5 font-mono font-bold text-sm text-on-surface text-right">
                        {cannotViewFinancials ? (
                          <span className="italic text-on-surface-variant/45">KSh ••••</span>
                        ) : (
                          `KSh ${lease.monthlyRent.toLocaleString()}`
                        )}
                      </td>

                      {/* Term Dates duration */}
                      <td className="px-6 py-4.5 font-mono text-xs text-on-surface-variant leading-none">
                        <span className="font-semibold block">{lease.startDate}</span>
                        <span className="text-[10px] text-zinc-400 font-medium block mt-1">to {lease.endDate}</span>
                      </td>

                      {/* Agreement Status */}
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold font-mono border ${
                          lease.status === "Active"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-250"
                            : lease.status === "Draft"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            lease.status === "Active"
                              ? "bg-emerald-600"
                              : lease.status === "Draft"
                              ? "bg-amber-600 animate-pulse"
                              : "bg-slate-400"
                          }`} />
                          {lease.status === "Draft" ? "Pending E-Sign" : lease.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* E-sign process and benefits */}
      <section className="bg-slate-50 p-6 rounded-2xl border border-outline-variant text-xs space-y-3 max-w-3xl">
        <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
          <Key className="w-4 h-4 text-primary" /> Integrated SMS invite &amp; E-sign operations
        </h4>
        <p className="text-slate-600 leading-relaxed">
          RentFlow removes manual user tenant self-registration. Landlords send formal invites specifying exact lease targets. The tenant logs in via password-less confirmation, verifies their national identification details, and accepts their tenancy draft. Once accepted, their lease locks immutably in June statement cycles.
        </p>
      </section>

      {/* Invite & draft Lease Modal Dialog */}
      <AnimatePresence>
        {showDraftModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDraftModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
                <h3 className="font-extrabold text-base text-primary">Invite Tenant &amp; Create Lease</h3>
                <button onClick={() => setShowDraftModal(false)}>
                  <Plus className="w-5 h-5 rotate-45 text-on-surface-variant" />
                </button>
              </div>

              {vacantUnits.length === 0 ? (
                <div className="text-center py-6 text-on-surface-variant space-y-3">
                  <AlertTriangle className="w-10 h-10 mx-auto text-amber-600" />
                  <p className="text-xs font-bold">No Vacant units are available in your current properties.</p>
                  <p className="text-[11px]">Please add more units, mark an occupied unit as Vacant, or resolve notice given states.</p>
                  <button
                    type="button"
                    onClick={() => setShowDraftModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg"
                  >
                    Close Dialog
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDraftSubmit} className="space-y-4 text-left">
                  {/* Tenant personal parameters */}
                  <div className="space-y-2 border-b border-outline-variant/65 pb-3">
                    <span className="text-[10px] font-bold font-mono text-primary uppercase">1. Tenant Professional Credentials</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-on-surface mb-1">First Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Jane"
                          value={tenantFn}
                          onChange={e => setTenantFn(e.target.value)}
                          className="w-full px-3 py-2 bg-background-custom border border-outline-variant rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-on-surface mb-1">Last Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Doe"
                          value={tenantLn}
                          onChange={e => setTenantLn(e.target.value)}
                          className="w-full px-3 py-2 bg-background-custom border border-outline-variant rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-on-surface mb-1">Email address</label>
                        <input
                          type="email"
                          required
                          placeholder="jane.doe@example.com"
                          value={tenantEmail}
                          onChange={e => setTenantEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-background-custom border border-outline-variant rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-on-surface mb-1">Mobile (+254 phone)</label>
                        <input
                          type="text"
                          required
                          placeholder="+254712345678"
                          value={tenantPhone}
                          onChange={e => setTenantPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-background-custom border border-outline-variant rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-on-surface mb-1">National ID / Passport Number</label>
                      <input
                        type="text"
                        placeholder="ID number (e.g. 30218821)"
                        value={tenantIdCard}
                        onChange={e => setTenantIdCard(e.target.value)}
                        className="w-full px-3 py-2 bg-background-custom border border-outline-variant rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Lease Parameters */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold font-mono text-primary uppercase">2. Lease Agreement Parameters</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-on-surface mb-1">Unit Selection</label>
                        <select
                          required
                          value={leaseUnitId}
                          onChange={e => handleUnitChange(e.target.value)}
                          className="w-full px-3 py-2 bg-background-custom border border-outline-variant rounded-xl text-xs font-bold"
                        >
                          <option value="">Select an available unit...</option>
                          {vacantUnits.map(unit => {
                            const propName = properties.find(p => p.id === unit.propertyId)?.name || "Greenwood";
                            return (
                              <option key={unit.id} value={unit.id}>
                                {unit.unitCode} ({propName})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-on-surface mb-1">Monthly Rent amount (KSh)</label>
                        <input
                          type="number"
                          required
                          placeholder="Rent amount"
                          value={leaseRent}
                          onChange={e => setLeaseRent(e.target.value)}
                          className="w-full px-3 py-2 bg-background-custom border border-outline-variant rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-on-surface mb-1">Refundable Deposit (KSh)</label>
                        <input
                          type="number"
                          placeholder="Security Deposit"
                          value={leaseDeposit}
                          onChange={e => setLeaseDeposit(e.target.value)}
                          className="w-full px-3 py-2 bg-background-custom border border-outline-variant rounded-xl text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-on-surface mb-1">Start Date</label>
                        <input
                          type="date"
                          required
                          value={leaseStart}
                          onChange={e => setLeaseStart(e.target.value)}
                          className="w-full px-3 py-2 bg-background-custom border border-outline-variant rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    <UserPlus className="w-4 h-4" /> Save Agreement Draft &amp; Send SMS Invitation
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
