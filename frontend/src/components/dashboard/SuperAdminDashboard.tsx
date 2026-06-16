"use client";

export function SuperAdminDashboard() {
  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-4">
          <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h3 className="font-extrabold text-[#006c0c] text-sm">RentFlow Global Platform Command Center</h3>
            <p className="text-xs text-on-surface-variant font-semibold mt-0.5">Signed in as <span className="font-black">Super Administrator</span></p>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Subscribed Organizations", value: "—", color: "text-primary" },
          { label: "Global Processed Volume", value: "KSh —", color: "text-[#006c0c]" },
          { label: "Global Queue Pending", value: "—", color: "text-amber-600" },
          { label: "Audit Status", value: "Active", color: "text-[#006c0c]" },
        ].map((stat, i) => (
          <div key={i} className="flat-card rounded-2xl p-5 space-y-3 shadow-sm bg-white">
            <div className="flex justify-between items-center text-on-surface-variant">
              <span className="text-xs font-bold font-mono uppercase">{stat.label}</span>
            </div>
            <div>
              <h2 className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</h2>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="flat-card rounded-2xl p-6 space-y-6 bg-white shadow-sm">
            <h3 className="font-extrabold text-xs text-on-surface uppercase tracking-wider font-mono">Billing Distribution</h3>
            <div className="space-y-4">
              {[{ plan: "Starter", limit: "10 units", count: "—" }, { plan: "Growth", limit: "50 units", count: "—" }, { plan: "Enterprise", limit: "Unlimited", count: "—" }].map((tier) => (
                <div key={tier.plan} className="flex justify-between items-center border-b border-light-outline pb-2.5">
                  <div>
                    <p className="text-xs font-black text-on-surface">{tier.plan} Plan</p>
                    <p className="text-[10px] text-on-surface-variant font-mono">Limit: {tier.limit}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-extrabold font-mono rounded bg-primary/10 text-primary">{tier.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flat-card rounded-2xl p-6 space-y-5 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-100">
            <h3 className="font-extrabold text-sm text-on-surface">Tenant Organizations Directory</h3>
            <button className="px-4.5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-black font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-sm self-start sm:self-auto">
              Register Tenant Org
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-150">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-150">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider">Tenant Organization</th>
                  <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider">SaaS Tier</th>
                  <th className="px-4 py-3 text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-xs text-zinc-400 font-bold">No organizations registered yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
