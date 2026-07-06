export type UserRole = "super_admin" | "org_owner" | "property_manager" | "accountant" | "caretaker" | "tenant";

export type LandlordTab = "dashboard" | "properties" | "leases" | "payments" | "notifications" | "audit_logs" | "reports" | "settings";

export interface Organization {
  id: string;
  name: string;
  subscription_plan: "Starter" | "Growth" | "Enterprise";
  is_active: boolean;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  tax_pin?: string;
  reg_number?: string;
  business_type?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  assigned_property_ids?: string[];
}

export interface Property {
  id: string;
  organization_id: string;
  name: string;
  location: string;
  description: string | null;
  status: "Active" | "Inactive";
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  property_id: string;
  name: string;
}

export interface Unit {
  id: string;
  organization_id: string;
  property_id: string;
  block_id: string | null;
  unit_code: string;
  rent_amount: number;
  status: "Vacant" | "Reserved" | "Occupied" | "Notice Given" | "Under Maintenance";
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  national_id: string | null;
  status: "Invited" | "Active" | "Notice Given" | "Moved Out" | "Blacklisted";
  created_at: string;
  updated_at: string;
}

export interface Lease {
  id: string;
  organization_id: string;
  tenant_id: string;
  unit_id: string;
  monthly_rent: number;
  security_deposit: number;
  start_date: string;
  end_date: string;
  status: "Draft" | "Active" | "Expired" | "Terminated" | "Completed";
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  organization_id: string;
  lease_id: string;
  amount: number;
  payment_method: "M-Pesa Paybill" | "M-Pesa Buy Goods" | "Bank Transfer" | "Bank Deposit" | "Cash";
  transaction_code: string;
  payment_date: string;
  submitted_by: string;
  verified_by: string | null;
  verification_notes: string | null;
  status: "Pending" | "Verified" | "Rejected" | "Refunded";
  receipt_attachment: string | null;
  payment_type: "Monthly Rent" | "Advance Payment" | "Arrears" | "Partial Payment" | "Security Deposit";
  billing_period: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentSchedule {
  id: string;
  organization_id: string;
  lease_id: string;
  billing_period: string;
  period_start: string;
  period_end: string;
  expected_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentRollItem {
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  unit_code: string;
  property_name: string;
  monthly_rent: number;
  expected_amount: number;
  paid_amount: number;
  balance: number;
  status: string; // "Pending" | "Paid" | "Partial" | "Overdue" | "Advance"
  due_date: string | null;
  lease_id: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: string;
  entity: string;
  previous_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  organization_id: string;
  channel: "SMS" | "Email" | "In-App";
  trigger_type: string;
  recipient: string;
  message: string;
  status: "Sent" | "Pending";
  created_at: string;
}

export interface DashboardSummary {
  total_properties: number;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  occupancy_rate: number;
  expected_rent: number;
  collected_rent: number;
  outstanding_rent: number;
  pending_payments: number;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  role: string;
  first_name: string;
  last_name: string;
  organization_id: string;
}
