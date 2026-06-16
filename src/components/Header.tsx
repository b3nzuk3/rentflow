/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Wallet, Bell, RefreshCw, Layers, ShieldCheck, User, ChevronDown, Menu, X } from "lucide-react";
import { UserRole, LandlordTab, User as AppUser, Organization } from "../types";
import { IMAGES } from "../data";

interface HeaderProps {
  currentUser: AppUser;
  organization: Organization;
  currentRole: UserRole;
  onChangeUserRole: (role: UserRole) => void;
  activeLandlordTab: LandlordTab;
  setActiveLandlordTab: (tab: LandlordTab) => void;
  pendingCount: number;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  organization,
  currentRole,
  onChangeUserRole,
  activeLandlordTab,
  setActiveLandlordTab,
  pendingCount,
  onLogout,
}) => {
  const [showLogsDropdown, setShowLogsDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isLogsActive = activeLandlordTab === "notifications" || activeLandlordTab === "audit_logs";

  return (
    <header className="sticky top-0 z-40 bg-zinc-900 border-b border-zinc-800 shadow-lg">
      <div className="w-full px-6 py-4 md:px-12 flex items-center justify-between gap-5">
        
        {/* Left Section: Brand Logo & Desktop Navigation */}
        <div className="flex items-center gap-10">
          {/* Brand & Identity */}
          <div className="flex items-center gap-4.5 shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white block">RentFlow</span>
              <span className="text-xs font-mono tracking-widest text-[#4CAF50] uppercase font-extrabold">
                {organization.name}
              </span>
            </div>
          </div>

          {/* Desktop Tab Selector based on Role */}
          {currentRole !== "tenant" && currentRole !== "super_admin" && (
            <nav className="hidden lg:flex items-center gap-2.5">
              {([
                { key: "dashboard", label: "Dashboard" },
                { key: "properties", label: "Properties" },
                { key: "leases", label: "Leases" },
                { key: "payments", label: "Payments" },
                { key: "reports", label: "Reports" },
                { key: "settings", label: "Settings" },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveLandlordTab(tab.key);
                    setShowLogsDropdown(false);
                  }}
                  className={`px-4.5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-150 flex items-center gap-2 shadow-sm ${
                    activeLandlordTab === tab.key
                      ? "bg-primary text-white font-extrabold scale-[1.02]"
                      : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.key === "payments" && pendingCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold font-sans bg-rose-600 text-white rounded-full leading-none shrink-0 animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}

              {/* Utility logs grouped into clean dropdown to address crowded feeling */}
              <div className="relative">
                <button
                  onClick={() => setShowLogsDropdown(!showLogsDropdown)}
                  className={`px-4.5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-150 flex items-center gap-1.5 shadow-sm ${
                    isLogsActive
                      ? "bg-primary text-white font-extrabold"
                      : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <span>Logs Directory</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showLogsDropdown ? "rotate-180" : ""}`} />
                </button>

                {showLogsDropdown && (
                  <>
                    <button 
                      onClick={() => setShowLogsDropdown(false)}
                      className="fixed inset-0 cursor-default bg-transparent z-10 w-full h-full"
                      type="button"
                    />
                    <div className="absolute right-0 mt-2.5 w-52 bg-zinc-950 border border-zinc-800/90 rounded-2xl shadow-2xl py-2 z-20 text-left">
                      <button
                        onClick={() => {
                          setActiveLandlordTab("notifications");
                          setShowLogsDropdown(false);
                        }}
                        className={`w-full px-4.5 py-2.5 hover:bg-zinc-800 text-xs font-bold font-mono tracking-wider flex items-center gap-2.5 transition-colors uppercase ${
                          activeLandlordTab === "notifications" ? "text-[#4CAF50] font-extrabold bg-zinc-900/40" : "text-zinc-300"
                        }`}
                      >
                        <Bell className="w-4 h-4 text-[#4CAF50] shrink-0" />
                        <span>SMS Logs Outbox</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveLandlordTab("audit_logs");
                          setShowLogsDropdown(false);
                        }}
                        className={`w-full px-4.5 py-2.5 hover:bg-zinc-800 text-xs font-bold font-mono tracking-wider flex items-center gap-2.5 transition-colors uppercase ${
                          activeLandlordTab === "audit_logs" ? "text-[#4CAF50] font-extrabold bg-zinc-900/40" : "text-zinc-300"
                        }`}
                      >
                        <RefreshCw className="w-4 h-4 text-[#4CAF50] shrink-0 animate-spin-slow" />
                        <span>Audit Trails Log</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </nav>
          )}

          {/* Desktop Super Admin Indicator */}
          {currentRole === "super_admin" && (
            <div className="hidden lg:flex items-center gap-2.5 bg-indigo-950/50 border border-indigo-800/80 px-6 py-2.5 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-bold text-indigo-100 tracking-wide uppercase">
                Global Platform SuperAdmin Control Plane
              </span>
            </div>
          )}

          {/* Desktop Tenant Indicator */}
          {currentRole === "tenant" && (
            <div className="hidden lg:flex items-center gap-2.5 bg-emerald-950/50 border border-emerald-800/85 px-6 py-2.5 rounded-2xl">
              <Layers className="w-5 h-5 text-[#4CAF50]" />
              <span className="text-sm font-bold text-emerald-100 tracking-wide uppercase">
                Secure Tenant Rent Roll Portal
              </span>
            </div>
          )}
        </div>

        {/* Right Section: Simulator Mode & Operator Avatar (Desktop), Hamburger Button (Mobile) */}
        <div className="flex items-center gap-4">
          
          {/* Desktop Mode Indicator Controls */}
          <div className="hidden lg:flex items-center gap-5.5">
            <div className="flex items-center gap-2.5 bg-zinc-800 px-4 py-2.5 rounded-xl border border-zinc-700/60 hover:border-zinc-650 transition shadow-inner">
              <span className="text-xs font-extrabold text-[#4CAF50] uppercase select-none flex items-center gap-1.5 font-mono">
                <User className="w-4 h-4 text-[#4CAF50]" /> PORTAL POSITION:
              </span>
              <select
                value={currentRole}
                onChange={e => onChangeUserRole(e.target.value as UserRole)}
                className="bg-transparent text-white text-sm outline-none cursor-pointer font-bold pr-2"
              >
                <optgroup label="Tenant Portal" className="bg-zinc-900">
                  <option value="tenant" className="bg-zinc-900">
                    Tenant ({currentRole === "tenant" ? `${currentUser.firstName} ${currentUser.lastName}` : "Jane Doe"})
                  </option>
                </optgroup>
                <optgroup label="SaaS Tenant Landlord Core" className="bg-zinc-900">
                  <option value="org_owner" className="bg-zinc-900">
                    Owner ({currentRole === "org_owner" ? `${currentUser.firstName} ${currentUser.lastName}` : "Fatuma Ali"})
                  </option>
                  <option value="property_manager" className="bg-zinc-900">
                    Manager ({currentRole === "property_manager" ? `${currentUser.firstName} ${currentUser.lastName}` : "Mwangi Karanja"})
                  </option>
                  <option value="accountant" className="bg-zinc-900">
                    Accountant ({currentRole === "accountant" ? `${currentUser.firstName} ${currentUser.lastName}` : "Grace Kendi"})
                  </option>
                  <option value="caretaker" className="bg-zinc-900">
                    Caretaker ({currentRole === "caretaker" ? `${currentUser.firstName} ${currentUser.lastName}` : "Josphat"})
                  </option>
                </optgroup>
                <optgroup label="Global Admin platform" className="bg-zinc-900">
                  <option value="super_admin" className="bg-zinc-900">
                    Super Admin ({currentRole === "super_admin" ? `${currentUser.firstName} ${currentUser.lastName}` : "System"})
                  </option>
                </optgroup>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800 shrink-0 shadow-xl">
                <img
                  src={currentRole === "tenant" ? IMAGES.avatar_female : IMAGES.avatar_male}
                  alt="Active operator profile"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-[10px] font-bold text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 px-2 py-1.5 rounded-lg border border-transparent hover:border-zinc-750 transition font-mono tracking-tight uppercase"
                  title="Log out of current session partition"
                >
                  Log Out
                </button>
              )}
            </div>
          </div>

          {/* Toggle Mobile Menu Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-zinc-700/65 rounded-xl transition duration-150 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-800 bg-zinc-950 max-h-[85vh] overflow-y-auto px-6 py-5 space-y-6 animate-fade-in text-left">
          {/* User profile & selector inside mobile menu */}
          <div className="p-4.5 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800 shrink-0">
                <img
                  src={currentRole === "tenant" ? IMAGES.avatar_female : IMAGES.avatar_male}
                  alt="Active operator profile"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-zinc-500 font-mono tracking-wider uppercase leading-none">Active Workspace Session</p>
                <p className="text-sm font-black text-white mt-1 leading-snug">
                  {currentRole === "tenant" ? `${currentUser.firstName} ${currentUser.lastName} (Tenant)` : currentRole === "org_owner" ? `${currentUser.firstName} ${currentUser.lastName} (Owner)` : currentRole === "property_manager" ? `${currentUser.firstName} ${currentUser.lastName} (Manager)` : currentRole === "accountant" ? `${currentUser.firstName} ${currentUser.lastName} (Accountant)` : currentRole === "caretaker" ? `${currentUser.firstName} ${currentUser.lastName} (Caretaker)` : `${currentUser.firstName} ${currentUser.lastName} (Super Admin)`}
                </p>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-widest pl-1">
                Switch Position Profile:
              </label>
              <select
                value={currentRole}
                onChange={e => {
                  onChangeUserRole(e.target.value as UserRole);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-zinc-800 text-white text-sm border border-zinc-700 rounded-xl px-3.5 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-primary/45"
              >
                <optgroup label="Tenant Portal" className="bg-zinc-900">
                  <option value="tenant">
                    Tenant ({currentRole === "tenant" ? `${currentUser.firstName} ${currentUser.lastName}` : "Jane Doe"})
                  </option>
                </optgroup>
                <optgroup label="SaaS Tenant Landlord Core" className="bg-zinc-900">
                  <option value="org_owner">
                    Owner ({currentRole === "org_owner" ? `${currentUser.firstName} ${currentUser.lastName}` : "Fatuma Ali"})
                  </option>
                  <option value="property_manager">
                    Manager ({currentRole === "property_manager" ? `${currentUser.firstName} ${currentUser.lastName}` : "Mwangi Karanja"})
                  </option>
                  <option value="accountant">
                    Accountant ({currentRole === "accountant" ? `${currentUser.firstName} ${currentUser.lastName}` : "Grace Kendi"})
                  </option>
                  <option value="caretaker">
                    Caretaker ({currentRole === "caretaker" ? `${currentUser.firstName} ${currentUser.lastName}` : "Josphat"})
                  </option>
                </optgroup>
                <optgroup label="Global Admin platform" className="bg-zinc-900">
                  <option value="super_admin">
                    Super Admin ({currentRole === "super_admin" ? `${currentUser.firstName} ${currentUser.lastName}` : "System"})
                  </option>
                </optgroup>
              </select>
            </div>

            {onLogout && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2.5 bg-rose-950/20 border border-rose-900/40 hover:bg-rose-900/30 text-rose-305 hover:text-rose-205 text-rose-400 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
              >
                Sign Out of Partition Session
              </button>
            )}
          </div>

          {/* Navigation Links for mobile */}
          {currentRole !== "tenant" && currentRole !== "super_admin" && (
            <div className="space-y-3.5">
              <span className="block text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-widest px-1">
                Landlord Portal Menu
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { key: "dashboard", label: "Dashboard" },
                  { key: "properties", label: "Properties" },
                  { key: "leases", label: "Leases" },
                  { key: "payments", label: "Payments" },
                  { key: "reports", label: "Reports" },
                  { key: "settings", label: "Settings" },
                ] as const).map(tab => {
                  const isActive = activeLandlordTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveLandlordTab(tab.key);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`px-4 py-3.5 rounded-xl text-xs font-bold tracking-wide transition-all text-left flex items-center justify-between ${
                        isActive
                          ? "bg-primary text-white font-extrabold"
                          : "bg-zinc-900 text-zinc-300 hover:text-white"
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.key === "payments" && pendingCount > 0 && (
                        <span className="px-2 py-0.5 text-[9px] font-bold font-sans bg-rose-600 text-white rounded-full leading-none">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Logs category in mobile menu */}
              <div className="pt-4 border-t border-zinc-800/80 space-y-3">
                <span className="block text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-widest px-1">
                  Utilities & Logs
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      setActiveLandlordTab("notifications");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-4 py-3.5 rounded-xl text-xs font-bold font-mono tracking-wider transition-all text-left flex items-center gap-2 uppercase ${
                      activeLandlordTab === "notifications"
                        ? "bg-primary text-white"
                        : "bg-zinc-900 text-zinc-300 hover:text-white"
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5 text-[#4CAF50]" />
                    <span>SMS OUTBOX</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveLandlordTab("audit_logs");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-4 py-3.5 rounded-xl text-xs font-bold font-mono tracking-wider transition-all text-left flex items-center gap-2 uppercase ${
                      activeLandlordTab === "audit_logs"
                        ? "bg-primary text-white"
                        : "bg-zinc-900 text-zinc-300 hover:text-white"
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#4CAF50]" />
                    <span>AUDIT TRAILS</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Banner for Tenant and SuperAdmin in Mobile Menu */}
          {currentRole === "super_admin" && (
            <div className="flex items-center gap-3 bg-indigo-950/60 border border-indigo-805/80 p-4 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
              <div className="text-left">
                <span className="block text-[9px] font-bold font-mono text-indigo-300 uppercase tracking-widest leading-none mb-1">Active Space</span>
                <span className="text-xs font-bold text-indigo-100 tracking-wide">
                  Global Platform SuperAdmin Control Plane
                </span>
              </div>
            </div>
          )}

          {currentRole === "tenant" && (
            <div className="flex items-center gap-3 bg-emerald-950/60 border border-emerald-805/80 p-4 rounded-xl">
              <Layers className="w-5 h-5 text-[#4CAF50] shrink-0" />
              <div className="text-left">
                <span className="block text-[9px] font-bold font-mono text-emerald-300 uppercase tracking-widest leading-none mb-1">Active Space</span>
                <span className="text-xs font-bold text-emerald-100 tracking-wide">
                  Secure Tenant Rent Roll Portal
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
