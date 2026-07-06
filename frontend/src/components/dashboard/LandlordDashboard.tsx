"use client";

import { useEffect, useState } from "react";
import { Building, CreditCard, AlertTriangle, Users, Plus, MapPin, ChevronRight, CheckCircle, Inbox, Clock, FileText, ArrowRight } from "lucide-react";
import type { DashboardSummary, Property, Unit, AuditLog } from "@/types";
import { getProperties, getUnits, api } from "@/lib/api";

interface Props {
  summary: DashboardSummary;
  onNavigate?: (tab: string) => void;
}

interface PropertyWithUnits extends Property {
  units: Unit[];
  occupancyRate: number;
}

export function LandlordDashboard({ summary, onNavigate }: Props) {
  const occupancyRate = summary.occupancy_rate;
  const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const props = await getProperties();
        const units = await getUnits();

        const propsWithUnits: PropertyWithUnits[] = props.map((prop) => {
          const propUnits = units.filter((u) => u.property_id === prop.id);
          const occupied = propUnits.filter((u) => u.status === "Occupied").length;
          const rate = propUnits.length > 0 ? Math.round((occupied / propUnits.length) * 100) : 0;
          return { ...prop, units: propUnits, occupancyRate: rate };
        });

        setProperties(propsWithUnits);
      } catch (err) {
        console.error("Failed to fetch portfolio:", err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchActivity() {
      try {
        const res = await api.get("/audit?limit=10");
        setRecentActivity(res.data);
      } catch (err) {
        console.error("Failed to fetch activity:", err);
      } finally {
        setActivityLoading(false);
      }
    }

    fetchPortfolio();
    fetchActivity();
  }, []);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Welcome */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold font-mono tracking-widest text-primary uppercase mb-1">RentFlow Command</p>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Dashboard</h2>
          <p className="text-xs font-semibold text-on-surface-variant mt-0.5">Real-time rent reconciliation, tenancy log auditing, and collection operations.</p>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Expected Rent */}
        <div className="flat-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-44 h-44 bg-neutral-200/5 rounded-full blur-2xl transition-transform group-hover:scale-110 duration-500" />
          <div className="flex justify-between items-start mb-4 z-10">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Building className="w-5 h-5" /></div>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-surface-container rounded-full text-on-surface-variant">Monthly</span>
          </div>
          <div className="z-10">
            <p className="text-[10px] font-bold font-mono uppercase tracking-wider text-on-surface-variant">Expected Rent</p>
            <h3 className="text-2xl font-extrabold text-on-surface tracking-tight mt-0.5">KSh {summary.expected_rent.toLocaleString()}</h3>
          </div>
        </div>

        {/* Collected Rent */}
        <div className={`flat-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group ${summary.collected_rent > 0 ? "border-primary/20 bg-primary/[0.01]" : ""}`}>
          <div className="flex justify-between items-start mb-4 z-10">
            <div className="p-2.5 bg-emerald-100 rounded-xl text-primary"><CreditCard className="w-5 h-5" /></div>
            {summary.collected_rent > 0 && summary.expected_rent > 0 && (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                {Math.round((summary.collected_rent / summary.expected_rent) * 100)}%
              </span>
            )}
          </div>
          <div className="z-10">
            <p className="text-[10px] font-bold font-mono uppercase tracking-wider text-on-surface-variant">Collected (Verified)</p>
            <h3 className="text-2xl font-extrabold text-primary tracking-tight mt-0.5">KSh {summary.collected_rent.toLocaleString()}</h3>
          </div>
        </div>

        {/* Outstanding */}
        <div className="flat-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 z-10">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-800"><AlertTriangle className="w-5 h-5" /></div>
          </div>
          <div className="z-10">
            <p className="text-[10px] font-bold font-mono uppercase tracking-wider text-on-surface-variant">Outstanding</p>
            <h3 className={`text-2xl font-extrabold tracking-tight mt-0.5 ${summary.outstanding_rent > 0 ? "text-amber-800" : "text-on-surface"}`}>
              KSh {summary.outstanding_rent.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Occupancy */}
        <div className="flat-card rounded-2xl p-5 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4 z-10">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-700"><Users className="w-5 h-5" /></div>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">{occupancyRate}%</span>
          </div>
          <div className="z-10">
            <p className="text-[10px] font-bold font-mono uppercase tracking-wider text-on-surface-variant">Occupancy</p>
            <h3 className="text-2xl font-extrabold text-on-surface tracking-tight mt-0.5">
              {summary.occupied_units} <span className="text-on-surface-variant font-normal text-base">/ {summary.total_units}</span>
            </h3>
            <div className="w-full bg-surface-container rounded-full h-1.5 mt-2">
              <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-700" style={{ width: `${occupancyRate || 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payments Alert */}
      {summary.pending_payments > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-800 shrink-0">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-amber-900">Pending Payment Verifications</p>
              <p className="text-xs text-amber-700"><span className="font-bold">{summary.pending_payments}</span> tenant payment submission{summary.pending_payments !== 1 ? "s" : ""} awaiting verification.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate?.("payments")}
            className="px-4 py-2 bg-amber-800 text-white hover:bg-amber-900 rounded-xl font-bold text-xs shrink-0 transition-all active:scale-95 shadow-sm"
          >
            Review Queue
          </button>
        </div>
      )}

      {/* Properties + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-extrabold tracking-tight text-on-surface">Portfolio Overview</h4>
            <button
              onClick={() => onNavigate?.("properties")}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="flat-card rounded-2xl p-6 text-center">
              <p className="text-sm font-bold text-on-surface-variant">Loading properties...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="flat-card rounded-2xl p-6 text-center">
              <Building className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-sm font-bold text-on-surface-variant">No properties found</p>
              <p className="text-xs text-on-surface-variant mt-1">Add a property to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {properties.map((prop) => (
                <div key={prop.id} className="flat-card rounded-2xl p-6 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl transition-transform group-hover:scale-125 duration-500" />
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="min-w-0 flex-1">
                      <h5 className="text-base font-extrabold text-on-surface tracking-tight truncate">{prop.name}</h5>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                        <p className="text-xs font-semibold text-on-surface-variant truncate">{prop.location}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full shrink-0 ml-3 ${
                      prop.status === "Active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-surface-container text-on-surface-variant"
                    }`}>
                      {prop.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 relative z-10 mb-4">
                    <div className="bg-surface-container/60 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-bold font-mono uppercase text-on-surface-variant mb-1">Units</p>
                      <p className="text-xl font-extrabold text-on-surface">{prop.units.length}</p>
                    </div>
                    <div className="bg-surface-container/60 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-bold font-mono uppercase text-on-surface-variant mb-1">Occupied</p>
                      <p className="text-xl font-extrabold text-emerald-600">{prop.units.filter((u) => u.status === "Occupied").length}</p>
                    </div>
                    <div className="bg-surface-container/60 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-bold font-mono uppercase text-on-surface-variant mb-1">Rate</p>
                      <p className={`text-xl font-extrabold ${prop.occupancyRate >= 80 ? "text-emerald-600" : prop.occupancyRate >= 50 ? "text-amber-600" : "text-on-surface"}`}>
                        {prop.occupancyRate}%
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-surface-container rounded-full h-2 relative z-10 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${
                        prop.occupancyRate >= 80 ? "bg-emerald-500" : prop.occupancyRate >= 50 ? "bg-amber-500" : "bg-primary"
                      }`}
                      style={{ width: `${prop.occupancyRate}%` }}
                    />
                  </div>

                  {prop.description && (
                    <p className="text-xs text-on-surface-variant mb-3 line-clamp-1 relative z-10">{prop.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10 relative z-10">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {prop.units.filter((u) => u.status === "Occupied").length} occupied
                      </span>
                      <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-surface-container border border-on-surface-variant/30" />
                        {prop.units.filter((u) => u.status === "Vacant").length} vacant
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigate?.("properties")}
                      className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      Details <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tenant Event Streams */}
        <div className="flat-card rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold tracking-tight">Tenant Event Streams</h4>
            <button
              onClick={() => onNavigate?.("audit_logs")}
              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {activityLoading ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <Clock className="w-8 h-8 text-on-surface-variant/30 mb-2" />
              <p className="text-xs font-bold text-on-surface-variant">No recent activity</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">Events will appear here as actions are taken.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar max-h-[400px]">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex gap-3 p-2.5 rounded-xl hover:bg-surface-container/50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    log.action.includes("CREATE") ? "bg-emerald-50 text-emerald-600" :
                    log.action.includes("DELETE") ? "bg-red-50 text-red-600" :
                    log.action.includes("UPDATE") || log.action.includes("VERIFY") ? "bg-blue-50 text-blue-600" :
                    "bg-surface-container text-on-surface-variant"
                  }`}>
                    {log.action.includes("CREATE") ? <Plus className="w-3.5 h-3.5" /> :
                     log.action.includes("DELETE") ? <AlertTriangle className="w-3.5 h-3.5" /> :
                     log.action.includes("VERIFY") ? <CheckCircle className="w-3.5 h-3.5" /> :
                     <FileText className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-on-surface leading-tight">{log.action.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">
                      {log.entity}{log.new_value ? ` → ${log.new_value}` : ""}
                    </p>
                    <p className="text-[9px] text-on-surface-variant/60 mt-0.5 font-mono">{formatTime(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
