/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Download, FileText, CheckCircle, AlertTriangle, TrendingUp, RefreshCw, BarChart, FileCheck } from "lucide-react";
import { Property, Payment, Unit, Lease, Organization } from "../types";

interface LandlordReportsProps {
  organization: Organization;
  properties: Property[];
  units: Unit[];
  leases: Lease[];
  payments: Payment[];
}

export const LandlordReports: React.FC<LandlordReportsProps> = ({
  organization,
  properties,
  units,
  leases,
  payments,
}) => {
  const orgProperties = properties.filter(p => p.organizationId === organization.id);
  const orgUnits = units.filter(u => u.organizationId === organization.id);
  const orgLeases = leases.filter(l => l.organizationId === organization.id && l.status === "Active");
  const orgPayments = payments.filter(p => p.organizationId === organization.id);

  // Dynamic values
  const totalUnits = orgUnits.length;
  const occupiedUnits = orgUnits.filter(u => u.status === "Occupied").length;
  const vacantUnits = orgUnits.filter(u => u.status === "Vacant").length;
  const targetRent = orgLeases.reduce((sum, l) => sum + l.monthlyRent, 0);

  const verifiedPayments = orgPayments.filter(p => p.status === "Verified");
  const verifiedRent = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = orgPayments.filter(p => p.status === "Pending");
  const pendingRent = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const outstandingRent = Math.max(0, targetRent - verifiedRent);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Property Name,Total Units,Occupied,Vacant,Collected Rent,Outstanding Rent\n";

    orgProperties.forEach(p => {
      const pUnits = orgUnits.filter(u => u.propertyId === p.id);
      const pOccupied = pUnits.filter(u => u.status === "Occupied").length;
      const pVacant = pUnits.filter(u => u.status === "Vacant").length;
      
      const pLeases = orgLeases.filter(l => pUnits.map(u => u.id).includes(l.unitId));
      const pTarget = pLeases.reduce((s, l) => s + l.monthlyRent, 0);

      const pPayments = orgPayments.filter(pay => pay.status === "Verified" && pLeases.map(l => l.id).includes(pay.leaseId));
      const pCollected = pPayments.reduce((s, pay) => s + pay.amount, 0);
      const pOutstanding = Math.max(0, pTarget - pCollected);

      csvContent += `"${p.name}",${pUnits.length},${pOccupied},${pVacant},${pCollected},${pOutstanding}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${organization.id}_rentflow_portfolio_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDFSimulated = () => {
    alert(`Generating high-fidelity PDF invoice receipt & matching balances ledger...\n\nTenant isolated scope: ${organization.name}\nExported: ${orgProperties.length} Properties, ${totalUnits} Units, ${verifiedPayments.length} verified transactions.\n\nFile downloaded successfully.`);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Title */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Financial &amp; Occupancy Reports</h2>
          <p className="text-on-surface-variant font-medium mt-1">
            Download print-ready collection, vacancy rates, and rent reconciliation report cards.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="px-5 py-3 border border-outline-variant rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export CSV Record
          </button>
          <button
            onClick={handleExportPDFSimulated}
            className="px-5 py-3 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-hover transition-all flex items-center gap-1.5 shadow-sm"
          >
            <FileText className="w-4 h-4" /> Print PDF Ledger
          </button>
        </div>
      </section>

      {/* Grid of Report summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Collection stats card */}
        <div className="flat-card p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center text-xs font-bold font-mono">
            <span className="text-slate-500 uppercase">Collection Efficiency</span>
            <span className="text-primary font-extrabold">{targetRent > 0 ? Math.round((verifiedRent / targetRent) * 100) : 0}%</span>
          </div>

          <div className="space-y-2">
            <h4 className="text-2xl font-extrabold text-on-surface tracking-tight">
              KSh {verifiedRent.toLocaleString()}
            </h4>
            <p className="text-[10px] text-zinc-400 font-mono">Matched &amp; settled June collections</p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full"
              style={{ width: `${targetRent > 0 ? (verifiedRent / targetRent) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Vacancy Card */}
        <div className="flat-card p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center text-xs font-bold font-mono">
            <span className="text-slate-500 uppercase">Occupancy Distribution</span>
            <span className="text-indigo-700 font-extrabold">{totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0}%</span>
          </div>

          <div className="space-y-1">
            <h4 className="text-2xl font-extrabold text-on-surface tracking-tight">
              {occupiedUnits} Occupied
            </h4>
            <p className="text-[10px] text-rose-600 font-mono font-bold">↳ {vacantUnits} Vacant Units mapping</p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-indigo-600 h-1.5 rounded-full"
              style={{ width: `${totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Outstanding Overdue Balance */}
        <div className="flat-card p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center text-xs font-bold font-mono">
            <span className="text-slate-500 uppercase">Outstanding Balance</span>
            <span className="text-rose-600 font-extrabold">{targetRent > 0 ? Math.round((outstandingRent / targetRent) * 100) : 0}% Due</span>
          </div>

          <div className="space-y-2">
            <h4 className="text-2xl font-extrabold text-amber-800 tracking-tight">
              KSh {outstandingRent.toLocaleString()}
            </h4>
            <p className="text-[10px] text-zinc-400 font-mono">Overdue, uncollected balances</p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-amber-600 h-1.5 rounded-full"
              style={{ width: `${targetRent > 0 ? (outstandingRent / targetRent) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* SVG graph or structural bar graphs of properties collections */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm p-6 space-y-5">
        <h3 className="text-base font-extrabold tracking-tight text-on-surface flex items-center gap-2">
          <BarChart className="w-5 h-5 text-primary" /> Combined Collection Efficiency Breakdown
        </h3>

        {orgProperties.length === 0 ? (
          <p className="text-xs text-on-surface-variant font-mono">No units are mapped to draw graphs.</p>
        ) : (
          <div className="space-y-4 pt-1">
            {orgProperties.map(p => {
              const pUnits = orgUnits.filter(u => u.propertyId === p.id);
              const pLeases = orgLeases.filter(l => pUnits.map(u => u.id).includes(l.unitId));
              const pTarget = pLeases.reduce((s, l) => s + l.monthlyRent, 0);

              const pPayments = orgPayments.filter(pay => pay.status === "Verified" && pLeases.map(l => l.id).includes(pay.leaseId));
              const pCollected = pPayments.reduce((s, pay) => s + pay.amount, 0);
              const pPercent = pTarget > 0 ? Math.round((pCollected / pTarget) * 100) : 0;

              return (
                <div key={p.id} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold leading-none">
                    <span className="text-on-surface text-sm font-bold">{p.name} ({p.location})</span>
                    <span className="text-on-surface-variant font-mono text-[11px]">
                      KSh {pCollected.toLocaleString()} / KSh {pTarget.toLocaleString()} Target
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                    <div
                      className="bg-primary h-full transition-all duration-500"
                      style={{ width: `${pPercent}%` }}
                      title={`Collected: ${pPercent}%`}
                    ></div>
                    <div
                      className="bg-amber-100 h-full transition-all duration-500 flex-1"
                      title="Uncollected Balance"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
