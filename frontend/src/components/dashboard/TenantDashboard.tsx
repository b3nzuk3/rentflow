"use client";

export function TenantDashboard() {
  return (
    <div className="space-y-8 animate-fade-in text-left">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flat-card rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute -top-12 -right-12 text-primary opacity-5 transition-transform duration-500 group-hover:scale-110">
            <svg className="w-56 h-56" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h1v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9a1 1 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13z"/></svg>
          </div>
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded uppercase">Tenant Portal • Active Lease</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mt-3">Pending Statement Balance</h2>
            <p className="text-xs text-on-surface-variant font-medium mt-1 font-mono">Your rental unit</p>
            <div className="my-6">
              <p className="text-[11px] font-bold font-mono text-on-surface-variant uppercase tracking-wider">Outstanding Statement Balance</p>
              <h3 className="text-4xl font-extrabold mt-1 tracking-tight text-amber-800">KSh 0</h3>
            </div>
          </div>
          <div className="relative z-10 flex flex-wrap gap-3">
            <button className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-sm">
              Submit Payment Receipt
            </button>
          </div>
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="flat-card rounded-2xl p-4 flex items-center gap-4 hover:border-primary/20">
            <div className="w-11 h-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9"/></svg>
            </div>
            <div>
              <p className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Rental Space</p>
              <p className="text-sm font-extrabold text-on-surface mt-0.5">Your Property</p>
            </div>
          </div>
          <div className="flat-card rounded-2xl p-4 flex items-center gap-4 hover:border-primary/20">
            <div className="w-11 h-11 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
            </div>
            <div>
              <p className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Tenant Score</p>
              <p className="text-sm font-extrabold text-on-surface mt-0.5">Gold Class • Good Standing</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
