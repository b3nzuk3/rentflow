/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  User,
  Wallet,
  Smartphone,
  Building,
  ChevronRight,
  TrendingUp,
  X,
  Check,
  AlertTriangle,
  Lock,
  Search,
  Filter,
  Ban,
  DollarSign,
  Paperclip,
  Eye,
  FileText
} from "lucide-react";
import { Payment, Lease, Tenant, Unit, Property, User as AppUser, Organization } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface LandlordPaymentsProps {
  currentUser: AppUser;
  organization: Organization;
  payments: Payment[];
  leases: Lease[];
  tenants: Tenant[];
  units: Unit[];
  properties: Property[];
  onVerifyPayment: (paymentId: string, status: "Verified" | "Rejected" | "Refunded", notes: string) => void;
}

export const LandlordPayments: React.FC<LandlordPaymentsProps> = ({
  currentUser,
  organization,
  payments,
  leases,
  tenants,
  units,
  properties,
  onVerifyPayment,
}) => {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [verificationNote, setVerificationNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [activeLandlordPreviewReceipt, setActiveLandlordPreviewReceipt] = useState<string | null>(null);

  // RBAC checks
  const isCaretaker = currentUser.role === "caretaker";
  const isAccountant = currentUser.role === "accountant";
  const cannotVerify = isCaretaker;
  const cannotViewFinancials = isCaretaker;

  const handleOpenDetails = (pay: Payment) => {
    setSelectedPayment(pay);
    setVerificationNote(pay.verificationNotes || "");
  };

  const handleCloseDetails = () => {
    setSelectedPayment(null);
  };

  const handleActionSubmit = (status: "Verified" | "Rejected" | "Refunded") => {
    if (!selectedPayment) return;
    onVerifyPayment(selectedPayment.id, status, verificationNote);
    handleCloseDetails();
  };

  // Resolve metadata helper for a payment record
  const getPaymentMeta = (pay: Payment) => {
    const lease = leases.find(l => l.id === pay.leaseId);
    const tenant = lease ? tenants.find(t => t.id === lease.tenantId) : null;
    const unit = lease ? units.find(u => u.id === lease.unitId) : null;
    const property = unit ? properties.find(p => p.id === unit.propertyId) : null;

    return {
      tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : "Unknown Tenant",
      tenantPhone: tenant ? tenant.phoneNumber : "N/A",
      unitCode: unit ? unit.unitCode : "N/A",
      propertyName: property ? property.name : "Unassigned Property",
    };
  };

  // Filter payments by organization and search/status limits
  const orgPayments = payments.filter(p => p.organizationId === organization.id);
  
  const filteredPayments = orgPayments.filter(pay => {
    const meta = getPaymentMeta(pay);
    const matchesSearch =
      meta.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pay.transactionCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meta.unitCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || pay.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = orgPayments.filter(p => p.status === "Pending").length;
  const verifiedVol = orgPayments.filter(p => p.status === "Verified").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Title block */}
      <section>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Rent Payment Reconciliation Ledger</h2>
        <p className="text-on-surface-variant font-medium mt-1">
          Perform audits, match external mobile money transactions, and approve tenant rent payments.
        </p>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flat-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">
              Pending Ledger Verification
            </span>
            <div className="text-5xl font-mono font-extrabold text-amber-600 mt-2">
              {pendingCount < 10 ? `0${pendingCount}` : pendingCount}
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant font-mono mt-3">
            ↳ Requires critical review to prevent billing conflicts
          </p>
        </div>

        <div className="flat-card p-6 rounded-2xl md:col-span-2 relative overflow-hidden group">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">
                Monthly Total Reconciled Rent Volume
              </span>
              <div className="text-3xl font-extrabold text-primary mt-2 tracking-tight">
                {cannotViewFinancials ? "KSh ••••" : `KSh ${verifiedVol.toLocaleString()}`}
              </div>
            </div>
            <p className="text-xs font-bold font-mono text-on-surface-variant mt-4">
              ✓ Automated ledger matching active • Tenant Isolation fully locked.
            </p>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-5 text-primary">
            <TrendingUp className="w-36 h-36" />
          </div>
        </div>
      </div>

      {/* Ledger controls and filters */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-2 max-w-md bg-white border border-outline-variant rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
            <Search className="w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search by tenant name, code or reference..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-sm bg-transparent outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider shrink-0 mr-1">
              Filter:
            </span>
            {(["All", "Pending", "Verified", "Rejected", "Refunded"] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${
                  statusFilter === f
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-white text-on-surface-variant border-outline-variant hover:border-primary/40"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">
              <AlertTriangle className="w-12 h-12 mx-auto stroke-1 text-on-surface-variant/30 mb-3" />
              <p className="text-sm font-bold text-on-surface">No matching transaction records found.</p>
              <p className="text-xs text-on-surface-variant mt-1">Try resetting filters or checking tenant submissions.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50">
                <tr className="border-b border-outline-variant">
                  <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase">Tenant &amp; Unit Space</th>
                  <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase text-right">Rent Paid</th>
                  <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase text-center">Transaction Reference</th>
                  <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase">Payment Channel</th>
                  <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase">Verification Status</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold font-mono text-on-surface-variant uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/65">
                {filteredPayments.map(pay => {
                  const meta = getPaymentMeta(pay);
                  return (
                    <tr
                      key={pay.id}
                      onClick={() => handleOpenDetails(pay)}
                      className="hover:bg-primary/[0.01] transition-colors cursor-pointer group"
                    >
                      {/* Tenant & property */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-mono text-xs shrink-0">
                            {meta.tenantName.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <p className="font-extrabold text-sm text-on-surface leading-snug">{meta.tenantName}</p>
                            <p className="text-[11px] text-on-surface-variant font-mono leading-none mt-0.5">
                              {meta.propertyName} • <span className="font-bold text-primary">{meta.unitCode}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Rent Paid amount masked for caretakers */}
                      <td className="px-6 py-4.5 font-mono font-bold text-sm text-on-surface text-right">
                        {cannotViewFinancials ? (
                          <span className="italic text-on-surface-variant/45">KSh •••••</span>
                        ) : (
                          `KSh ${pay.amount.toLocaleString()}`
                        )}
                      </td>

                      {/* Reference code always uppercase and unique */}
                      <td className="px-6 py-4.5 text-xs font-mono font-extrabold text-on-surface text-center tracking-wider">
                        <div className="flex flex-col items-center gap-1">
                          <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-bold border border-slate-205">
                            {pay.transactionCode}
                          </span>
                          {pay.receiptAttachment && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-150 px-1 py-0.5 rounded leading-none">
                              <Paperclip className="w-2.5 h-2.5 text-emerald-600" /> Slip Attached
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="px-6 py-4.5 text-xs font-mono font-medium text-on-surface-variant">
                        <div className="flex items-center gap-2">
                          <Smartphone className={`w-4 h-4 shrink-0 ${pay.paymentMethod.startsWith("M-Pesa") ? "text-primary" : "text-blue-600"}`} />
                          <span>{pay.paymentMethod}</span>
                        </div>
                      </td>

                      {/* Status indicator */}
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold font-mono border ${
                          pay.status === "Pending"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : pay.status === "Verified"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-250 animate-fade-in"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            pay.status === "Pending"
                              ? "bg-amber-600 animate-pulse"
                              : pay.status === "Verified"
                              ? "bg-emerald-600"
                              : "bg-rose-600"
                          }`} />
                          {pay.status}
                        </span>
                      </td>

                      {/* Open detail view */}
                      <td className="px-6 py-4.5 text-center">
                        <ChevronRight className="w-5 h-5 mx-auto text-on-surface-variant opacity-40 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-1.5 transition-all" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Verification overlay Details modal */}
      <AnimatePresence>
        {selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDetails}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex justify-between items-start pb-3 border-b border-outline-variant">
                <div>
                  <h3 className="font-extrabold text-base text-primary">Matching reconciliation details</h3>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                    Tenant Ledger Entry ID: #{selectedPayment.id}
                  </p>
                </div>
                <button
                  onClick={handleCloseDetails}
                  className="p-1 rounded-full hover:bg-slate-100 text-on-surface-variant"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Data Rows */}
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-on-surface-variant">Associated Tenant</span>
                  <span className="font-extrabold text-on-surface">{getPaymentMeta(selectedPayment).tenantName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-on-surface-variant">Property &amp; Space Code</span>
                  <span className="font-bold text-on-surface">
                    {getPaymentMeta(selectedPayment).propertyName} • {getPaymentMeta(selectedPayment).unitCode}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-on-surface-variant">Amount Received</span>
                  <span className="font-mono font-extrabold text-primary text-base">
                    KSh {selectedPayment.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-on-surface-variant">Transaction Code</span>
                  <span className="font-mono font-extrabold text-emerald-850 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    {selectedPayment.transactionCode}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-on-surface-variant">Submitted via</span>
                  <span className="font-mono text-on-surface-variant">{selectedPayment.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-on-surface-variant">Payout Status</span>
                  <span className="font-bold uppercase text-xs text-primary">{selectedPayment.status}</span>
                </div>
              </div>

              {/* Receipt File proof display */}
              <div className="space-y-1.5 text-left">
                <span className="block text-[10px] font-bold font-mono text-on-surface uppercase select-none">
                  Uploaded Verification Slip Proof
                </span>
                {selectedPayment.receiptAttachment ? (
                  <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-zinc-500 uppercase flex items-center gap-1">
                        <Paperclip className="w-3.5 h-3.5 text-primary" /> Tenant Uploaded Slip
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveLandlordPreviewReceipt(selectedPayment.receiptAttachment || null)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Full Slip
                      </button>
                    </div>
                    <div 
                      className="border border-zinc-200 rounded-lg overflow-hidden h-28 bg-white flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setActiveLandlordPreviewReceipt(selectedPayment.receiptAttachment || null)}
                    >
                      {selectedPayment.receiptAttachment.startsWith("data:application/pdf") ? (
                        <div className="text-center text-zinc-500 space-y-1 p-3">
                          <FileText className="w-8 h-8 text-primary mx-auto" />
                          <span className="text-[10px] font-bold font-mono block">PDF DOCUMENT DOCKET</span>
                        </div>
                      ) : (
                        <img
                          src={selectedPayment.receiptAttachment}
                          alt="Tenant Receipt slip thumbnail"
                          className="h-full object-contain"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-zinc-200 rounded-xl p-4 text-center text-xs text-zinc-400 font-mono">
                    No attachment provided (Self-Reported Entry)
                  </div>
                )}
              </div>

              {/* Internal verification notes form */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold font-mono text-on-surface uppercase select-none">
                  Internal Verification Audit Notes (Immutable once verified)
                </label>
                <textarea
                  value={verificationNote}
                  disabled={selectedPayment.status !== "Pending" && !isAccountant && currentUser.role !== "org_owner"}
                  onChange={e => setVerificationNote(e.target.value)}
                  placeholder="e.g. Verified code matched M-Pesa business portal, June invoice settled."
                  rows={2}
                  className="w-full p-2.5 bg-background-custom border border-outline-variant rounded-xl text-sm leading-normal focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Actions controller based on current status and roles */}
              {cannotVerify ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-mono">
                  <span className="font-bold text-slate-500">🔒 CARETAKER ACCESS CONTROL STATUS: MASKED READ-ONLY</span>
                </div>
              ) : selectedPayment.status === "Pending" ? (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleActionSubmit("Verified")}
                    className="py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-transform active:scale-95"
                  >
                    <CheckCircle className="w-4 h-4" /> Verify &amp; Settle
                  </button>
                  <button
                    onClick={() => handleActionSubmit("Rejected")}
                    className="py-3 border border-red-200 text-rose-650 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-transform active:scale-95"
                  >
                    <XCircle className="w-4 h-4" /> Reject Payment
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-mono font-bold text-emerald-800 flex items-center justify-center gap-2.5">
                  <Check className="w-4 h-4 text-primary" />
                  Audit settled by {selectedPayment.verifiedBy || currentUser.email}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full-view Zoom Lightbox Modal */}
      <AnimatePresence>
        {activeLandlordPreviewReceipt && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveLandlordPreviewReceipt(null)}
              className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-xl w-full bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-2xl overflow-hidden z-10 space-y-4 text-center"
            >
              <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                <span className="text-xs font-bold font-mono text-[#4CAF50] uppercase tracking-widest flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-[#4CAF50]" /> Verified Tenant Slip Zoom
                </span>
                <button
                  onClick={() => setActiveLandlordPreviewReceipt(null)}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-auto rounded-xl flex justify-center items-center bg-zinc-950 p-4 border border-zinc-850">
                {activeLandlordPreviewReceipt.startsWith("data:application/pdf") ? (
                  <div className="text-center py-12 text-zinc-450 space-y-2">
                    <FileText className="w-12 h-12 text-primary mx-auto opacity-75" />
                    <p className="text-sm font-bold text-white">PDF Document Attachment</p>
                    <p className="text-xs text-zinc-400">Secure digital ledger verification copy</p>
                  </div>
                ) : (
                  <img
                    src={activeLandlordPreviewReceipt}
                    alt="Tenant Receipt full resolution review"
                    className="max-h-[55vh] object-contain rounded-lg"
                  />
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setActiveLandlordPreviewReceipt(null)}
                  className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
