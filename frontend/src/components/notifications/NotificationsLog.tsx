"use client";

export function NotificationsLog() {
  return (
    <div className="space-y-8 animate-fade-in text-left">
      <section>
        <span className="p-1 px-3 bg-primary/10 text-primary w-fit font-bold font-mono text-[10px] uppercase rounded-full">COMMUNICATION ENGINE V1</span>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mt-1">Tenant Delivery Alerts Log</h2>
        <p className="text-on-surface-variant font-medium mt-1">Monitor automated, multi-channel transactional outbox notifications.</p>
      </section>
      <div className="bg-white border border-outline-variant rounded-2xl shadow-sm p-12 text-center text-on-surface-variant">
        <svg className="w-12 h-12 stroke-1 opacity-25 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <p className="text-xs font-bold">No outbox dispatches recorded.</p>
      </div>
    </div>
  );
}
