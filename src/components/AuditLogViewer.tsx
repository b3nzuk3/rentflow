/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Shield, Clock, FileText, CheckCircle, Database } from "lucide-react";
import { AuditLog, Organization } from "../types";

interface AuditLogViewerProps {
  organization: Organization;
  auditLogs: AuditLog[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  organization,
  auditLogs,
}) => {
  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Title block */}
      <section>
        <span className="p-1 px-3 bg-indigo-50 border border-indigo-200 text-indigo-700 w-fit font-bold font-mono text-[10px] uppercase rounded-full">
          SECURE AUDIT FLUX REGISTER
        </span>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mt-1">Tenant Mutation Audit Logs</h2>
        <p className="text-on-surface-variant font-medium mt-1">
          Trace structural tenant changes, financial approvals, and lease authorizations with complete immutability.
        </p>
      </section>

      {/* Audit Log Table layout */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant bg-slate-50 flex justify-between items-center bg-white/50">
          <h3 className="text-xs font-bold font-mono text-on-surface uppercase tracking-widest">
            Audit Stream Ledger
          </h3>
          <span className="bg-indigo-50 text-indigo-700 px-3 py-0.5 rounded text-xs font-bold font-mono">
            {auditLogs.length} Events Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr className="border-b border-outline-variant">
                <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase">Authorized Operator</th>
                <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase text-center">Operation / Action</th>
                <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase">Entity Scope</th>
                <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase">Mutation Changes</th>
                <th className="px-6 py-3.5 text-xs font-bold font-mono text-on-surface-variant uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/65">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-indigo-5050 transition-colors">
                  {/* Operator Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center font-mono text-xs">
                        OP
                      </div>
                      <div>
                        <p className="font-extrabold text-xs text-on-surface leading-tight">{log.user}</p>
                        <p className="text-[9px] font-mono font-bold text-indigo-700 uppercase leading-none mt-0.5">{log.role.replace("_", " ")}</p>
                      </div>
                    </div>
                  </td>

                  {/* Operation */}
                  <td className="px-6 py-4 text-center font-bold text-xs">
                    <span className="px-2 py-1 bg-slate-105 rounded font-mono text-slate-700 border border-slate-200">
                      {log.action}
                    </span>
                  </td>

                  {/* Entity scope */}
                  <td className="px-6 py-4 font-bold text-xs text-on-surface-variant">
                    {log.entity}
                  </td>

                  {/* Mutation Changes details */}
                  <td className="px-6 py-4 max-w-sm">
                    <div className="text-xs space-y-1">
                      {log.previousValue && (
                        <p className="text-[10px] text-zinc-400 font-mono line-through font-medium">Was: {log.previousValue}</p>
                      )}
                      <p className="font-bold text-slate-750 font-mono text-[10px] text-primary">Now: {log.newValue}</p>
                    </div>
                  </td>

                  {/* Timestamp */}
                  <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">
                    {log.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
