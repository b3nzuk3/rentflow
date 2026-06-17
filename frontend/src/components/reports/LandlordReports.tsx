"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Property, Unit, Lease, Payment } from "@/types";

interface PropertyReport {
  name: string;
  location: string;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  targetRent: number;
  collectedRent: number;
  outstandingRent: number;
  percent: number;
}

export function LandlordReports() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [propsRes, unitsRes, leasesRes, paymentsRes] = await Promise.all([
        api.get("/properties"),
        api.get("/units"),
        api.get("/leases"),
        api.get("/payments"),
      ]);
      setProperties(propsRes.data);
      setUnits(unitsRes.data);
      setLeases(leasesRes.data);
      setPayments(paymentsRes.data);
    } catch (err) {
      console.error("Failed to load reports data", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate aggregated stats
  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.status === "Occupied").length;
  const vacantUnits = units.filter(u => u.status === "Vacant").length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const activeLeases = leases.filter(l => l.status === "Active");
  const expectedRent = activeLeases.reduce((sum, l) => sum + l.monthly_rent, 0);

  const verifiedPayments = payments.filter(p => p.status === "Verified");
  const collectedRent = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);
  const outstandingRent = Math.max(0, expectedRent - collectedRent);

  // Per-property breakdown
  const propertyReports: PropertyReport[] = properties.map(prop => {
    const propUnits = units.filter(u => u.property_id === prop.id);
    const propLeases = activeLeases.filter(l => propUnits.some(u => u.id === l.unit_id));
    const propPayments = verifiedPayments.filter(p => propLeases.some(l => l.id === p.lease_id));
    const target = propLeases.reduce((s, l) => s + l.monthly_rent, 0);
    const collected = propPayments.reduce((s, p) => s + p.amount, 0);
    return {
      name: prop.name,
      location: prop.location,
      totalUnits: propUnits.length,
      occupiedUnits: propUnits.filter(u => u.status === "Occupied").length,
      vacantUnits: propUnits.filter(u => u.status === "Vacant").length,
      targetRent: target,
      collectedRent: collected,
      outstandingRent: Math.max(0, target - collected),
      percent: target > 0 ? Math.round((collected / target) * 100) : 0,
    };
  });

  const handleExportCSV = () => {
    let csv = "Property Name,Total Units,Occupied,Vacant,Collected Rent,Outstanding Rent\n";
    propertyReports.forEach(p => {
      csv += `"${p.name}",${p.totalUnits},${p.occupiedUnits},${p.vacantUnits},${p.collectedRent},${p.outstandingRent}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rentflow_portfolio_report.csv";
    a.click();
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
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Financial & Occupancy Reports</h2>
          <p className="text-on-surface-variant font-medium mt-1">Download collection, vacancy rates, and rent reconciliation reports.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="px-5 py-3 border border-outline-variant rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-1.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export CSV
          </button>
          <button className="px-5 py-3 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-hover transition-all flex items-center gap-1.5 shadow-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Print PDF
          </button>
        </div>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Collection Efficiency */}
        <div className="flat-card p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center text-xs font-bold font-mono">
            <span className="text-slate-500 uppercase">Collection Efficiency</span>
            <span className="text-primary font-extrabold">{expectedRent > 0 ? Math.round((collectedRent / expectedRent) * 100) : 0}%</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-2xl font-extrabold text-on-surface tracking-tight">KSh {collectedRent.toLocaleString()}</h4>
            <p className="text-[10px] text-zinc-400 font-mono">Matched & settled collections</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${expectedRent > 0 ? (collectedRent / expectedRent) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Occupancy */}
        <div className="flat-card p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center text-xs font-bold font-mono">
            <span className="text-slate-500 uppercase">Occupancy Distribution</span>
            <span className="text-indigo-700 font-extrabold">{occupancyRate}%</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-2xl font-extrabold text-on-surface tracking-tight">{occupiedUnits} Occupied</h4>
            <p className="text-[10px] text-rose-600 font-mono font-bold">↳ {vacantUnits} Vacant Units</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${occupancyRate}%` }} />
          </div>
        </div>

        {/* Outstanding */}
        <div className="flat-card p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center text-xs font-bold font-mono">
            <span className="text-slate-500 uppercase">Outstanding Balance</span>
            <span className="text-rose-600 font-extrabold">{expectedRent > 0 ? Math.round((outstandingRent / expectedRent) * 100) : 0}% Due</span>
          </div>
          <div className="space-y-2">
            <h4 className="text-2xl font-extrabold text-amber-800 tracking-tight">KSh {outstandingRent.toLocaleString()}</h4>
            <p className="text-[10px] text-zinc-400 font-mono">Overdue, uncollected balances</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${expectedRent > 0 ? (outstandingRent / expectedRent) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Property Breakdown */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm p-6 space-y-5">
        <h3 className="text-base font-extrabold tracking-tight text-on-surface flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
          Collection Efficiency Breakdown
        </h3>

        {propertyReports.length === 0 ? (
          <p className="text-xs text-on-surface-variant font-mono">No properties to report on.</p>
        ) : (
          <div className="space-y-4 pt-1">
            {propertyReports.map((p, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold leading-none">
                  <span className="text-on-surface text-sm font-bold">{p.name} ({p.location})</span>
                  <span className="text-on-surface-variant font-mono text-[11px]">
                    KSh {p.collectedRent.toLocaleString()} / KSh {p.targetRent.toLocaleString()} Target
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                  <div className="bg-primary h-full transition-all duration-500" style={{ width: `${p.percent}%` }} />
                  <div className="bg-amber-100 h-full transition-all duration-500 flex-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
