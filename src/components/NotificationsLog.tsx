/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Mail, MessageSquare, Bell, Send, CheckCircle, Shield, AlertTriangle } from "lucide-react";
import { RentNotification, Organization } from "../types";

interface NotificationsLogProps {
  organization: Organization;
  notifications: RentNotification[];
  onTriggerNotificationSimulate?: (triggerType: string) => void;
}

export const NotificationsLog: React.FC<NotificationsLogProps> = ({
  organization,
  notifications,
  onTriggerNotificationSimulate,
}) => {
  const orgNotifications = notifications.filter(n => {
    // If we have an matching org prefix or standard trigger
    return true; // Simple, global preview queue log
  });

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Title block */}
      <section>
        <span className="p-1 px-3 bg-primary/10 text-primary w-fit font-bold font-mono text-[10px] uppercase rounded-full">
          COMMUNICATION ENGINE V1
        </span>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mt-1">Tenant Delivery Alerts log</h2>
        <p className="text-on-surface-variant font-medium mt-1">
          Monitor automated, multi-channel transactional outbox notifications dispatched across Kenya.
        </p>
      </section>

      {/* Alert logs layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Outbox log list */}
        <div className="lg:col-span-8 bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-outline-variant bg-slate-50 flex justify-between items-center">
            <h3 className="text-xs font-bold font-mono text-on-surface uppercase tracking-widest">
              Spool Outbox Queue
            </h3>
            <span className="bg-primary/10 text-primary px-3.5 py-0.5 rounded text-xs font-bold font-mono">
              {orgNotifications.length} Sent Alerts
            </span>
          </div>

          <div className="divide-y divide-outline-variant/65">
            {orgNotifications.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant">
                <Bell className="w-12 h-12 stroke-1 opacity-25 mx-auto mb-3" />
                <p className="text-xs font-bold">No outbox dispatches recorded.</p>
              </div>
            ) : (
              orgNotifications.map(notif => (
                <div key={notif.id} className="p-5 flex gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {notif.channel === "SMS" ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                  </div>
                  <div className="space-y-1 bg-white inline-block flex-1">
                    <div className="flex items-center justify-between text-xs font-bold font-mono">
                      <span className="text-primary tracking-tight uppercase">Trigger: {notif.trigger}</span>
                      <span className="text-zinc-400 font-medium">{notif.timestamp}</span>
                    </div>
                    <p className="text-xs text-on-surface font-semibold py-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex justify-between items-center pt-1 font-mono text-[10px] text-on-surface-variant">
                      <span>Recipient Address: <span className="font-bold text-slate-700">{notif.recipient}</span></span>
                      <span className="inline-flex items-center text-emerald-800 font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-primary mr-1" />
                        Delivered successfully
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flat-card rounded-2xl p-6 space-y-4">
            <h4 className="font-extrabold text-sm text-on-surface">Africa-Scoped SMS Delivery APIs</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              RentFlow is prepared for automated AfricasTalking SMS gateways. When tenants are invited or payment states fluctuate, the system spools localized SMS notifications with deep-links to prompt immediate mobile money matches.
            </p>
            <div className="p-3 bg-primary/5 rounded-xl text-primary text-[10px] font-mono leading-relaxed space-y-1 border border-primary/10">
              <span className="font-bold uppercase tracking-wider block">Example SMS body:</span>
              <p className="italic text-zinc-600">
                "Hello Jane Doe, you have been invited to join RentFlow by Rift Properties. Review and sign your lease at https://rentflow.co/sign/B12"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
