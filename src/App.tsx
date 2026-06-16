/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  UserRole, 
  LandlordTab, 
  Property, 
  Block, 
  Unit, 
  Lease, 
  Tenant, 
  Payment, 
  AuditLog, 
  RentNotification,
  User,
  Organization
} from "./types";
import { Header } from "./components/Header";
import { LandlordDashboard } from "./components/LandlordDashboard";
import { LandlordProperties } from "./components/LandlordProperties";
import { LandlordLeases } from "./components/LandlordLeases";
import { LandlordPayments } from "./components/LandlordPayments";
import { NotificationsLog } from "./components/NotificationsLog";
import { AuditLogViewer } from "./components/AuditLogViewer";
import { LandlordReports } from "./components/LandlordReports";
import { TenantDashboard } from "./components/TenantDashboard";
import { SuperAdminDashboard } from "./components/SuperAdminDashboard";
import { Login } from "./components/Login";
import { SaaSSettings } from "./components/SaaSSettings";

import { 
  INITIAL_ORGANIZATIONS,
  INITIAL_USERS,
  INITIAL_PROPERTIES,
  INITIAL_BLOCKS,
  INITIAL_UNITS,
  INITIAL_TENANTS,
  INITIAL_LEASES,
  INITIAL_PAYMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS
} from "./data";

export default function App() {
  // --- Persistent Core State Engine ---
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const saved = localStorage.getItem("rf_organizations");
    return saved ? JSON.parse(saved) : INITIAL_ORGANIZATIONS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("rf_users");
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem("rf_properties");
    return saved ? JSON.parse(saved) : INITIAL_PROPERTIES;
  });

  const [blocks, setBlocks] = useState<Block[]>(() => {
    const saved = localStorage.getItem("rf_blocks");
    return saved ? JSON.parse(saved) : INITIAL_BLOCKS;
  });

  const [units, setUnits] = useState<Unit[]>(() => {
    const saved = localStorage.getItem("rf_units");
    return saved ? JSON.parse(saved) : INITIAL_UNITS;
  });

  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem("rf_tenants");
    return saved ? JSON.parse(saved) : INITIAL_TENANTS;
  });

  const [leases, setLeases] = useState<Lease[]>(() => {
    const saved = localStorage.getItem("rf_leases");
    return saved ? JSON.parse(saved) : INITIAL_LEASES;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem("rf_payments");
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem("rf_audit_logs");
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<RentNotification[]>(() => {
    const saved = localStorage.getItem("rf_notifications");
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // --- UI Routing States ---
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem("rf_is_logged_in") === "true";
    if (saved) {
      const savedRole = localStorage.getItem("rf_current_role");
      return (savedRole as UserRole) || "org_owner";
    }
    return "org_owner";
  });
  const [activeLandlordTab, setActiveLandlordTab] = useState<LandlordTab>("dashboard");

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem("rf_current_user_id");
    return saved || "user-fatuma";
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signup") === "true") return false;
    const saved = localStorage.getItem("rf_is_logged_in");
    return saved === "true" || saved === null;
  });

  // Keep states in sync with local storage
  useEffect(() => {
    localStorage.setItem("rf_current_role", currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem("rf_current_user_id", currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem("rf_is_logged_in", isLoggedIn ? "true" : "false");
  }, [isLoggedIn]);

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    const matched = users.find(u => u.role === role && u.organizationId === activeOrgId) || 
                    users.find(u => u.role === role);
    if (matched) {
      setCurrentUserId(matched.id);
    }
  };

  const handleAddUser = (newUsr: User) => {
    setUsers(prev => [...prev, newUsr]);
    // Create Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user: newUsr.email,
      role: newUsr.role,
      action: "REGISTER_OWNER",
      entity: "User",
      previousValue: "None",
      newValue: `${newUsr.firstName} ${newUsr.lastName} (Owner of Org ${newUsr.organizationId})`,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleSendInvite = (orgId: string, email: string, phone: string, orgName: string, inviteUrl: string) => {
    const newNotif: RentNotification = {
      id: `not-${Date.now()}`,
      channel: email ? "Email" : "SMS",
      trigger: "Tenant Invited",
      recipient: email || phone,
      message: `RentFlow Invitation: Your organization ${orgName} has been successfully provisioned. Set up your administrator credentials and claim ownership: ${inviteUrl}`,
      timestamp: new Date().toLocaleString(),
      status: "Sent"
    };
    setNotifications(prev => [newNotif, ...prev]);

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user: activeDemoUser.email,
      role: activeDemoUser.role,
      action: "SEND_SAAS_INVITATION",
      entity: "Organization",
      previousValue: "None",
      newValue: `Dispatched invitation to ${email || phone}`,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Sync state cleanly to localStorage
  useEffect(() => {
    localStorage.setItem("rf_organizations", JSON.stringify(organizations));
  }, [organizations]);

  useEffect(() => {
    localStorage.setItem("rf_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("rf_properties", JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem("rf_blocks", JSON.stringify(blocks));
  }, [blocks]);

  useEffect(() => {
    localStorage.setItem("rf_units", JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem("rf_tenants", JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem("rf_leases", JSON.stringify(leases));
  }, [leases]);

  useEffect(() => {
    localStorage.setItem("rf_payments", JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem("rf_audit_logs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem("rf_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Determine active demo tenant context
  const activeDemoUser = users.find(u => u.id === currentUserId) || 
                         users.find(u => u.role === currentRole) || {
    id: "system-admin",
    uuid: "sys-uuid-999",
    organizationId: "org-amani",
    firstName: "System",
    lastName: "Administrator",
    phoneNumber: "+254 000 000005",
    email: "admin@rentflow.co",
    role: currentRole,
    isActive: true
  };

  const activeOrgId = currentRole === "super_admin" ? "org-amani" : activeDemoUser.organizationId;
                     
  const activeOrganization = organizations.find(o => o.id === activeOrgId) || INITIAL_ORGANIZATIONS[0];

  // --- Command action handlers ---

  const handleAddProperty = (name: string, location: string, description: string) => {
    const cleanId = `prop-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}`;
    const newProp: Property = {
      id: cleanId,
      uuid: `p-uuid-${Date.now()}`,
      organizationId: activeOrgId,
      name,
      location,
      description,
      status: "Active",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"
    };

    setProperties(prev => [...prev, newProp]);

    // Create Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user: activeDemoUser.email,
      role: activeDemoUser.role,
      action: "CREATE_PROPERTY",
      entity: "Property",
      previousValue: "None",
      newValue: `${name} at ${location}`,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Create Notification
    const newNotif: RentNotification = {
      id: `not-${Date.now()}`,
      channel: "SMS",
      trigger: "Property Provisioned",
      recipient: activeDemoUser.phoneNumber,
      message: `RentFlow Alert: Property ${name} has been provisioned successfully. ID: ${cleanId}.`,
      timestamp: new Date().toLocaleString(),
      status: "Sent"
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Update Organization Units Telemetry safely
    setOrganizations(prev => prev.map(o => {
      if (o.id === activeOrgId) {
        return { ...o, activeUnitsCount: o.activeUnitsCount + 1 };
      }
      return o;
    }));
  };

  const handleAddBlock = (propertyId: string, name: string) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      uuid: `b-uuid-${Date.now()}`,
      propertyId,
      name
    };
    setBlocks(prev => [...prev, newBlock]);

    // Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user: activeDemoUser.email,
      role: activeDemoUser.role,
      action: "CREATE_PROPERTY_BLOCK",
      entity: "PropertyBlock",
      previousValue: "None",
      newValue: name,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleDeleteBlock = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    setBlocks(prev => prev.filter(b => b.id !== blockId));
    // Dissociate units formerly assigned to this block
    setUnits(prev => prev.map(u => u.blockId === blockId ? { ...u, blockId: null } : u));

    // Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user: activeDemoUser.email,
      role: activeDemoUser.role,
      action: "DELETE_PROPERTY_BLOCK",
      entity: "PropertyBlock",
      previousValue: block.name,
      newValue: "Deleted",
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleAddUnit = (
    propertyId: string,
    blockId: string | null,
    unitCode: string,
    rentAmount: number,
    status: Unit["status"]
  ) => {
    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      uuid: `unit-uuid-${Date.now()}`,
      organizationId: activeOrgId,
      propertyId,
      blockId,
      unitCode,
      rentAmount,
      status
    };
    setUnits(prev => [...prev, newUnit]);

    // Audit trace
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user: activeDemoUser.email,
      role: activeDemoUser.role,
      action: "PROVISION_UNIT",
      entity: "Unit",
      previousValue: "None",
      newValue: `Unit ${unitCode} (Rent: KSh ${rentAmount})`,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleDeleteUnit = (unitId: string) => {
    const targetUnit = units.find(u => u.id === unitId);
    setUnits(prev => prev.filter(u => u.id !== unitId));

    if (targetUnit) {
      // Audit log
      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        user: activeDemoUser.email,
        role: activeDemoUser.role,
        action: "DELETE_UNIT",
        entity: "Unit",
        previousValue: targetUnit.unitCode,
        newValue: "Deleted",
        timestamp: new Date().toLocaleString()
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  const handleUpdateUnitStatus = (unitId: string, status: Unit["status"]) => {
    const previousUnit = units.find(u => u.id === unitId);
    setUnits(prev => prev.map(u => (u.id === unitId ? { ...u, status } : u)));

    if (previousUnit) {
      // Audit log
      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        user: activeDemoUser.email,
        role: activeDemoUser.role,
        action: "UPDATE_UNIT_STATUS",
        entity: "Unit",
        previousValue: previousUnit.status,
        newValue: status,
        timestamp: new Date().toLocaleString()
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  const handleDraftLease = (
    tenantData: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      nationalId: string;
    },
    leaseData: {
      unitId: string;
      monthlyRent: number;
      securityDeposit: number;
      startDate: string;
      endDate: string;
    }
  ) => {
    const generatedTenantId = `tenant-${Date.now()}`;
    const generatedLeaseId = `lease-${Date.now()}`;

    // Create Invited Tenant
    const newTenant: Tenant = {
      id: generatedTenantId,
      uuid: `t-uuid-${Date.now()}`,
      organizationId: activeOrgId,
      firstName: tenantData.firstName,
      lastName: tenantData.lastName,
      phoneNumber: tenantData.phoneNumber,
      email: tenantData.email,
      nationalId: tenantData.nationalId,
      status: "Invited"
    };

    // Create Draft Lease
    const newLease: Lease = {
      id: generatedLeaseId,
      uuid: `l-uuid-${Date.now()}`,
      organizationId: activeOrgId,
      tenantId: generatedTenantId,
      unitId: leaseData.unitId,
      monthlyRent: leaseData.monthlyRent,
      securityDeposit: leaseData.securityDeposit,
      startDate: leaseData.startDate,
      endDate: leaseData.endDate,
      status: "Draft"
    };

    // Auto update assigned Unit status to Reserved
    setUnits(prev => prev.map(u => u.id === leaseData.unitId ? { ...u, status: "Reserved" } : u));

    // Save
    setTenants(prev => [...prev, newTenant]);
    setLeases(prev => [...prev, newLease]);

    // Send Simulated Outbound Invitation SMS
    const newNotif: RentNotification = {
      id: `not-${Date.now()}`,
      channel: "SMS",
      trigger: "Tenant Invited",
      recipient: tenantData.phoneNumber,
      message: `${activeOrganization.name} has invited you to activate your RentFlow portal. E-sign lease for your unit at: https://rentflow.co/esign`,
      timestamp: new Date().toLocaleString(),
      status: "Sent"
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Audit logs entry
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user: activeDemoUser.email,
      role: activeDemoUser.role,
      action: "INVITE_TENANT",
      entity: "Lease",
      previousValue: "None",
      newValue: `Invited ${tenantData.firstName} ${tenantData.lastName} (Draft Lease ID: ${generatedLeaseId})`,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Change current simulated user email dynamically to match newly invited email
    // This allows seamless click-testing in the UI, enabling instant role testing!
    setUsers(prev => prev.map(u => u.role === "tenant" ? { 
      ...u, 
      email: tenantData.email,
      firstName: tenantData.firstName,
      lastName: tenantData.lastName,
      phoneNumber: tenantData.phoneNumber
    } : u));
  };

  const handleAcceptLease = (leaseId: string) => {
    const targetLease = leases.find(l => l.id === leaseId);
    if (!targetLease) return;

    // Mutate Lease to Active
    setLeases(prev => prev.map(l => l.id === leaseId ? { ...l, status: "Active" } : l));

    // Mutate Tenant to Active
    setTenants(prev => prev.map(t => t.id === targetLease.tenantId ? { ...t, status: "Active" } : t));

    // Mutate Unit status to Occupied
    setUnits(prev => prev.map(u => u.id === targetLease.unitId ? { ...u, status: "Occupied" } : u));

    // Audit
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user: activeDemoUser.email,
      role: activeDemoUser.role,
      action: "E_SIGN_LEASE",
      entity: "Lease",
      previousValue: "Draft",
      newValue: "Active (Tenancy Activated)",
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // SMS outbox confirmation
    const tPhone = tenants.find(t => t.id === targetLease.tenantId)?.phoneNumber || "+254700000";
    const newNotif: RentNotification = {
      id: `not-${Date.now()}`,
      channel: "SMS",
      trigger: "Payment Verified", // Active notification channel
      recipient: tPhone,
      message: `RentFlow Confirmation: Your e-signatures were locked successfully. Tenancy at ${activeOrganization.name} is now ACTIVE.`,
      timestamp: new Date().toLocaleString(),
      status: "Sent"
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleVerifyPayment = (paymentId: string, status: Payment["status"], notes: string) => {
    const targetPayment = payments.find(p => p.id === paymentId);
    if (!targetPayment) return;

    setPayments(prev => prev.map(p => p.id === paymentId ? { 
      ...p, 
      status, 
      verificationNotes: notes, 
      verifiedBy: activeDemoUser.email 
    } : p));

    // Audit logs
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user: activeDemoUser.email,
      role: activeDemoUser.role,
      action: "RECONCILE_PAYMENT",
      entity: "Payment",
      previousValue: targetPayment.status,
      newValue: `${status} (Code: ${targetPayment.transactionCode})`,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Spool communication confirmation back to tenant
    const lease = leases.find(l => l.id === targetPayment.leaseId);
    const tenant = lease ? tenants.find(t => t.id === lease.tenantId) : null;
    if (tenant) {
      const newNotif: RentNotification = {
        id: `not-${Date.now()}`,
        channel: "SMS",
        trigger: `Payment ${status}`,
        recipient: tenant.phoneNumber,
        message: `RentFlow Notice: Your payment of KSh ${targetPayment.amount.toLocaleString()} with code ${targetPayment.transactionCode} was marked as ${status.toUpperCase()} by auditing team.`,
        timestamp: new Date().toLocaleString(),
        status: "Sent"
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const handleSubmitPaymentReceipt = (
    amount: number,
    method: Payment["paymentMethod"],
    referenceCode: string,
    notes: string,
    leaseId: string,
    receiptAttachment?: string
  ) => {
    const newPay: Payment = {
      id: `pay-${Date.now()}`,
      uuid: `pay-uuid-${Date.now()}`,
      organizationId: activeOrgId,
      leaseId,
      amount,
      paymentMethod: method,
      transactionCode: referenceCode.toUpperCase(),
      paymentDate: new Date().toISOString().split("T")[0],
      submittedBy: `${activeDemoUser.firstName} ${activeDemoUser.lastName}`,
      verifiedBy: null,
      verificationNotes: notes,
      status: "Pending",
      createdAt: new Date().toISOString(),
      receiptAttachment
    };

    setPayments(prev => [newPay, ...prev]);

    // Audit Trace Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user: activeDemoUser.email,
      role: activeDemoUser.role,
      action: "SUBMIT_PAYMENT_RECEIPT",
      entity: "Payment",
      previousValue: "None",
      newValue: `Pending Verification (Ref: ${referenceCode})`,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Trigger Notification for accountant or property manager
    const accountant = users.find(u => u.role === "accountant" && u.organizationId === activeOrgId);
    if (accountant) {
      const newNotif: RentNotification = {
        id: `not-${Date.now()}`,
        channel: "In-App",
        trigger: "Payment Submitted",
        recipient: accountant.email,
        message: `New payment submission received for Lease transaction matching review. Code: ${referenceCode}.`,
        timestamp: new Date().toLocaleString(),
        status: "Sent"
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const handleToggleOrgActive = (id: string) => {
    setOrganizations(prev => prev.map(o => o.id === id ? { ...o, isActive: !o.isActive } : o));
  };

  const handleAddOrganization = (name: string, subscriptionPlan: "Starter" | "Growth" | "Enterprise"): string => {
    const cleanId = `org-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}`;
    const newOrg: Organization = {
      id: cleanId,
      uuid: `org-uuid-${Date.now()}`,
      name,
      subscriptionPlan,
      isActive: true,
      activeUnitsCount: 0
    };
    setOrganizations(prev => [...prev, newOrg]);

    // Create Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user: activeDemoUser.email,
      role: activeDemoUser.role,
      action: "CREATE_ORGANIZATION",
      entity: "Organization",
      previousValue: "None",
      newValue: `${name} (${subscriptionPlan} Plan)`,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
    return cleanId;
  };

  const handleUpdateOrgSubscription = (orgId: string, plan: "Starter" | "Growth" | "Enterprise") => {
    setOrganizations(prev => prev.map(o => o.id === orgId ? { ...o, subscriptionPlan: plan } : o));
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user: activeDemoUser.email,
      role: activeDemoUser.role,
      action: "UPDATE_SUBSCRIPTION",
      entity: "Organization",
      previousValue: activeOrganization.subscriptionPlan,
      newValue: `Updated subscription tier to ${plan}`,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateOrganizationDetails = (orgId: string, name: string) => {
    setOrganizations(prev => prev.map(o => o.id === orgId ? { ...o, name } : o));
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user: activeDemoUser.email,
      role: activeDemoUser.role,
      action: "UPDATE_ORG_PROFILE",
      entity: "Organization",
      previousValue: activeOrganization.name,
      newValue: `Renamed organization legal name profile to ${name}`,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const pendingCount = payments.filter(p => p.status === "Pending" && p.organizationId === activeOrganization.id).length;

  const queryParams = new URLSearchParams(window.location.search);
  const initialSignupOrgId = queryParams.get("inviteOrgId") || undefined;

  if (!isLoggedIn) {
    return (
      <Login
        users={users}
        onAddUser={handleAddUser}
        organizations={organizations}
        onLoginSuccess={(user) => {
          localStorage.setItem("rf_is_logged_in", "true");
          if (window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          setCurrentUserId(user.id);
          setCurrentRole(user.role);
          setIsLoggedIn(true);
        }}
        initialSignupOrgId={initialSignupOrgId}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-zinc-900 flex flex-col justify-between selection:bg-primary/20 select-none">
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        
        {/* Sticky Header Selector */}
        <Header
          currentUser={activeDemoUser}
          organization={activeOrganization}
          currentRole={currentRole}
          onChangeUserRole={handleRoleChange}
          activeLandlordTab={activeLandlordTab}
          setActiveLandlordTab={setActiveLandlordTab}
          pendingCount={pendingCount}
          onLogout={() => {
            localStorage.setItem("rf_is_logged_in", "false");
            setIsLoggedIn(false);
          }}
        />

        {/* Workspace Frame */}
        <main className="max-w-7xl w-full mx-auto px-4 md:px-8 py-8 flex-1">
          {currentRole === "super_admin" ? (
            <SuperAdminDashboard
              organizations={organizations}
              allPayments={payments}
              users={users}
              onToggleOrgActive={handleToggleOrgActive}
              onAddOrganization={handleAddOrganization}
              onSendInvite={handleSendInvite}
            />
          ) : currentRole === "tenant" ? (
            <TenantDashboard
              currentUser={activeDemoUser}
              payments={payments}
              leases={leases}
              tenants={tenants}
              units={units}
              properties={properties}
              onSubmitPayment={handleSubmitPaymentReceipt}
              onAcceptLease={handleAcceptLease}
            />
          ) : (
            <div>
              {/* Landlord Routing Workspaces */}
              {activeLandlordTab === "dashboard" && (
                <LandlordDashboard
                  organization={activeOrganization}
                  currentUser={activeDemoUser}
                  properties={properties}
                  units={units}
                  leases={leases}
                  payments={payments}
                  activities={auditLogs.map(l => ({
                    id: l.id,
                    text: l.action.replaceAll("_", " "),
                    boldText: l.newValue,
                    time: l.timestamp,
                    type: l.entity
                  }))}
                  setActiveTab={setActiveLandlordTab}
                  onAddProperty={(name, loc, unitsPlan) => handleAddProperty(name, loc, `Development plot with ${unitsPlan} rooms.`)}
                />
              )}

              {activeLandlordTab === "properties" && (
                <LandlordProperties
                  currentUser={activeDemoUser}
                  organization={activeOrganization}
                  properties={properties}
                  blocks={blocks}
                  units={units}
                  onAddProperty={handleAddProperty}
                  onAddBlock={handleAddBlock}
                  onAddUnit={handleAddUnit}
                  onDeleteUnit={handleDeleteUnit}
                  onDeleteBlock={handleDeleteBlock}
                  onUpdateUnitStatus={handleUpdateUnitStatus}
                />
              )}

              {activeLandlordTab === "leases" && (
                <LandlordLeases
                  currentUser={activeDemoUser}
                  organization={activeOrganization}
                  leases={leases}
                  tenants={tenants}
                  units={units}
                  properties={properties}
                  onDraftLease={handleDraftLease}
                />
              )}

              {activeLandlordTab === "payments" && (
                <LandlordPayments
                  currentUser={activeDemoUser}
                  organization={activeOrganization}
                  payments={payments}
                  leases={leases}
                  tenants={tenants}
                  units={units}
                  properties={properties}
                  onVerifyPayment={handleVerifyPayment}
                />
              )}

              {activeLandlordTab === "notifications" && (
                <NotificationsLog
                  organization={activeOrganization}
                  notifications={notifications}
                />
              )}

              {activeLandlordTab === "audit_logs" && (
                <AuditLogViewer
                  organization={activeOrganization}
                  auditLogs={auditLogs}
                />
              )}

              {activeLandlordTab === "reports" && (
                <LandlordReports
                  organization={activeOrganization}
                  properties={properties}
                  units={units}
                  leases={leases}
                  payments={payments}
                />
              )}

              {activeLandlordTab === "settings" && (
                <SaaSSettings
                  currentUser={activeDemoUser}
                  organization={activeOrganization}
                  users={users}
                  onAddUser={handleAddUser}
                  properties={properties}
                  auditLogs={auditLogs}
                  onUpdateOrgSubscription={handleUpdateOrgSubscription}
                  onUpdateOrganizationDetails={handleUpdateOrganizationDetails}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* High-fidelity CSS footer */}
      <footer className="bg-zinc-90 w-full text-center py-5 border-t border-zinc-200 text-xs text-zinc-500 font-medium bg-white">
        RentFlow Foundational Property Ledger Platform V1 • Compliant Multi-Tenant Tenant Isolation Bounds Enabled
      </footer>
    </div>
  );
}
