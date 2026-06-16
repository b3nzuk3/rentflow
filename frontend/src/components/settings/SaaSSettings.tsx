"use client";

export function SaaSSettings() {
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-stretch relative min-h-[750px] animate-fade-in text-left">
      <div className="w-full lg:w-76 shrink-0 flex flex-col gap-6">
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-md p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-150">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-white">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-on-surface">Private Settings</h3>
              <p className="text-[10px] text-zinc-450 font-mono font-bold uppercase tracking-wider mt-0.5">Control Center</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1.5">
            {["Organization Profile", "My Account", "Users & Roles", "Security", "Notifications", "Payment Config", "Subscription", "Audit Logs", "Data Export"].map((item) => (
              <button key={item} className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-zinc-100 hover:text-on-surface transition-colors">
                {item}
              </button>
            ))}
          </nav>
        </div>
      </div>
      <div className="flex-1 flat-card rounded-2xl p-6 bg-white shadow-sm">
        <h3 className="font-extrabold text-sm text-on-surface mb-4">Organization Profile</h3>
        <p className="text-xs text-on-surface-variant">Configure your organization settings here.</p>
      </div>
    </div>
  );
}
