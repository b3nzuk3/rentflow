"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Building, CreditCard, FileText, Clock, CheckCircle, AlertTriangle, Home,
  Plus, X, ChevronRight,
} from "lucide-react";
import { api, createPayment, getRentSchedule } from "@/lib/api";
import type { Tenant, Payment, RentSchedule } from "@/types";

interface LeaseData {
  lease: {
    id: string;
    monthly_rent: number;
    security_deposit: number;
    start_date: string;
    end_date: string;
    status: string;
  };
  unit: {
    id: string;
    unit_code: string;
    rent_amount: number;
    status: string;
  } | null;
  property: {
    id: string;
    name: string;
    location: string;
  } | null;
}

type PaymentMethod = "M-Pesa Paybill" | "M-Pesa Buy Goods" | "Bank Transfer" | "Bank Deposit" | "Cash";
type PaymentType = "Monthly Rent" | "Advance Payment" | "Arrears" | "Partial Payment" | "Security Deposit";

const PAYMENT_METHODS: PaymentMethod[] = [
  "M-Pesa Paybill", "M-Pesa Buy Goods", "Bank Transfer", "Bank Deposit", "Cash",
];

function formatPeriod(period: string): string {
  // "2026-01" → "January 2026"
  try {
    const [year, month] = period.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return period;
  }
}

export function TenantDashboard() {
  const [profile, setProfile] = useState<Tenant | null>(null);
  const [leases, setLeases] = useState<LeaseData[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schedule, setSchedule] = useState<RentSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("M-Pesa Paybill");
  const [paymentType, setPaymentType] = useState<PaymentType>("Monthly Rent");
  const [transactionCode, setTransactionCode] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [profileRes, leasesRes, paymentsRes] = await Promise.all([
        api.get("/tenants/me"),
        api.get("/tenants/me/leases"),
        api.get("/tenants/me/payments"),
      ]);
      setProfile(profileRes.data);
      setLeases(leasesRes.data);
      setPayments(paymentsRes.data);

      // Load rent schedule for active lease
      if (leasesRes.data.length > 0) {
        const leaseId = leasesRes.data[0].lease.id;
        try {
          const scheduleRes = await getRentSchedule(leaseId);
          setSchedule(scheduleRes || []);
        } catch {
          // Schedule might not exist yet
        }
      }
    } catch (err) {
      console.error("Failed to load tenant data:", err);
    } finally {
      setLoading(false);
    }
  }

  const activeLease = leases[0];
  const totalPaid = payments.filter((p) => p.status === "Verified").reduce((s, p) => s + p.amount, 0);
  const pendingPayments = payments.filter((p) => p.status === "Pending");

  // Build period options from schedule + allow future months
  const periodOptions = useMemo(() => {
    const options: { period: string; label: string; status: string; balance: number; expected: number }[] = [];

    // Add scheduled periods
    for (const s of schedule) {
      options.push({
        period: s.billing_period,
        label: formatPeriod(s.billing_period),
        status: s.status,
        balance: s.balance,
        expected: s.expected_amount,
      });
    }

    // If no schedule, generate from lease start
    if (options.length === 0 && activeLease) {
      const start = new Date(activeLease.lease.start_date);
      const now = new Date();
      const current = new Date(start);
      while (current <= now) {
        const period = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
        // Check if already in options
        if (!options.find((o) => o.period === period)) {
          // Check if there's a payment for this period
          const periodPayments = payments.filter(
            (p) => p.billing_period === period && p.status === "Verified"
          );
          const paid = periodPayments.reduce((s, p) => s + p.amount, 0);
          const expected = activeLease.lease.monthly_rent;
          options.push({
            period,
            label: formatPeriod(period),
            status: paid >= expected ? "Paid" : paid > 0 ? "Partial" : "Pending",
            balance: expected - paid,
            expected,
          });
        }
        current.setMonth(current.getMonth() + 1);
      }
    }

    // Allow one future month for advance payment
    if (activeLease) {
      const lastPeriod = options.length > 0 ? options[options.length - 1].period : null;
      if (lastPeriod) {
        const [y, m] = lastPeriod.split("-").map(Number);
        const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
        options.push({
          period: nextMonth,
          label: `${formatPeriod(nextMonth)} (Advance)`,
          status: "Future",
          balance: activeLease.lease.monthly_rent,
          expected: activeLease.lease.monthly_rent,
        });
      }
    }

    return options;
  }, [schedule, payments, activeLease]);

  const selectedPeriodData = periodOptions.find((p) => p.period === selectedPeriod);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLease) { setPaymentError("No active lease found."); return; }
    if (!selectedPeriod) { setPaymentError("Please select a payment period."); return; }
    if (!paymentAmount || !transactionCode || !paymentDate) {
      setPaymentError("Please fill in all required fields.");
      return;
    }

    // Determine payment type based on amount vs expected
    const expected = selectedPeriodData?.expected || activeLease.lease.monthly_rent;
    let computedType = paymentType;
    if (paymentType === "Monthly Rent" && parseFloat(paymentAmount) > expected) {
      computedType = "Advance Payment";
    } else if (paymentType === "Monthly Rent" && parseFloat(paymentAmount) < expected) {
      computedType = "Partial Payment";
    }

    setSubmittingPayment(true);
    setPaymentError(null);
    try {
      await createPayment({
        lease_id: activeLease.lease.id,
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        transaction_code: transactionCode,
        payment_date: paymentDate,
        verification_notes: paymentNotes || undefined,
        payment_type: computedType,
        billing_period: selectedPeriod,
      });
      setPaymentSuccess(true);
      // Reload data
      const [paymentsRes, scheduleRes] = await Promise.all([
        api.get("/tenants/me/payments"),
        getRentSchedule(activeLease.lease.id).catch(() => []),
      ]);
      setPayments(paymentsRes.data);
      setSchedule(scheduleRes || []);
      setTimeout(() => {
        setShowPaymentForm(false);
        setPaymentSuccess(false);
        setPaymentAmount("");
        setTransactionCode("");
        setPaymentDate("");
        setPaymentNotes("");
        setPaymentMethod("M-Pesa Paybill");
        setPaymentType("Monthly Rent");
        setSelectedPeriod("");
      }, 2500);
    } catch (err: any) {
      setPaymentError(err.response?.data?.detail || "Failed to submit payment.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div>
        <p className="text-xs font-bold font-mono tracking-widest text-primary uppercase mb-1">Tenant Portal</p>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Welcome, {profile?.first_name}</h2>
        <p className="text-sm text-on-surface-variant mt-1">Manage your lease, payments, and rent status.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="flat-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><CreditCard className="w-5 h-5" /></div>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-surface-container rounded-full text-on-surface-variant">Monthly</span>
          </div>
          <p className="text-[10px] font-bold font-mono uppercase tracking-wider text-on-surface-variant">Monthly Rent</p>
          <h3 className="text-2xl font-extrabold text-on-surface tracking-tight mt-0.5">
            KSh {activeLease?.lease.monthly_rent.toLocaleString() ?? "—"}
          </h3>
        </div>

        <div className="flat-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700"><CheckCircle className="w-5 h-5" /></div>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">Verified</span>
          </div>
          <p className="text-[10px] font-bold font-mono uppercase tracking-wider text-on-surface-variant">Total Paid</p>
          <h3 className="text-2xl font-extrabold text-emerald-700 tracking-tight mt-0.5">KSh {totalPaid.toLocaleString()}</h3>
        </div>

        <div className="flat-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700"><Clock className="w-5 h-5" /></div>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">{pendingPayments.length} Pending</span>
          </div>
          <p className="text-[10px] font-bold font-mono uppercase tracking-wider text-on-surface-variant">Pending Payments</p>
          <h3 className="text-2xl font-extrabold text-amber-700 tracking-tight mt-0.5">
            KSh {pendingPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Rent Schedule / Pay Periods */}
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-extrabold tracking-tight text-on-surface">Rent Schedule</h4>
            {!showPaymentForm && activeLease && (
              <button
                onClick={() => {
                  setShowPaymentForm(true);
                  setPaymentSuccess(false);
                  setPaymentError(null);
                  // Select first unpaid period
                  const unpaid = periodOptions.find((p) => p.status !== "Paid");
                  if (unpaid) {
                    setSelectedPeriod(unpaid.period);
                    setPaymentAmount(String(unpaid.balance > 0 ? unpaid.balance : unpaid.expected));
                  }
                  setPaymentDate(new Date().toISOString().split("T")[0]);
                }}
                className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-primary-hover transition-all active:scale-95 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Submit Rent Payment
              </button>
            )}
          </div>

          {/* Payment Form Modal */}
          {showPaymentForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowPaymentForm(false); setPaymentSuccess(false); setPaymentError(null); }} />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold tracking-tight text-on-surface">Submit Rent Payment</h3>
                  <button onClick={() => { setShowPaymentForm(false); setPaymentSuccess(false); setPaymentError(null); }} className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {paymentSuccess ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-emerald-700">Payment Submitted Successfully!</p>
                        <p className="text-xs text-emerald-600 mt-1">Your payment is pending verification by the property manager.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitPayment} className="space-y-4">
                    {activeLease && (
                      <div className="bg-surface-container rounded-xl p-3.5 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                          <Home className="w-3.5 h-3.5 text-primary" />
                          <span className="font-bold text-on-surface">{activeLease.unit?.unit_code} — {activeLease.property?.name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-on-surface-variant">
                          Rent: KSh {activeLease.lease.monthly_rent.toLocaleString()}/mo · Deposit: KSh {activeLease.lease.security_deposit.toLocaleString()}
                        </div>
                      </div>
                    )}

                    {paymentError && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-red-700">{paymentError}</p>
                      </div>
                    )}

                    {/* Period selector */}
                    <div>
                      <label className="block text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">Payment Period *</label>
                      <select
                        value={selectedPeriod}
                        onChange={(e) => {
                          setSelectedPeriod(e.target.value);
                          const period = periodOptions.find((p) => p.period === e.target.value);
                          if (period) {
                            setPaymentAmount(String(period.balance > 0 ? period.balance : period.expected));
                            if (period.status === "Future") setPaymentType("Advance Payment");
                            else if (period.status === "Partial") setPaymentType("Monthly Rent");
                            else setPaymentType("Monthly Rent");
                          }
                        }}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      >
                        <option value="">Select period...</option>
                        {periodOptions.map((p) => (
                          <option key={p.period} value={p.period} disabled={p.status === "Paid"}>
                            {p.label} — {p.status === "Paid" ? "✓ Paid" : p.status === "Future" ? "Advance" : `Balance: KSh ${p.balance.toLocaleString()}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">Amount (KSh) *</label>
                        <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">Payment Method *</label>
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
                          {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">Transaction Code *</label>
                      <input type="text" value={transactionCode} onChange={(e) => setTransactionCode(e.target.value.toUpperCase())} placeholder="e.g. QK92MPL8R" required className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container/30 text-sm font-mono font-medium uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                      <p className="text-[10px] text-on-surface-variant mt-1">Enter the M-Pesa/Bank transaction reference code</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">Payment Date *</label>
                      <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">Notes (Optional)</label>
                      <textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows={2} placeholder="Any additional notes..." className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container/30 text-sm font-medium placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none" />
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={() => { setShowPaymentForm(false); setPaymentError(null); }} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant border border-outline-variant hover:bg-surface-container transition-colors">Cancel</button>
                      <button type="submit" disabled={submittingPayment} className="flex-1 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                        {submittingPayment ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>) : (<>Submit Payment</>)}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Schedule table */}
          {periodOptions.length > 0 ? (
            <div className="flat-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container/50 border-b border-outline-variant/10">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider">Period</th>
                      <th className="px-4 py-3 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider text-right">Expected</th>
                      <th className="px-4 py-3 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider text-right">Paid</th>
                      <th className="px-4 py-3 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider text-right">Balance</th>
                      <th className="px-4 py-3 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider text-center">Status</th>
                      <th className="px-4 py-3 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {periodOptions.map((p) => (
                      <tr key={p.period} className="hover:bg-surface-container/30 transition-colors">
                        <td className="px-4 py-3 text-xs font-semibold text-on-surface">{p.label}</td>
                        <td className="px-4 py-3 text-xs font-mono text-on-surface-variant text-right">KSh {p.expected.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs font-mono text-on-surface-variant text-right">
                          {p.status === "Paid" || p.status === "Partial" ? `KSh ${(p.expected - p.balance).toLocaleString()}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-right">
                          <span className={p.balance <= 0 ? "text-emerald-600" : "text-amber-600"}>
                            {p.balance <= 0 ? "KSh 0" : `KSh ${p.balance.toLocaleString()}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                            p.status === "Paid" ? "bg-emerald-50 text-emerald-700" :
                            p.status === "Partial" ? "bg-blue-50 text-blue-700" :
                            p.status === "Future" ? "bg-slate-100 text-slate-600" :
                            "bg-amber-50 text-amber-700"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.status !== "Paid" && (
                            <button
                              onClick={() => {
                                setShowPaymentForm(true);
                                setPaymentSuccess(false);
                                setPaymentError(null);
                                setSelectedPeriod(p.period);
                                setPaymentAmount(String(p.balance > 0 ? p.balance : p.expected));
                                setPaymentDate(new Date().toISOString().split("T")[0]);
                                if (p.status === "Future") setPaymentType("Advance Payment");
                              }}
                              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 ml-auto"
                            >
                              Pay <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flat-card rounded-2xl p-6 text-center">
              <p className="text-sm font-bold text-on-surface-variant">No rent schedule available yet.</p>
            </div>
          )}

          {/* Lease Details */}
          <h4 className="text-lg font-extrabold tracking-tight text-on-surface">My Lease</h4>
          {activeLease ? (
            <div className="flat-card rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-xl" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1"><Home className="w-4 h-4 text-primary" /><h5 className="text-base font-extrabold text-on-surface">{activeLease.property?.name}</h5></div>
                    <p className="text-xs text-on-surface-variant">{activeLease.property?.location}</p>
                  </div>
                  <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full ${activeLease.lease.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {activeLease.lease.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-surface-container/50 rounded-xl p-3"><p className="text-[9px] font-bold font-mono uppercase text-on-surface-variant">Unit</p><p className="text-sm font-extrabold text-on-surface mt-0.5">{activeLease.unit?.unit_code}</p></div>
                  <div className="bg-surface-container/50 rounded-xl p-3"><p className="text-[9px] font-bold font-mono uppercase text-on-surface-variant">Rent</p><p className="text-sm font-extrabold text-on-surface mt-0.5">KSh {activeLease.lease.monthly_rent.toLocaleString()}</p></div>
                  <div className="bg-surface-container/50 rounded-xl p-3"><p className="text-[9px] font-bold font-mono uppercase text-on-surface-variant">Start</p><p className="text-sm font-extrabold text-on-surface mt-0.5">{activeLease.lease.start_date}</p></div>
                  <div className="bg-surface-container/50 rounded-xl p-3"><p className="text-[9px] font-bold font-mono uppercase text-on-surface-variant">End</p><p className="text-sm font-extrabold text-on-surface mt-0.5">{activeLease.lease.end_date}</p></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flat-card rounded-2xl p-6 text-center"><p className="text-sm font-bold text-on-surface-variant">No active lease found</p></div>
          )}

          {/* Payment History */}
          <h4 className="text-lg font-extrabold tracking-tight text-on-surface">Payment History</h4>
          {payments.length === 0 ? (
            <div className="flat-card rounded-2xl p-6 text-center"><p className="text-sm font-bold text-on-surface-variant">No payments yet. Submit your first rent payment above.</p></div>
          ) : (
            <div className="flat-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container/50 border-b border-outline-variant/10">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider">Period</th>
                      <th className="px-4 py-3 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider">Method</th>
                      <th className="px-4 py-3 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider">Reference</th>
                      <th className="px-4 py-3 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider text-right">Amount</th>
                      <th className="px-4 py-3 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-container/30 transition-colors">
                        <td className="px-4 py-3 text-xs font-semibold text-on-surface">{p.billing_period ? formatPeriod(p.billing_period) : "—"}</td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant">{p.payment_date}</td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant">{p.payment_method}</td>
                        <td className="px-4 py-3 text-xs font-mono text-on-surface-variant">{p.transaction_code}</td>
                        <td className="px-4 py-3 text-xs font-bold text-on-surface text-right">KSh {p.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                            p.status === "Verified" ? "bg-emerald-50 text-emerald-700" : p.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                          }`}>{p.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="flat-card rounded-2xl p-5">
            <h5 className="text-sm font-extrabold text-on-surface mb-3">My Details</h5>
            <div className="space-y-2.5">
              <div className="flex justify-between"><span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Name</span><span className="text-xs font-semibold text-on-surface">{profile?.first_name} {profile?.last_name}</span></div>
              <div className="flex justify-between"><span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Email</span><span className="text-xs font-semibold text-on-surface truncate ml-2">{profile?.email}</span></div>
              <div className="flex justify-between"><span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Phone</span><span className="text-xs font-semibold text-on-surface">{profile?.phone_number}</span></div>
              <div className="flex justify-between"><span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Status</span><span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${profile?.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{profile?.status}</span></div>
            </div>
          </div>
          {activeLease?.property && (
            <div className="flat-card rounded-2xl p-5">
              <h5 className="text-sm font-extrabold text-on-surface mb-3">Property Info</h5>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2"><Building className="w-4 h-4 text-primary shrink-0" /><span className="text-xs font-semibold text-on-surface">{activeLease.property.name}</span></div>
                <div className="flex items-center gap-2"><Home className="w-4 h-4 text-on-surface-variant shrink-0" /><span className="text-xs text-on-surface-variant">{activeLease.unit?.unit_code} · {activeLease.property.location}</span></div>
              </div>
            </div>
          )}
          {pendingPayments.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-amber-700" /><p className="text-xs font-extrabold text-amber-800">Pending Verification</p></div>
              <p className="text-[11px] text-amber-700">{pendingPayments.length} payment{pendingPayments.length !== 1 ? "s" : ""} awaiting landlord verification.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
