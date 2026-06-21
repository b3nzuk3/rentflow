"use client";

import { useEffect, useState } from "react";
import { Building, CreditCard, FileText, Clock, CheckCircle, AlertTriangle, Home } from "lucide-react";
import { api } from "@/lib/api";
import type { Tenant } from "@/types";

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

interface PaymentData {
  id: string;
  amount: number;
  payment_method: string;
  transaction_code: string;
  payment_date: string;
  status: string;
  created_at: string;
}

export function TenantDashboard() {
  const [profile, setProfile] = useState<Tenant | null>(null);
  const [leases, setLeases] = useState<LeaseData[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, leasesRes, paymentsRes] = await Promise.all([
          api.get("/tenants/me"),
          api.get("/tenants/me/leases"),
          api.get("/tenants/me/payments"),
        ]);
        setProfile(profileRes.data);
        setLeases(leasesRes.data);
        setPayments(paymentsRes.data);
      } catch (err) {
        console.error("Failed to load tenant data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalPaid = payments.filter((p) => p.status === "Verified").reduce((s, p) => s + p.amount, 0);
  const pendingPayments = payments.filter((p) => p.status === "Pending");
  const activeLease = leases[0];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div>
        <p className="text-xs font-bold font-mono tracking-widest text-primary uppercase mb-1">Tenant Portal</p>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">
          Welcome, {profile?.first_name}
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">Manage your lease, payments, and rent status.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Monthly Rent */}
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

        {/* Total Paid */}
        <div className="flat-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700"><CheckCircle className="w-5 h-5" /></div>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">Verified</span>
          </div>
          <p className="text-[10px] font-bold font-mono uppercase tracking-wider text-on-surface-variant">Total Paid</p>
          <h3 className="text-2xl font-extrabold text-emerald-700 tracking-tight mt-0.5">KSh {totalPaid.toLocaleString()}</h3>
        </div>

        {/* Pending */}
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
        {/* Lease Details */}
        <div className="lg:col-span-2 space-y-5">
          <h4 className="text-lg font-extrabold tracking-tight text-on-surface">My Lease</h4>
          {activeLease ? (
            <div className="flat-card rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-xl" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="w-4 h-4 text-primary" />
                      <h5 className="text-base font-extrabold text-on-surface">{activeLease.property?.name}</h5>
                    </div>
                    <p className="text-xs text-on-surface-variant">{activeLease.property?.location}</p>
                  </div>
                  <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full ${
                    activeLease.lease.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {activeLease.lease.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-surface-container/50 rounded-xl p-3">
                    <p className="text-[9px] font-bold font-mono uppercase text-on-surface-variant">Unit</p>
                    <p className="text-sm font-extrabold text-on-surface mt-0.5">{activeLease.unit?.unit_code}</p>
                  </div>
                  <div className="bg-surface-container/50 rounded-xl p-3">
                    <p className="text-[9px] font-bold font-mono uppercase text-on-surface-variant">Rent</p>
                    <p className="text-sm font-extrabold text-on-surface mt-0.5">KSh {activeLease.lease.monthly_rent.toLocaleString()}</p>
                  </div>
                  <div className="bg-surface-container/50 rounded-xl p-3">
                    <p className="text-[9px] font-bold font-mono uppercase text-on-surface-variant">Start</p>
                    <p className="text-sm font-extrabold text-on-surface mt-0.5">{activeLease.lease.start_date}</p>
                  </div>
                  <div className="bg-surface-container/50 rounded-xl p-3">
                    <p className="text-[9px] font-bold font-mono uppercase text-on-surface-variant">End</p>
                    <p className="text-sm font-extrabold text-on-surface mt-0.5">{activeLease.lease.end_date}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-on-surface-variant" />
                    <span className="text-xs text-on-surface-variant">Security Deposit: <span className="font-bold text-on-surface">KSh {activeLease.lease.security_deposit.toLocaleString()}</span></span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flat-card rounded-2xl p-6 text-center">
              <p className="text-sm font-bold text-on-surface-variant">No active lease found</p>
            </div>
          )}

          {/* Payment History */}
          <h4 className="text-lg font-extrabold tracking-tight text-on-surface">Payment History</h4>
          {payments.length === 0 ? (
            <div className="flat-card rounded-2xl p-6 text-center">
              <p className="text-sm font-bold text-on-surface-variant">No payments yet</p>
            </div>
          ) : (
            <div className="flat-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container/50 border-b border-outline-variant/10">
                    <tr>
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
                        <td className="px-4 py-3 text-xs font-semibold text-on-surface">{p.payment_date}</td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant">{p.payment_method}</td>
                        <td className="px-4 py-3 text-xs font-mono text-on-surface-variant">{p.transaction_code}</td>
                        <td className="px-4 py-3 text-xs font-bold text-on-surface text-right">KSh {p.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                            p.status === "Verified" ? "bg-emerald-50 text-emerald-700" :
                            p.status === "Pending" ? "bg-amber-50 text-amber-700" :
                            "bg-red-50 text-red-700"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="flat-card rounded-2xl p-5">
            <h5 className="text-sm font-extrabold text-on-surface mb-3">My Details</h5>
            <div className="space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Name</span>
                <span className="text-xs font-semibold text-on-surface">{profile?.first_name} {profile?.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Email</span>
                <span className="text-xs font-semibold text-on-surface truncate ml-2">{profile?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Phone</span>
                <span className="text-xs font-semibold text-on-surface">{profile?.phone_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">National ID</span>
                <span className="text-xs font-semibold text-on-surface">{profile?.national_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Status</span>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                  profile?.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {profile?.status}
                </span>
              </div>
            </div>
          </div>

          {activeLease?.property && (
            <div className="flat-card rounded-2xl p-5">
              <h5 className="text-sm font-extrabold text-on-surface mb-3">Property Info</h5>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-on-surface">{activeLease.property.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-on-surface-variant shrink-0" />
                  <span className="text-xs text-on-surface-variant">{activeLease.unit?.unit_code} · {activeLease.property.location}</span>
                </div>
              </div>
            </div>
          )}

          {pendingPayments.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <p className="text-xs font-extrabold text-amber-800">Pending Verification</p>
              </div>
              <p className="text-[11px] text-amber-700">
                {pendingPayments.length} payment{pendingPayments.length !== 1 ? "s" : ""} awaiting landlord verification.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
