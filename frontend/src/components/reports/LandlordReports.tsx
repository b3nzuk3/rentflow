"use client";

export function LandlordReports() {
  return (
    <div className="space-y-8 animate-fade-in text-left">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Financial & Occupancy Reports</h2>
          <p className="text-on-surface-variant font-medium mt-1">Download collection, vacancy rates, and rent reconciliation reports.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-3 border border-outline-variant rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-1.5">Export CSV</button>
          <button className="px-5 py-3 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-hover transition-all flex items-center gap-1.5 shadow-sm">Print PDF</button>
        </div>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[{ label: "Collection Efficiency", value: "KSh 0", pct: "0%", color: "bg-primary" }, { label: "Occupancy Distribution", value: "0 Occupied", pct: "0%", color: "bg-indigo-600" }, { label: "Outstanding Balance", value: "KSh 0", pct: "0% Due", color: "bg-amber-600" }].map((card, i) => (
          <div key={i} className="flat-card p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center text-xs font-bold font-mono">
              <span className="text-slate-500 uppercase">{card.label}</span>
              <span className="text-primary font-extrabold">{card.pct}</span>
            </div>
            <h4 className="text-2xl font-extrabold text-on-surface tracking-tight">{card.value}</h4>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className={`${card.color} h-1.5 rounded-full`} style={{ width: "0%" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
