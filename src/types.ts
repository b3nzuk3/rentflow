/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Organization {
  id: string; // URL-safe id
  uuid: string;
  name: string;
  subscriptionPlan: "Starter" | "Growth" | "Enterprise";
  isActive: boolean;
  activeUnitsCount: number;
}

export type UserRole = "super_admin" | "org_owner" | "property_manager" | "accountant" | "caretaker" | "tenant";

export interface User {
  id: string;
  uuid: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface Property {
  id: string; // e.g., "greenwood"
  uuid: string;
  organizationId: string;
  name: string;
  location: string;
  description: string;
  status: "Active" | "Inactive";
  image?: string;
}

export interface Block {
  id: string;
  uuid: string;
  propertyId: string; // e.g., "greenwood"
  name: string; // e.g., "Block A", "Block B"
}

export interface Unit {
  id: string;
  uuid: string;
  organizationId: string;
  propertyId: string;
  blockId: string | null; // Optional layer
  unitCode: string; // e.g., "B12"
  rentAmount: number;
  status: "Vacant" | "Reserved" | "Occupied" | "Notice Given" | "Under Maintenance";
}

export interface Tenant {
  id: string;
  uuid: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  nationalId: string;
  status: "Invited" | "Active" | "Notice Given" | "Moved Out" | "Blacklisted";
}

export interface Lease {
  id: string;
  uuid: string;
  organizationId: string;
  tenantId: string;
  unitId: string;
  monthlyRent: number;
  securityDeposit: number;
  startDate: string;
  endDate: string;
  status: "Draft" | "Active" | "Expired" | "Terminated" | "Completed";
}

export interface Payment {
  id: string;
  uuid: string;
  organizationId: string;
  leaseId: string;
  amount: number;
  paymentMethod: "M-Pesa Paybill" | "M-Pesa Buy Goods" | "Bank Transfer" | "Bank Deposit" | "Cash";
  transactionCode: string; // Must be unique
  paymentDate: string;
  submittedBy: string; // user name/identifier
  verifiedBy: string | null; // accountant or property manager email/name
  verificationNotes: string;
  status: "Pending" | "Verified" | "Rejected" | "Refunded";
  createdAt: string;
  receiptAttachment?: string; // Base64 data or Mock payment slip URL
}

export interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  entity: string; // User, Lease, Payment
  previousValue: string;
  newValue: string;
  timestamp: string;
}

export interface RentNotification {
  id: string;
  channel: "SMS" | "Email" | "In-App";
  trigger: string; // e.g., "Tenant Invited", "Rent Due", "Rent Overdue", "Payment Submitted", "Payment Verified", "Payment Rejected", "Lease Expiring"
  recipient: string;
  message: string;
  timestamp: string;
  status: "Sent" | "Pending";
}

// For UI tabs
export type LandlordTab = "dashboard" | "properties" | "leases" | "payments" | "notifications" | "audit_logs" | "reports" | "settings";
