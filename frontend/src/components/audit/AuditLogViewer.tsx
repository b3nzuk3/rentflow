"use client";

export function AuditLogViewer() {
  return (
    <div className="space-y-8 animate-fade-in text-left">
      <section>
        <span className="p-1 px-3 bg-indigo-50 border border-indigo-200 text-indigo-700 w-fit font-bold font-mono text-[10px] uppercase rounded-full">SECURE AUDIT FLUX REGISTER</span>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mt-1">Tenant Mutation Audit Logs</h2>
        <p className="text-on-surface-variant font-medium mt-1">Trace structural tenant changes and financial approvals.</p>
      </section>
      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm p-12 text-center text-on-surface-variant">
        <svg className="w-12 h-12 stroke-1 opacity-25 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
        <p className="text-xs font-bold">No audit events logged yet.</p>
      </div>
    </div>
  );
}
