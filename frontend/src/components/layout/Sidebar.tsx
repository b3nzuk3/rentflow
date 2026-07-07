"use client";

import { useState } from "react";
import {
  Wallet, Bell, RefreshCw, ShieldCheck, LogOut,
  LayoutDashboard, Building, FileText, CreditCard, BarChart3, Settings,
  Layers, Menu, X
} from "lucide-react";
import type { UserRole, LandlordTab } from "@/types";

interface SidebarProps {
  currentRole: UserRole;
  activeTab: LandlordTab;
  onTabChange: (tab: LandlordTab) => void;
  isLandlord: boolean;
  onLogout: () => void;
  organizationName: string;
  pendingCount: number;
}

const landlordNavItems: { key: LandlordTab; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "properties", label: "Properties", icon: Building },
  { key: "leases", label: "Leases", icon: FileText },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "reports", label: "Reports", icon: BarChart3 },
];

const logItems: { key: LandlordTab; label: string; icon: React.ElementType }[] = [
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "audit_logs", label: "Audit Logs", icon: RefreshCw },
];

const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  org_owner: "Owner",
  property_manager: "Manager",
  accountant: "Accountant",
  caretaker: "Caretaker",
  tenant: "Tenant",
};

const roleColors: Record<UserRole, string> = {
  super_admin: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  org_owner: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  property_manager: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  accountant: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  caretaker: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  tenant: "bg-teal-500/20 text-teal-300 border-teal-500/30",
};

export function Sidebar({
  currentRole, activeTab, onTabChange,
  isLandlord, onLogout, organizationName, pendingCount,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Filter navigation items based on current role
  const filteredLandlordNavItems = landlordNavItems.filter(item => {
    if (currentRole === "caretaker") {
      // Caretaker: dashboard, properties, payments only
      return ["dashboard", "properties", "payments"].includes(item.key);
    }
    if (currentRole === "accountant") {
      // Accountant: dashboard, leases, payments, reports
      return ["dashboard", "leases", "payments", "reports"].includes(item.key);
    }
    if (currentRole === "property_manager") {
      // Property manager: dashboard, properties, leases, payments, reports
      return ["dashboard", "properties", "leases", "payments", "reports"].includes(item.key);
    }
    // org_owner: all items
    return true;
  });

  const filteredLogItems = logItems.filter(item => {
    if (currentRole === "org_owner") return true;
    // Non-owners: only notifications, no audit logs
    return item.key === "notifications";
  });

  const handleTabChange = (tab: LandlordTab) => {
    onTabChange(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-lg font-black text-white tracking-tight">RentFlow</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-zinc-800 text-zinc-300 rounded-lg"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 bg-zinc-900 border-r border-zinc-800
        flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-lg font-black text-white tracking-tight block leading-tight">RentFlow</span>
              <span className="text-[10px] font-mono tracking-wider text-[#4CAF50] uppercase font-bold block truncate">
                {organizationName}
              </span>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-4 pt-4 pb-2">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${roleColors[currentRole]}`}>
            <ShieldCheck className="w-3 h-3" />
            {roleLabels[currentRole]}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto custom-scrollbar space-y-1">
          {isLandlord && (
            <>
              <p className="px-3 pt-2 pb-1.5 text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-widest">Main</p>
              {filteredLandlordNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleTabChange(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    <span>{item.label}</span>
                    {item.key === "payments" && pendingCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-[9px] font-extrabold bg-rose-600 text-white rounded-full leading-none animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                );
              })}

              {currentRole === "org_owner" && (
                <button
                  onClick={() => handleTabChange("settings")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    activeTab === "settings"
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                  }`}
                >
                  <Settings className="w-4.5 h-4.5 shrink-0" />
                  <span>Settings</span>
                </button>
              )}

              <p className="px-3 pt-4 pb-1.5 text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-widest">Utilities</p>
              {filteredLogItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleTabChange(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {currentRole === "super_admin" && (
            <>
              <p className="px-3 pt-2 pb-1.5 text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-widest">Platform</p>
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>SuperAdmin Control Plane</span>
                </div>
              </div>
            </>
          )}

          {currentRole === "tenant" && (
            <>
              <p className="px-3 pt-2 pb-1.5 text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-widest">Tenant</p>
              <button onClick={() => handleTabChange("dashboard")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  activeTab === "dashboard"
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                }`}>
                <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
                <span>Dashboard</span>
              </button>
              <button onClick={() => handleTabChange("settings")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  activeTab === "settings"
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                }`}>
                <Settings className="w-4.5 h-4.5 shrink-0" />
                <span>Settings</span>
              </button>
            </>
          )}
        </nav>

        {/* Bottom: User info + Logout */}
        <div className="px-3 py-4 border-t border-zinc-800 space-y-3">
          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
