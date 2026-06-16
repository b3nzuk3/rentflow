/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Wallet,
  FileText,
  CheckCircle,
  Download,
  Building,
  Wrench,
  Headphones,
  Smartphone,
  Shield,
  Plus,
  X,
  ChevronRight,
  AlertTriangle,
  PenTool,
  Check,
  Award,
  Upload,
  Trash2,
  Paperclip,
  Eye
} from "lucide-react";
import { Payment, Lease, Tenant, Unit, Property, User } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface TenantDashboardProps {
  currentUser: User;
  payments: Payment[];
  leases: Lease[];
  tenants: Tenant[];
  units: Unit[];
  properties: Property[];
  onSubmitPayment: (
    amount: number,
    method: Payment["paymentMethod"],
    referenceCode: string,
    notes: string,
    leaseId: string,
    receiptAttachment?: string
  ) => void;
  onAcceptLease: (leaseId: string) => void;
}

export const TenantDashboard: React.FC<TenantDashboardProps> = ({
  currentUser,
  payments,
  leases,
  tenants,
  units,
  properties,
  onSubmitPayment,
  onAcceptLease,
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<Payment["paymentMethod"]>("M-Pesa Paybill");
  const [payRef, setPayRef] = useState("");
  const [payNote, setPayNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Upload/Attachment State Controls
  const [fileAttachment, setFileAttachment] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [activePreviewReceipt, setActivePreviewReceipt] = useState<string | null>(null);

  // Resolve matching tenant from users record
  const matchingTenant = tenants.find(t => t.email.toLowerCase() === currentUser.email.toLowerCase());
  
  // Find leases associated with this tenant
  const tenantLeases = matchingTenant ? leases.filter(l => l.tenantId === matchingTenant.id) : [];
  
  // Find active lease or draft lease
  const activeLease = tenantLeases.find(l => l.status === "Active");
  const draftLease = tenantLeases.find(l => l.status === "Draft");

  // Lookup lease unit & property details
  const getLeaseDetails = (lease: Lease) => {
    const unit = units.find(u => u.id === lease.unitId);
    const property = unit ? properties.find(p => p.id === unit.propertyId) : null;
    return { unit, property };
  };

  const handleEsignLease = (leaseId: string) => {
    onAcceptLease(leaseId);
    alert("✓ Lease accepted & signed successfully! Greenwood Unit B12 is now active.");
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFileAttachment(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleAttachMock = () => {
    const currentRef = payRef.trim() || ("RFT" + Math.random().toString(36).substring(2, 8).toUpperCase() + "M");
    if (!payRef.trim()) {
      setPayRef(currentRef);
    }
    setFileName(`MPESA_Ticket_${currentRef}.png`);
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="350" height="200" viewBox="0 0 350 200">
        <rect width="100%" height="100%" fill="#121212"/>
        <rect x="10" y="10" width="330" height="180" rx="10" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
        <text x="30" y="45" fill="#10b981" font-family="monospace" font-size="16" font-weight="bold">Safaricom M-PESA RECEIPT</text>
        <line x1="30" y1="58" x2="320" y2="58" stroke="#334155" stroke-dasharray="4"/>
        <text x="30" y="85" fill="#94a3b8" font-family="sans-serif" font-size="10">TRANSACTION CODE:</text>
        <text x="30" y="102" fill="#ffffff" font-family="monospace" font-size="14" font-weight="bold">${currentRef}</text>
        <text x="30" y="132" fill="#94a3b8" font-family="sans-serif" font-size="10">PAYMENT TO:</text>
        <text x="30" y="148" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold">Amani Property Group Ltd</text>
        <text x="210" y="85" fill="#94a3b8" font-family="sans-serif" font-size="10">AMOUNT PAID:</text>
        <text x="210" y="105" fill="#10b981" font-family="monospace" font-size="16" font-weight="bold">KSh ${(activeLease?.monthlyRent || 35000).toLocaleString()}</text>
        <text x="30" y="176" fill="#64748b" font-family="sans-serif" font-style="italic" font-size="9">Verified secure RentFlow Ledger transaction</text>
      </svg>
    `;
    const base64Svg = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
    setFileAttachment(base64Svg);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLease) return;
    if (!payRef.trim()) {
      alert("Error: Please provide a valid transaction reference.");
      return;
    }

    setIsSubmitting(true);
    setFeedback("Transmitting transaction record to Secure Paybill Clearing Portal...");

    setTimeout(() => {
      onSubmitPayment(
        activeLease.monthlyRent,
        selectedMethod,
        payRef.toUpperCase(),
        payNote,
        activeLease.id,
        fileAttachment || undefined
      );
      setFeedback("✓ Payment Submitted! Waiting for Accountant ledger reconciliation matching.");
      setIsSubmitting(false);

      setTimeout(() => {
        setFeedback("");
        setPayRef("");
        setPayNote("");
        setFileAttachment("");
        setFileName("");
        setShowSubmitModal(false);
      }, 2500);
    }, 1200);
  };

  // Calculate dynamic payment ledger items for active lease
  const activeLeasePayments = activeLease ? payments.filter(p => p.leaseId === activeLease.id) : [];
  const totalVerifiedPaid = activeLeasePayments
    .filter(p => p.status === "Verified")
    .reduce((sum, p) => sum + p.amount, 0);

  const outstandingRentAmount = activeLease ? Math.max(0, activeLease.monthlyRent - totalVerifiedPaid) : 0;
  const isRentPaid = outstandingRentAmount <= 0;

  // Render Onboarding state if tenant has no active lease but has a draft waiting
  if (!activeLease && draftLease) {
    const { unit, property } = getLeaseDetails(draftLease);
    return (
      <div className="space-y-8 animate-fade-in text-left">
        <section className="bg-gradient-to-br from-primary/10 to-emerald-200/5 border border-primary/20 rounded-3xl p-8 max-w-2xl mx-auto space-y-6">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
            <PenTool className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold font-mono tracking-widest text-primary uppercase">
              Onboarding • Pending Signing
            </span>
            <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">
              Review &amp; Sign Your Lease Agreement
            </h2>
            <p className="text-xs text-on-surface-variant font-medium">
              You have been invited by the Property Manager to join <span className="font-bold text-on-surface">{property?.name || "Greenwood"}</span>.
            </p>
          </div>

          {/* Lease Details Summary */}
          <div className="bg-white p-5 rounded-2xl border border-outline-variant space-y-3.5 text-xs">
            <div className="flex justify-between items-center py-1 pb-2 border-b border-outline-variant/65">
              <span className="text-on-surface-variant">Assigned Unit Space</span>
              <span className="font-extrabold text-on-surface">{unit?.unitCode || "B12"}</span>
            </div>
            <div className="flex justify-between items-center py-1 pb-2 border-b border-outline-variant/65">
              <span className="text-on-surface-variant">Monthly Rent Commitment</span>
              <span className="font-extrabold text-primary font-mono">KSh {draftLease.monthlyRent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-1 pb-2 border-b border-outline-variant/65">
              <span className="text-on-surface-variant">Refundable Security Deposit</span>
              <span className="font-bold text-on-surface font-mono">KSh {draftLease.securityDeposit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-1 pb-2">
              <span className="text-on-surface-variant">Tenancy Duration</span>
              <span className="font-bold text-on-surface">{draftLease.startDate} to {draftLease.endDate}</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-205 p-4 rounded-xl text-xs space-y-1 text-slate-600">
            <span className="font-bold uppercase text-[9px] font-mono text-slate-500">Legal Disclosures</span>
            <p className="leading-normal">
              By confirming below, you mutually sign your RentFlow electronic tenancy agreement, agreeing to clear invoices before the 5th of each calendar month.
            </p>
          </div>

          <button
            onClick={() => handleEsignLease(draftLease.id)}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover active:scale-95 transition-all text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <PenTool className="w-4 h-4" />
            E-Sign Lease Agreement
          </button>
        </section>
      </div>
    );
  }

  // Fallback if no lease exists whatsoever
  if (!activeLease) {
    return (
      <div className="py-16 text-center text-on-surface-variant space-y-4 max-w-md mx-auto">
        <Building className="w-14 h-14 opacity-25 mx-auto" />
        <h3 className="font-extrabold text-lg">No active lease linked to this tenant email.</h3>
        <p className="text-xs">
          Ask the Property Manager to register your invitation using your phone or email.
        </p>
      </div>
    );
  }

  const { unit, property } = getLeaseDetails(activeLease);

  // Suggested payment codes generator
  const triggerAutoFillRef = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "RFT";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code += "M";
    setPayRef(code);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Dynamic Billing Status Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Status Hero Widget */}
        <div className="lg:col-span-8 flat-card rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute -top-12 -right-12 text-primary opacity-5 transition-transform duration-500 group-hover:scale-110">
            <Building className="w-56 h-56" />
          </div>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded uppercase">
              Tenant Portal • Active Lease
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mt-3">
              {isRentPaid ? "June Rent Fully Settled" : "Pending June Statement Balance"}
            </h2>
            <p className="text-xs text-on-surface-variant font-medium mt-1 font-mono">
              {property?.name} • Room <span className="font-bold text-primary">{unit?.unitCode}</span>
            </p>

            <div className="my-6">
              <p className="text-[11px] font-bold font-mono text-on-surface-variant uppercase tracking-wider">Outstanding Statement Balance</p>
              <h3 className={`text-4xl font-extrabold mt-1 tracking-tight ${isRentPaid ? "text-primary" : "text-amber-800"}`}>
                KSh {outstandingRentAmount.toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3">
            <button
              onClick={() => {
                triggerAutoFillRef();
                setShowSubmitModal(true);
              }}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-sm"
            >
              <Wallet className="w-4 h-4" /> {isRentPaid ? "Submit Additional / Advance Payment" : "Submit Payment Receipt"}
            </button>

            <button
              onClick={() => {
                alert(`Direct Statement Generation Success: Rent Commitment settled: KSh ${totalVerifiedPaid.toLocaleString()}`);
              }}
              className="px-5 py-3 border border-outline-variant text-on-surface font-bold text-xs rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" /> Download Statement Ledger
            </button>
          </div>
        </div>

        {/* Quick Contacts */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flat-card rounded-2xl p-4 flex items-center gap-4 hover:border-primary/20">
            <div className="w-11 h-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              <Building className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Rental Space</p>
              <p className="text-sm font-extrabold text-on-surface mt-0.5">{property?.name || "Greenwood Apartments"}</p>
            </div>
          </div>

          <div className="flat-card rounded-2xl p-4 flex items-center gap-4 hover:border-primary/20">
            <div className="w-11 h-11 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center shrink-0">
              <Award className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Tenant Score</p>
              <p className="text-sm font-extrabold text-on-surface mt-0.5">Gold Class • Good Standing</p>
            </div>
          </div>

          <div className="flat-card rounded-2xl p-4 flex items-center gap-4 hover:border-primary/20">
            <div className="w-11 h-11 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
              <Headphones className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Support Concierge</p>
              <p className="text-sm font-extrabold text-on-surface mt-0.5">Help Desk Online • Chat</p>
            </div>
          </div>
        </div>
      </section>

      {/* Verification Ledger list */}
      <section className="space-y-4.5">
        <h3 className="text-base font-extrabold text-on-surface tracking-tight">Your Direct Payment Receipts Log</h3>

        <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-50">
              <tr className="border-b border-outline-variant">
                <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase">Submission Date</th>
                <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase text-right">Rent Paid</th>
                <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase text-center">Trans ID</th>
                <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase">Channel</th>
                <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase">Ledger Matching</th>
                <th className="px-6 py-3.5 text-center text-xs font-bold font-mono text-on-surface-variant uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {activeLeasePayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant text-xs">
                    No submitted payment receipts found. Use 'Submit Payment Receipts' above.
                  </td>
                </tr>
              ) : (
                activeLeasePayments.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-medium text-on-surface">
                      {pay.paymentDate}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-sm text-on-surface text-right">
                      KSh {pay.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs font-extrabold text-slate-700">
                      <div className="flex flex-col items-center gap-1">
                        <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
                          {pay.transactionCode}
                        </span>
                        {pay.receiptAttachment && (
                          <button
                            onClick={() => setActivePreviewReceipt(pay.receiptAttachment || null)}
                            className="text-[10px] text-emerald-600 font-mono font-bold hover:underline flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150"
                          >
                            <Paperclip className="w-3 h-3 text-emerald-500" /> View Slip
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-on-surface-variant">
                      {pay.paymentMethod}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold font-mono ${
                        pay.status === "Pending"
                          ? "bg-amber-50 text-amber-800 border-amber-250 animate-pulse"
                          : pay.status === "Verified"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-250"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}>
                        {pay.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          alert(`Simulating dynamic receipt generate: Download Receipt PDF for transaction ${pay.transactionCode} success.`);
                        }}
                        className="p-1 px-2 hover:bg-slate-100 text-primary font-bold text-xs rounded transition-all"
                        title="Download receipt PDF"
                      >
                        <Download className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Direct Payment Submit Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubmitModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
                <h3 className="font-extrabold text-base text-primary">Submit Ledger Verification receipt</h3>
                <button onClick={() => setShowSubmitModal(false)}>
                  <Plus className="w-5 h-5 rotate-45 text-on-surface-variant" />
                </button>
              </div>

              {feedback && (
                <div className="p-3 bg-primary/10 text-primary rounded-xl text-xs font-mono font-bold">
                  {feedback}
                </div>
              )}

              <form onSubmit={handlePaySubmit} className="space-y-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-205 flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant">June Rent Balance Due:</span>
                  <span className="font-mono font-extrabold text-primary text-sm">
                    KSh {outstandingRentAmount.toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono text-on-surface mb-1 uppercase">Payment Channel</label>
                  <select
                    value={selectedMethod}
                    onChange={e => setSelectedMethod(e.target.value as Payment["paymentMethod"])}
                    className="w-full px-3 py-2.5 bg-background-custom border border-outline-variant rounded-xl text-sm"
                  >
                    <option value="M-Pesa Paybill">M-Pesa Paybill (Business 488291)</option>
                    <option value="M-Pesa Buy Goods">M-Pesa Buy Goods (Till 59281)</option>
                    <option value="Bank Transfer">Cooperative Bank Transfer</option>
                    <option value="Bank Deposit">Cooperative Bank Cash Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono text-on-surface mb-1.5 uppercase">
                    Transaction Reference Code (e.g. M-Pesa Code)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. RK9023HL2"
                      value={payRef}
                      onChange={e => setPayRef(e.target.value.toUpperCase())}
                      className="flex-1 px-3.5 py-2.5 bg-background-custom border border-outline-variant rounded-xl text-sm font-mono font-bold uppercase transition-all focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={triggerAutoFillRef}
                      className="px-3.5 border border-outline-variant rounded-xl text-xs font-bold font-mono bg-slate-50 hover:bg-slate-100"
                    >
                      Autogen Code
                    </button>
                  </div>
                  <p className="text-[10px] text-on-surface-variant font-mono mt-1">
                    Provide the exact receipt reference code received from M-Pesa.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono text-on-surface mb-1 uppercase">Notes</label>
                  <textarea
                    placeholder="e.g. Cleared June rent for Greenwood Apartment Unit B12"
                    value={payNote}
                    onChange={e => setPayNote(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 bg-background-custom border border-outline-variant rounded-xl text-sm"
                  />
                </div>

                {/* Drag and Drop File Upload Area */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold font-mono text-on-surface uppercase">
                      Receipt Attachment / Voucher Slip
                    </label>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">
                      PDF, JPG, PNG (Max 5MB)
                    </span>
                  </div>

                  {!fileAttachment ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById("receipt-file-input")?.click()}
                      className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
                        isDragActive
                          ? "border-primary bg-primary/5 scale-[1.01]"
                          : "border-zinc-300 hover:border-primary hover:bg-slate-50"
                      }`}
                    >
                      <input
                        id="receipt-file-input"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Upload className="w-6 py-0.5 h-6 mx-auto text-zinc-400 mb-2" />
                      <p className="text-xs font-semibold text-zinc-700">
                        Drag &amp; drop receipt file, or <span className="text-primary hover:underline">browse files</span>
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                        Supports manual uploads
                      </p>

                      <div className="mt-3.5 pt-3 border-t border-dashed border-zinc-200 flex justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAttachMock();
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Simulate M-Pesa Ticket
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {fileAttachment.startsWith("data:image/") ? (
                          <img
                            src={fileAttachment}
                            alt="Receipt thumbnail"
                            className="w-10 h-10 object-cover rounded-lg border border-zinc-300 bg-white"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold font-mono text-xs">
                            DOC
                          </div>
                        )}
                        <div className="text-left min-w-0">
                          <p className="text-xs font-bold text-zinc-800 truncate leading-snug">
                            {fileName || "uploaded-receipt-file"}
                          </p>
                          <p className="text-[10px] text-emerald-600 font-bold font-mono">
                            Ready to transmit
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActivePreviewReceipt(fileAttachment)}
                          className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 rounded-lg transition-all"
                          title="Preview Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFileAttachment("");
                            setFileName("");
                          }}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-all"
                          title="Delete Attachment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1"
                >
                  Confirm Submission
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full-view Receipt Overlay Modal */}
      <AnimatePresence>
        {activePreviewReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePreviewReceipt(null)}
              className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-xl w-full bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-2xl overflow-hidden z-10 space-y-4 text-center"
            >
              <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                <span className="text-xs font-bold font-mono text-[#4CAF50] uppercase tracking-widest">
                  Secure Receipt Docket
                </span>
                <button
                  onClick={() => setActivePreviewReceipt(null)}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-auto rounded-xl flex justify-center items-center bg-zinc-950 p-4 border border-zinc-850">
                {activePreviewReceipt.startsWith("data:application/pdf") ? (
                  <div className="text-center py-12 text-zinc-400 space-y-2">
                    <FileText className="w-12 h-12 text-primary mx-auto opacity-75" />
                    <p className="text-sm font-bold">PDF Document Attachment</p>
                    <p className="text-xs">Secure digital ledger verification copy</p>
                  </div>
                ) : (
                  <img
                    src={activePreviewReceipt}
                    alt="Uploaded proof document full-view"
                    className="max-h-[60vh] object-contain rounded-lg"
                  />
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActivePreviewReceipt(null)}
                  className="px-4.5 py-2 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all"
                >
                  Dismiss Viewer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
