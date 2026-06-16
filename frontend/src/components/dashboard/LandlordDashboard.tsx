"use client";

import { Building, CreditCard, AlertTriangle, Users, Plus, MapPin, ChevronRight, CheckCircle, Inbox } from "lucide-react";
import type { DashboardSummary } from "@/types";

interface Props {
  summary: DashboardSummary;
}

export function LandlordDashboard({ summary }: Props) {
  const occupancyRate = summary.occupancy_rate;

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Welcome */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold font-mono tracking-widest text-primary uppercase mb-1">RentFlow Command</p>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Habari</h2>
          <p className="text-xs font-semibold text-on-surface-variant mt-0.5">Real-time rent reconciliation, tenancy log auditing, and collection operations.</p>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Expected Rent */}
        <div className="flat-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-44 h-44 bg-neutral-200/5 rounded-full blur-2xl transition-transform group-hover:scale-110 duration-500" />
          <div className="flex justify-between items-start mb-6 z-10">
            <div className="p-3 bg-primary/10 rounded-xl text-primary"><Building className="w-6 h-6" /></div>
            <span className="text-xs font-bold font-mono px-2.5 py-1 bg-surface-container rounded-full text-on-surface-variant">Target Cycle</span>
          </div>
          <div className="z-10">
            <p className="text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant">Expected Rent (Leases)</p>
            <h3 className="text-3xl font-extrabold text-on-surface tracking-tight mt-1">KSh {summary.expected_rent.toLocaleString()}</h3>
          </div>
        </div>

        {/* Collected Rent */}
        <div className={`flat-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group ${summary.collected_rent > 0 ? "border-primary/20 bg-primary/[0.01]" : ""}`}>
          <div className="flex justify-between items-start mb-6 z-10 border-b border-outline-variant/10 pb-3">
            <div className="p-3 bg-emerald-100 rounded-xl text-primary"><CreditCard className="w-6 h-6" /></div>
            {summary.collected_rent > 0 && summary.expected_rent > 0 && (
              <span className="text-xs font-bold font-mono px-3 py-1 bg-primary/10 text-primary rounded-full">
                {Math.round((summary.collected_rent / summary.expected_rent) * 100)}% collected
              </span>
            )}
          </div>
          <div className="z-10">
            <p className="text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant">Collected Rent (Verified)</p>
            <h3 className="text-3xl font-extrabold text-primary tracking-tight mt-1">KSh {summary.collected_rent.toLocaleString()}</h3>
          </div>
        </div>

        {/* Outstanding */}
        <div className="flat-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6 border-b border-outline-variant/10 pb-3">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-800"><AlertTriangle className="w-6 h-6" /></div>
          </div>
          <div>
            <p className="text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant">Outstanding Balance</p>
            <h3 className={`text-3xl font-extrabold tracking-tight mt-1 ${summary.outstanding_rent > 0 ? "text-amber-800" : "text-on-surface"}`}>
              KSh {summary.outstanding_rent.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Occupancy */}
        <div className="flat-card rounded-2xl p-6 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-6 border-b border-outline-variant/10 pb-3">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-700"><Users className="w-6 h-6" /></div>
            <span className="text-xs font-bold font-mono px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">{occupancyRate}%</span>
          </div>
          <div>
            <p className="text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant">Occupancy Rate</p>
            <h3 className="text-3xl font-extrabold text-on-surface tracking-tight mt-1">
              {summary.occupied_units} <span className="text-on-surface-variant font-normal text-md">/ {summary.total_units} Units</span>
            </h3>
            <div className="w-full bg-surface-container rounded-full h-1 mt-3">
              <div className="bg-indigo-600 h-1 rounded-full transition-all duration-700" style={{ width: `${occupancyRate || 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payments Alert */}
      {summary.pending_payments > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-800 shrink-0">
              <Inbox className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-amber-850">Outstanding Payment Verification items</p>
              <p className="text-xs text-amber-700">There are <span className="font-bold">{summary.pending_payments} pending</span> tenant receipt submissions waiting for matching audits.</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-amber-800 text-white hover:bg-amber-900 rounded-xl font-bold text-xs shrink-0 transition-all active:scale-95 shadow-sm">
            Review Queue
          </button>
        </div>
      )}

      {/* Properties Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-extrabold tracking-tight text-on-surface">Portfolio Overview</h4>
          </div>
          <div className="flat-card rounded-2xl p-6 text-center">
            <Building className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-on-surface-variant">Properties: {summary.total_properties}</p>
<p className="text-xs text-on-surface-variant mt-1">Total Units: {summary.total_units} | Vacant: {summary.vacant_units}</p>
          </div>
        </div>

        {/* Activity Stream */}
        <div className="flat-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-base font-extrabold tracking-tight mb-5">Tenant Event Streams</h4>
            <div className="space-y-5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1 text-left">
              <p className="text-xs font-mono text-on-surface-variant text-center py-6">No recent action streams logging.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
