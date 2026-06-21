"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuditLog } from "@/types";
import { FileText, Clock, User, ArrowRight } from "lucide-react";

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const { data } = await api.get("/audit?limit=50");
      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.startsWith("CREATE") || action.startsWith("INVITE")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (action.startsWith("UPDATE") || action.startsWith("VERIFY") || action.startsWith("SIGN") || action.startsWith("TOGGLE")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (action.startsWith("DELETE")) return "bg-red-50 text-red-700 border-red-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in text-left">
        <section>
          <span className="p-1 px-3 bg-indigo-50 border border-indigo-200 text-indigo-700 w-fit font-bold font-mono text-[10px] uppercase rounded-full">SECURE AUDIT FLUX REGISTER</span>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mt-1">Tenant Mutation Audit Logs</h2>
          <p className="text-on-surface-variant font-medium mt-1">Trace structural tenant changes and financial approvals.</p>
        </section>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <section className="flex items-end justify-between">
        <div>
          <span className="p-1 px-3 bg-indigo-50 border border-indigo-200 text-indigo-700 w-fit font-bold font-mono text-[10px] uppercase rounded-full">SECURE AUDIT FLUX REGISTER</span>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mt-1">Tenant Mutation Audit Logs</h2>
          <p className="text-on-surface-variant font-medium mt-1">Trace structural tenant changes and financial approvals.</p>
        </div>
        <span className="text-xs font-bold font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{logs.length} events</span>
      </section>

      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <FileText className="w-12 h-12 stroke-1 opacity-25 mx-auto mb-3" />
            <p className="text-xs font-bold">No audit events logged yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/60">
            {logs.map(log => (
              <div key={log.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`px-2 py-0.5 text-[10px] font-bold font-mono uppercase rounded border shrink-0 ${getActionColor(log.action)}`}>
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">{log.entity}</span>
                        {log.previous_value && log.new_value && (
                          <>
                            <span className="text-on-surface-variant truncate max-w-[120px]">{log.previous_value}</span>
                            <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                            <span className="text-primary truncate max-w-[120px]">{log.new_value}</span>
                          </>
                        )}
                        {log.new_value && !log.previous_value && (
                          <span className="text-primary truncate">{log.new_value}</span>
                        )}
                        {log.previous_value && !log.new_value && (
                          <span className="text-red-600 line-through truncate">{log.previous_value}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-on-surface-variant shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
