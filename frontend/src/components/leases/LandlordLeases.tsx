"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import {
  getLeases,
  getUnits,
  createTenant,
  createLease,
  signLease,
  deleteLease,
} from "@/lib/api";
import type { Lease, Tenant, Unit } from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

type LeaseStatus = Lease["status"];
type LeaseFilter = "All" | LeaseStatus;

const LEASE_FILTERS: LeaseFilter[] = ["All", "Draft", "Active", "Expired", "Completed"];

const STATUS_BADGE: Record<LeaseStatus, string> = {
  Draft: "bg-surface-container text-on-surface-variant",
  Active: "bg-emerald-50 text-emerald-700",
  Expired: "bg-red-50 text-red-700",
  Terminated: "bg-amber-50 text-amber-700",
  Completed: "bg-blue-50 text-blue-700",
};

// ── Shared Components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LeaseStatus }) {
  return (
    <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${STATUS_BADGE[status]}`}>
      {status}
    </span>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold tracking-tight text-on-surface">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container/30 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function LandlordLeases() {
  // Data state
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [vacantUnits, setVacantUnits] = useState<Unit[]>([]);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState<LeaseFilter>("All");

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteStep, setInviteStep] = useState<1 | 2>(1);

  // Step 1: Tenant form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");

  // Step 2: Lease form
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Submitting
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Fetch data on mount ──────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leasesRes, tenantsRes, unitsRes] = await Promise.all([
        getLeases(),
        api.get("/tenants"),
        getUnits(),
      ]);
      setLeases(leasesRes);
      setTenants(tenantsRes.data);
      setAllUnits(unitsRes);
      setVacantUnits(unitsRes.filter((u) => u.status === "Vacant"));
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load leases. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filtered leases ──────────────────────────────────────────────────────

  const filteredLeases =
    statusFilter === "All" ? leases : leases.filter((l) => l.status === statusFilter);

  // ── Helper: resolve tenant name from leases ──────────────────────────────

  const getTenantName = (tenantId: string): string => {
    const t = tenants.find((t) => t.id === tenantId);
    return t ? `${t.first_name} ${t.last_name}` : "—";
  };

  // ── Helper: resolve unit code from all units ──────────────────────────────

  const getUnitCode = (unitId: string): string => {
    const u = allUnits.find((u) => u.id === unitId);
    return u ? u.unit_code : "—";
  };

  // ── Create tenant + lease ────────────────────────────────────────────────

  const handleInviteSubmit = async () => {
    // Validate step 1
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in all required tenant fields.");
      return;
    }

    if (inviteStep === 1) {
      setInviteStep(2);
      return;
    }

    // Validate step 2
    if (!selectedUnitId || !monthlyRent || !securityDeposit || !startDate || !endDate) {
      setError("Please fill in all lease details.");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError("End date must be after start date.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Step 1: Create tenant
      const newTenant = await createTenant({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone_number: phone.trim(),
        national_id: nationalId.trim() || undefined,
      });

      setTenants((prev) => [...prev, newTenant]);

      // Step 2: Create draft lease
      const newLease = await createLease({
        tenant_id: newTenant.id,
        unit_id: selectedUnitId,
        monthly_rent: parseFloat(monthlyRent),
        security_deposit: parseFloat(securityDeposit),
        start_date: startDate,
        end_date: endDate,
      });

      setLeases((prev) => [...prev, newLease]);

      // Remove unit from vacant list
      setVacantUnits((prev) => prev.filter((u) => u.id !== selectedUnitId));

      // Reset and close
      resetInviteForm();
      setShowInviteModal(false);
    } catch (err) {
      console.error("Failed to create tenant/lease:", err);
      setError("Failed to create tenant invite & lease. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetInviteForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setNationalId("");
    setSelectedUnitId("");
    setMonthlyRent("");
    setSecurityDeposit("");
    setStartDate("");
    setEndDate("");
    setInviteStep(1);
  };

  // ── E-Sign lease ─────────────────────────────────────────────────────────

  const handleESign = async (leaseId: string) => {
    try {
      const updated = await signLease(leaseId);
      setLeases((prev) =>
        prev.map((l) => (l.id === leaseId ? { ...l, status: updated.status } : l))
      );
    } catch (err) {
      console.error("Failed to sign lease:", err);
      setError("Failed to e-sign lease. Please try again.");
    }
  };

  // ── Delete lease ─────────────────────────────────────────────────────────

  const handleDelete = async (leaseId: string) => {
    try {
      await deleteLease(leaseId);
      setLeases((prev) => prev.filter((l) => l.id !== leaseId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Failed to delete lease:", err);
      setError("Failed to delete lease. Please try again.");
    }
  };

  // ── Format helpers ───────────────────────────────────────────────────────

  const formatCurrency = (amount: number) =>
    `KSh ${amount.toLocaleString()}`;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">
            Lease Agreements Portfolio
          </h2>
          <p className="text-on-surface-variant font-medium mt-1">
            Authorize agreements and draft tenancy structures.
          </p>
        </div>
        <button
          onClick={() => {
            resetInviteForm();
            setShowInviteModal(true);
          }}
          className="px-5 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-primary-hover transition-all active:scale-95 shadow-sm"
        >
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Tenant Invite &amp; Lease
        </button>
      </section>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {LEASE_FILTERS.map((filter) => {
          const count =
            filter === "All"
              ? leases.length
              : leases.filter((l) => l.status === filter).length;
          return (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all active:scale-95 ${
                statusFilter === filter
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white border border-outline-variant text-on-surface-variant hover:border-primary/40 hover:text-on-surface"
              }`}
            >
              {filter}
              <span className="ml-1.5 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Leases table */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-sm font-bold font-mono text-on-surface-variant">
              Loading leases...
            </p>
          </div>
        ) : filteredLeases.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <svg
              className="w-12 h-12 mx-auto stroke-1 opacity-25 mb-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <p className="text-sm font-bold text-on-surface">
              {statusFilter === "All"
                ? "No lease agreements yet."
                : `No ${statusFilter.toLowerCase()} leases.`}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Click "New Tenant Invite &amp; Lease" to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container/40">
                  <th className="px-5 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">
                    Unit Space
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">
                    Rent
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">
                    Term Dates
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {filteredLeases.map((lease) => (
                  <tr key={lease.id} className="hover:bg-surface-container/20 transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-on-surface">
                        {getTenantName(lease.tenant_id)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono font-semibold text-on-surface-variant">
                        {getUnitCode(lease.unit_id)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-on-surface">
                        {formatCurrency(lease.monthly_rent)}
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium ml-1">
                        /mo
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-on-surface-variant">
                        {formatDate(lease.start_date)} — {formatDate(lease.end_date)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={lease.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {lease.status === "Draft" && (
                          <button
                            onClick={() => handleESign(lease.id)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                            E-Sign
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm(lease.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-on-surface-variant hover:text-red-600 transition-colors"
                          title="Delete lease"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── New Tenant Invite & Lease Modal ──────────────────────────────── */}
      <Modal
        open={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          resetInviteForm();
          setError(null);
        }}
        title={inviteStep === 1 ? "Step 1: Tenant Details" : "Step 2: Lease Details"}
      >
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${
              inviteStep >= 1
                ? "bg-primary text-white"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            1
          </div>
          <div className={`flex-1 h-0.5 rounded ${inviteStep >= 2 ? "bg-primary" : "bg-outline-variant"}`} />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${
              inviteStep >= 2
                ? "bg-primary text-white"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            2
          </div>
        </div>
        <div className="flex justify-between text-xs font-bold font-mono text-on-surface-variant mb-4">
          <span>Tenant Info</span>
          <span>Lease Terms</span>
        </div>

        {inviteStep === 1 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="First Name"
                value={firstName}
                onChange={setFirstName}
                placeholder="John"
                required
              />
              <InputField
                label="Last Name"
                value={lastName}
                onChange={setLastName}
                placeholder="Doe"
                required
              />
            </div>
            <InputField
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="john@example.com"
              required
            />
            <InputField
              label="Phone Number"
              value={phone}
              onChange={setPhone}
              placeholder="+254 700 000 000"
              required
            />
            <InputField
              label="National ID"
              value={nationalId}
              onChange={setNationalId}
              placeholder="Optional"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => {
                  setSelectedUnitId(e.target.value);
                  const unit = vacantUnits.find((u) => u.id === e.target.value);
                  if (unit) {
                    setMonthlyRent(String(unit.rent_amount));
                    setSecurityDeposit(String(unit.rent_amount));
                  }
                }}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container/30 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                <option value="">Select a vacant unit...</option>
                {vacantUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.unit_code} — KSh {unit.rent_amount.toLocaleString()}/mo
                  </option>
                ))}
              </select>
              {vacantUnits.length === 0 && (
                <p className="text-xs text-amber-600 font-bold mt-1.5">
                  No vacant units available. Add units first.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Monthly Rent (KSh)"
                value={monthlyRent}
                onChange={setMonthlyRent}
                type="number"
                placeholder="50000"
                required
              />
              <InputField
                label="Security Deposit (KSh)"
                value={securityDeposit}
                onChange={setSecurityDeposit}
                type="number"
                placeholder="50000"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                type="date"
                required
              />
              <InputField
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                type="date"
                required
              />
            </div>
          </div>
        )}

        {/* Modal actions */}
        <div className="flex items-center justify-between pt-2">
          {inviteStep === 2 ? (
            <button
              onClick={() => setInviteStep(1)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowInviteModal(false);
                resetInviteForm();
                setError(null);
              }}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant border border-outline-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInviteSubmit}
              disabled={submitting || (inviteStep === 2 && vacantUnits.length === 0)}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Creating...
                </>
              ) : inviteStep === 1 ? (
                "Next →"
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Create Lease
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      <Modal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Lease"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p className="text-sm font-bold text-red-700">Are you sure?</p>
              <p className="text-xs text-red-600 mt-1">
                This will permanently delete the lease agreement. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant border border-outline-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all active:scale-95 shadow-sm"
            >
              Delete Lease
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
