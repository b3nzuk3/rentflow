"use client";

export function LandlordLeases() {
  return (
    <div className="space-y-8 animate-fade-in text-left">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Lease Agreements Portfolio</h2>
          <p className="text-on-surface-variant font-medium mt-1">Authorize agreements and draft tenancy structures.</p>
        </div>
        <button className="px-5 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-primary-hover transition-all active:scale-95 shadow-sm">
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
          New Tenant Invite & Lease
        </button>
      </section>
      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm p-12 text-center text-on-surface-variant">
        <svg className="w-12 h-12 mx-auto stroke-1 opacity-25 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        <p className="text-sm font-bold text-on-surface">No agreements fit this category filter.</p>
      </div>
    </div>
  );
}
