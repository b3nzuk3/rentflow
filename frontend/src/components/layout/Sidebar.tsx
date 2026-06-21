"use client";

import { useState } from "react";
import {
  Wallet, Bell, RefreshCw, ShieldCheck, User, LogOut, ChevronDown,
  LayoutDashboard, Building, FileText, CreditCard, BarChart3, Settings,
  Layers, Menu, X, Users
} from "lucide-react";
import type { UserRole, LandlordTab } from "@/types";

interface SidebarProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
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
  { key: "settings", label: "Settings", icon: Settings },
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
  currentRole, onChangeRole, activeTab, onTabChange,
  isLandlord, onLogout, organizationName, pendingCount,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

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
              {landlordNavItems.map((item) => {
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

              <p className="px-3 pt-4 pb-1.5 text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-widest">Utilities</p>
              {logItems.map((item) => {
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
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                  <Layers className="w-4 h-4" />
                  <span>Rent Roll Portal</span>
                </div>
              </div>
            </>
          )}
        </nav>

        {/* Bottom: Role selector + Logout */}
        <div className="px-3 py-4 border-t border-zinc-800 space-y-3">
          {/* Role dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-black text-[10px] shrink-0">
                  {currentRole === "tenant" ? "TN" : "AD"}
                </div>
                <span className="text-xs font-bold text-white truncate">{roleLabels[currentRole]}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${roleDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {roleDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setRoleDropdownOpen(false)} />
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 z-20">
                  {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => { onChangeRole(role); setRoleDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors ${
                        role === currentRole ? "text-primary bg-primary/10" : "text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      {roleLabels[role]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

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
