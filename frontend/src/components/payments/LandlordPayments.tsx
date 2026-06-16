"use client";

export function LandlordPayments() {
  return (
    <div className="space-y-8 animate-fade-in text-left">
      <section>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Rent Payment Reconciliation Ledger</h2>
        <p className="text-on-surface-variant font-medium mt-1">Perform audits, match external mobile money transactions, and approve tenant rent payments.</p>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flat-card p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">Pending Ledger Verification</span>
          <div className="text-5xl font-mono font-extrabold text-amber-600 mt-2">00</div>
        </div>
        <div className="flat-card p-6 rounded-2xl md:col-span-2 relative overflow-hidden group">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <span className="text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">Monthly Total Reconciled Rent Volume</span>
            <div className="text-3xl font-extrabold text-primary mt-2 tracking-tight">KSh 0</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm p-12 text-center text-on-surface-variant">
        <svg className="w-12 h-12 mx-auto stroke-1 text-on-surface-variant/30 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></svg>
        <p className="text-sm font-bold text-on-surface">No payment records found.</p>
      </div>
    </div>
  );
}
