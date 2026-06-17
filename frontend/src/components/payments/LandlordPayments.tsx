"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getPayments,
  verifyPayment,
  getLeases,
  getTenants,
  getUnits,
  getProperties,
  getStoredUser,
} from "@/lib/api";
import type { Payment, Lease, Tenant, Unit, Property } from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

type PaymentStatus = Payment["status"];
type PaymentFilter = "All" | PaymentStatus;

const PAYMENT_FILTERS: PaymentFilter[] = ["All", "Pending", "Verified", "Rejected", "Refunded"];

interface ResolvedPayment extends Payment {
  tenantName: string;
  unitCode: string;
  propertyName: string;
}

// ── Status badge config ──────────────────────────────────────────────────────

const STATUS_BADGE: Record<PaymentStatus, { bg: string; dot: string; text: string }> = {
  Pending:  { bg: "bg-amber-50",  dot: "bg-amber-500",  text: "text-amber-700" },
  Verified: { bg: "bg-emerald-50", dot: "bg-emerald-500", text: "text-emerald-700" },
  Rejected: { bg: "bg-red-50",    dot: "bg-red-500",    text: "text-red-700" },
  Refunded: { bg: "bg-blue-50",   dot: "bg-blue-500",   text: "text-blue-700" },
};

// ── Small Components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PaymentStatus }) {
  const s = STATUS_BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold font-mono px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
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

// ── Main Component ───────────────────────────────────────────────────────────

export function LandlordPayments() {
  // Data state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [unitList, setUnitList] = useState<Unit[]>([]);
  const [propertyList, setPropertyList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter / search
  const [statusFilter, setStatusFilter] = useState<PaymentFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail modal
  const [selectedPayment, setSelectedPayment] = useState<ResolvedPayment | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch all data on mount ──────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [paymentsRes, leasesRes, tenantsRes, unitsRes, propsRes] = await Promise.all([
        getPayments(),
        getLeases(),
        getTenants(),
        getUnits(),
        getProperties(),
      ]);
      setPayments(paymentsRes);
      setLeases(leasesRes);
      setTenants(tenantsRes);
      setUnitList(unitsRes);
      setPropertyList(propsRes);
    } catch (err) {
      console.error("Failed to fetch payment data:", err);
      setError("Failed to load payment records. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Resolve display names ────────────────────────────────────────────────

  const resolvePayment = useCallback(
    (p: Payment): ResolvedPayment => {
      const lease = leases.find((l) => l.id === p.lease_id);
      const tenant = lease ? tenants.find((t) => t.id === lease.tenant_id) : undefined;
      const unit = lease ? unitList.find((u) => u.id === lease.unit_id) : undefined;
      const property = unit ? propertyList.find((pr) => pr.id === unit.property_id) : undefined;

      return {
        ...p,
        tenantName: tenant ? `${tenant.first_name} ${tenant.last_name}` : "Unknown Tenant",
        unitCode: unit?.unit_code ?? "—",
        propertyName: property?.name ?? "—",
      };
    },
    [leases, tenants, unitList, propertyList]
  );

  // ── Filtered + searched payments ─────────────────────────────────────────

  const filteredPayments = useMemo(() => {
    let resolved = payments.map(resolvePayment);

    // Status filter
    if (statusFilter !== "All") {
      resolved = resolved.filter((p) => p.status === statusFilter);
    }

    // Search filter
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      resolved = resolved.filter(
        (p) =>
          p.tenantName.toLowerCase().includes(q) ||
          p.transaction_code.toLowerCase().includes(q) ||
          p.unitCode.toLowerCase().includes(q)
      );
    }

    return resolved;
  }, [payments, statusFilter, searchQuery, resolvePayment]);

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const pendingCount = payments.filter((p) => p.status === "Pending").length;
    const verifiedVolume = payments
      .filter((p) => p.status === "Verified")
      .reduce((sum, p) => sum + p.amount, 0);
    return { pendingCount, verifiedVolume };
  }, [payments]);

  // ── Verify / Reject ─────────────────────────────────────────────────────

  const handleVerify = async (status: "Verified" | "Rejected") => {
    if (!selectedPayment) return;
    setSubmitting(true);
    try {
      const updated = await verifyPayment(selectedPayment.id, status, verificationNotes);
      setPayments((prev) =>
        prev.map((p) =>
          p.id === updated.id
            ? { ...p, status: updated.status, verified_by: updated.verified_by, verification_notes: updated.verification_notes }
            : p
        )
      );
      setSelectedPayment((prev) => (prev ? { ...prev, status: updated.status, verification_notes: updated.verification_notes } : null));
      setVerificationNotes("");
    } catch (err) {
      console.error("Failed to verify payment:", err);
      setError("Failed to update payment status. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const user = getStoredUser();
  const userEmail = user?.email ?? user?.id ?? "Unknown";

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <section>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">
          Rent Payment Reconciliation Ledger
        </h2>
        <p className="text-on-surface-variant font-medium mt-1">
          Perform audits, match external mobile money transactions, and approve tenant rent payments.
        </p>
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

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flat-card p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">
            Pending Verification
          </span>
          <div className="text-5xl font-mono font-extrabold text-amber-600 mt-2">
            {String(stats.pendingCount).padStart(2, "0")}
          </div>
        </div>
        <div className="flat-card p-6 rounded-2xl md:col-span-2 relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-44 h-44 bg-emerald-50 rounded-full blur-2xl transition-transform group-hover:scale-110 duration-500" />
          <div className="relative z-10 h-full flex flex-col justify-between">
            <span className="text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">
              Monthly Reconciled Rent Volume
            </span>
            <div className="text-3xl font-extrabold text-emerald-600 mt-2 tracking-tight">
              {formatCurrency(stats.verifiedVolume)}
            </div>
          </div>
        </div>
      </div>

      {/* Filters row: status tabs + search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Status filter buttons */}
        <div className="flex flex-wrap gap-2">
          {PAYMENT_FILTERS.map((filter) => {
            const count =
              filter === "All"
                ? payments.length
                : payments.filter((p) => p.status === filter).length;
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

        {/* Search input */}
        <div className="relative md:ml-auto w-full md:w-72">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tenant, code, unit..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container/30 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Payments table */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-sm font-bold font-mono text-on-surface-variant">
              Loading payment records...
            </p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <svg
              className="w-12 h-12 mx-auto stroke-1 opacity-25 mb-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
            </svg>
            <p className="text-sm font-bold text-on-surface">
              {searchQuery
                ? "No payments match your search."
                : statusFilter === "All"
                ? "No payment records found."
                : `No ${statusFilter.toLowerCase()} payments.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container/40">
                  <th className="px-5 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">
                    Tenant &amp; Unit
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">
                    Transaction Code
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">
                    Payment Method
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
                {filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-surface-container/20 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedPayment(p);
                      setVerificationNotes(p.verification_notes ?? "");
                    }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface">{p.tenantName}</span>
                        <span className="text-xs font-mono text-on-surface-variant">
                          {p.propertyName} · {p.unitCode}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-on-surface">
                        {formatCurrency(p.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono font-semibold text-on-surface-variant">
                        {p.transaction_code}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-on-surface-variant">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayment(p);
                          setVerificationNotes(p.verification_notes ?? "");
                        }}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-hover transition-all active:scale-95"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      <Modal
        open={!!selectedPayment}
        onClose={() => {
          setSelectedPayment(null);
          setVerificationNotes("");
        }}
        title="Payment Details"
      >
        {selectedPayment && (
          <>
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">Tenant</p>
                <p className="text-sm font-bold text-on-surface mt-0.5">{selectedPayment.tenantName}</p>
              </div>
              <div>
                <p className="text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">Property / Unit</p>
                <p className="text-sm font-bold text-on-surface mt-0.5">
                  {selectedPayment.propertyName} · {selectedPayment.unitCode}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">Amount</p>
                <p className="text-sm font-extrabold text-on-surface mt-0.5">
                  {formatCurrency(selectedPayment.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">Transaction Code</p>
                <p className="text-sm font-mono font-semibold text-on-surface mt-0.5">
                  {selectedPayment.transaction_code}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">Payment Method</p>
                <p className="text-sm font-medium text-on-surface mt-0.5">{selectedPayment.payment_method}</p>
              </div>
              <div>
                <p className="text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">Date</p>
                <p className="text-sm font-medium text-on-surface mt-0.5">
                  {formatDate(selectedPayment.payment_date)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedPayment.status} />
                </div>
              </div>
            </div>

            {/* Receipt attachment */}
            {selectedPayment.receipt_attachment && (
              <div>
                <p className="text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-2">
                  Receipt Attachment
                </p>
                <div className="border border-outline-variant rounded-xl p-3 bg-surface-container/30">
                  {selectedPayment.receipt_attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={selectedPayment.receipt_attachment}
                      alt="Receipt"
                      className="w-full rounded-lg object-contain max-h-64"
                    />
                  ) : (
                    <a
                      href={selectedPayment.receipt_attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      View / Download Receipt
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Verification notes */}
            <div>
              <label className="block text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">
                Verification Notes
              </label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={3}
                placeholder={
                  selectedPayment.status === "Pending"
                    ? "Add notes about this payment verification..."
                    : undefined
                }
                readOnly={selectedPayment.status !== "Pending"}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container/30 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              />
            </div>

            {/* Action buttons */}
            {selectedPayment.status === "Pending" ? (
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleVerify("Verified")}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {submitting ? "Processing..." : "Verify & Settle"}
                </button>
                <button
                  onClick={() => handleVerify("Rejected")}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  {submitting ? "Processing..." : "Reject Payment"}
                </button>
              </div>
            ) : (
              <div className="bg-surface-container/50 rounded-xl p-4 text-center">
                <p className="text-sm font-bold text-on-surface-variant">
                  Audit settled by{" "}
                  <span className="text-on-surface font-extrabold">
                    {selectedPayment.verified_by ?? userEmail}
                  </span>
                </p>
                {selectedPayment.verification_notes && (
                  <p className="text-xs text-on-surface-variant mt-1 italic">
                    &ldquo;{selectedPayment.verification_notes}&rdquo;
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
