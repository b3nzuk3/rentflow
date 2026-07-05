"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { useDataRefresh } from "@/lib/refresh";
import type { DashboardSummary, Organization, LandlordTab, User } from "@/types";
import { Sidebar } from "@/components/layout/Sidebar";
import { LandlordDashboard } from "@/components/dashboard/LandlordDashboard";
import { TenantDashboard } from "@/components/dashboard/TenantDashboard";
import { SuperAdminDashboard } from "@/components/dashboard/SuperAdminDashboard";
import { LandlordProperties } from "@/components/properties/LandlordProperties";
import { LandlordPayments } from "@/components/payments/LandlordPayments";
import { LandlordLeases } from "@/components/leases/LandlordLeases";
import { LandlordReports } from "@/components/reports/LandlordReports";
import { SaaSSettings } from "@/components/settings/SaaSSettings";
import { NotificationsLog } from "@/components/notifications/NotificationsLog";
import { AuditLogViewer } from "@/components/audit/AuditLogViewer";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoggedIn, currentRole, setCurrentRole, organization, setOrganization, setUser, setLoggedIn } = useAuthStore();
  const [activeTab, setActiveTab] = useState<LandlordTab>("dashboard");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/");
      return;
    }
    loadData();
  }, []);


  const loadData = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData as User);
        setCurrentRole((userData.role as any) || "org_owner");
        setLoggedIn(true);
      }

      const summaryRes = await api.get("/reports/summary");
      setSummary(summaryRes.data);

      try {
        const orgRes = await api.get("/organizations/me");
        setOrganization(orgRes.data);
      } catch {
        // Org endpoint might not exist yet
      }
    } catch (err: any) {
      console.error("Failed to load dashboard data", err);
      if (err.response?.status === 401) {
        router.push("/");
        return;
      }
      setError("Failed to load data. Is the backend running on port 8000?");
    } finally {
      setLoading(false);
    }
  };

  // Refresh summary when any component makes a change
  useDataRefresh(loadData);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
    setLoggedIn(false);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-custom lg:pl-64">
        <div className="text-center pt-16 lg:pt-0">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-on-surface-variant">Loading RentFlow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-custom lg:pl-64">
        <div className="text-center max-w-md p-8 pt-16 lg:pt-0">
          <p className="text-sm font-bold text-red-600 mb-4">{error}</p>
          <button onClick={() => { setError(""); setLoading(true); loadData(); }} className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isLandlord = currentRole !== "tenant" && currentRole !== "super_admin";

  return (
    <div className="min-h-screen bg-background-custom">
      <Sidebar
        currentRole={currentRole}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLandlord={isLandlord}
        onLogout={handleLogout}
        organizationName={organization?.name || ""}
        pendingCount={summary?.pending_payments || 0}
      />

      {/* Main content with left offset for sidebar on desktop */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="px-6 py-8 md:px-10 max-w-7xl mx-auto">
          {currentRole === "tenant" && <TenantDashboard />}
          {currentRole === "super_admin" && <SuperAdminDashboard />}

          {isLandlord && activeTab === "dashboard" && summary && (
            <LandlordDashboard summary={summary} onNavigate={(tab) => setActiveTab(tab as LandlordTab)} />
          )}
          {isLandlord && activeTab === "properties" && <LandlordProperties />}
          {isLandlord && activeTab === "leases" && <LandlordLeases />}
          {isLandlord && activeTab === "payments" && <LandlordPayments />}
          {isLandlord && activeTab === "reports" && <LandlordReports />}
          {isLandlord && activeTab === "settings" && <SaaSSettings />}
          {isLandlord && activeTab === "notifications" && <NotificationsLog />}
          {isLandlord && activeTab === "audit_logs" && <AuditLogViewer />}
        </div>
      </main>
    </div>
  );
}
