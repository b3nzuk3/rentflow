"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { DashboardSummary, Organization, LandlordTab } from "@/types";
import { Header } from "@/components/layout/Header";
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

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoggedIn, currentRole, setCurrentRole, organization, setOrganization } = useAuthStore();
  const [activeTab, setActiveTab] = useState<LandlordTab>("dashboard");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      const storedUser = localStorage.getItem("access_token");
      if (!storedUser) {
        router.push("/");
        return;
      }
    }
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      const [summaryRes, orgRes] = await Promise.all([
        api.get("/reports/summary"),
        api.get("/organizations/me").catch(() => null),
      ]);
      setSummary(summaryRes.data);
      if (orgRes) setOrganization(orgRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-custom">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-on-surface-variant">Loading RentFlow...</p>
        </div>
      </div>
    );
  }

  const isLandlord = currentRole !== "tenant" && currentRole !== "super_admin";

  return (
    <div className="min-h-screen bg-background-custom">
      <Header
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLandlord={isLandlord}
        onLogout={handleLogout}
        organizationName={organization?.name || ""}
        pendingCount={summary?.pending_payments || 0}
      />

      <main className="px-6 py-8 md:px-12 max-w-7xl mx-auto">
        {currentRole === "tenant" && <TenantDashboard />}
        {currentRole === "super_admin" && <SuperAdminDashboard />}

        {isLandlord && activeTab === "dashboard" && summary && (
          <LandlordDashboard summary={summary} />
        )}
        {isLandlord && activeTab === "properties" && <LandlordProperties />}
        {isLandlord && activeTab === "leases" && <LandlordLeases />}
        {isLandlord && activeTab === "payments" && <LandlordPayments />}
        {isLandlord && activeTab === "reports" && <LandlordReports />}
        {isLandlord && activeTab === "settings" && <SaaSSettings />}
        {isLandlord && activeTab === "notifications" && <NotificationsLog />}
        {isLandlord && activeTab === "audit_logs" && <AuditLogViewer />}
      </main>
    </div>
  );
}
