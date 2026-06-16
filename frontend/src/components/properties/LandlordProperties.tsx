"use client";

export function LandlordProperties() {
  return (
    <div className="space-y-8 animate-fade-in text-left">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Properties, Blocks & Units</h2>
          <p className="text-on-surface-variant font-medium mt-1">Hierarchical multi-tenant portfolio structure.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="px-5 py-3 bg-primary text-white hover:bg-primary-hover rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm">
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9"/></svg>
            Add Property
          </button>
        </div>
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider">Properties Directory</h3>
            </div>
            <div className="text-center py-8 text-on-surface-variant">
              <svg className="w-10 h-10 mx-auto text-on-surface-variant/30 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9"/></svg>
              <p className="text-xs font-bold font-mono">No properties yet.</p>
            </div>
          </div>
        </aside>
        <section className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-outline-variant shadow-sm p-12 text-center text-on-surface-variant">
            <svg className="w-12 h-12 mx-auto stroke-1 opacity-30 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9"/></svg>
            <p className="text-sm font-bold text-on-surface">Select a property to view units.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
