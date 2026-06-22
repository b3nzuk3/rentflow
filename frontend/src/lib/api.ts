import axios from "axios";
import { LoginResponse, Property, Unit, Tenant, Lease, Payment } from "@/types";

const API_BASE = 'http://172.18.110.243:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    // Don't add auth header for login/signup/refresh endpoints
    const url = config.url || "";
    if (!url.includes("/auth/login") && !url.includes("/auth/signup") && !url.includes("/auth/refresh") && !url.includes("/invitations/") && !url.includes("/activate")) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return axios(error.config);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/";
        }
      }
    }
    return Promise.reject(error);
  }
);

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post("/auth/login", { email, password });
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export async function signup(payload: {
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
}): Promise<LoginResponse> {
  const { data } = await api.post("/auth/signup", payload);
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

export async function getProperties(): Promise<Property[]> {
  const { data } = await api.get("/properties");
  return data;
}

export async function getUnits(propertyId?: string): Promise<Unit[]> {
  const params = propertyId ? { property_id: propertyId } : {};
  const { data } = await api.get("/units", { params });
  return data;
}

export function getStoredUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function storeUser(user: Record<string, unknown> | LoginResponse) {
  localStorage.setItem("user", JSON.stringify(user));
}

// ── Tenants ──────────────────────────────────────────────────────────────────

export async function getTenants(): Promise<Tenant[]> {
  const { data } = await api.get("/tenants");
  return data;
}

export async function createTenant(payload: {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  national_id?: string;
}): Promise<Tenant> {
  const { data } = await api.post("/tenants", payload);
  return data;
}

// ── Leases ───────────────────────────────────────────────────────────────────

export async function getLeases(): Promise<Lease[]> {
  const { data } = await api.get("/leases");
  return data;
}

export async function createLease(payload: {
  tenant_id: string;
  unit_id: string;
  monthly_rent: number;
  security_deposit: number;
  start_date: string;
  end_date: string;
}): Promise<Lease> {
  const { data } = await api.post("/leases", payload);
  return data;
}

export async function signLease(leaseId: string): Promise<Lease> {
  const { data } = await api.patch(`/leases/${leaseId}/sign`);
  return data;
}

export async function deleteLease(leaseId: string): Promise<void> {
  await api.delete(`/leases/${leaseId}`);
}

// ── Payments ─────────────────────────────────────────────────────────────────

export async function getPayments(status?: string): Promise<Payment[]> {
  const params = status && status !== "All" ? { status } : {};
  const { data } = await api.get("/payments", { params });
  return data;
}

export async function verifyPayment(
  paymentId: string,
  status: "Verified" | "Rejected",
  verificationNotes: string
): Promise<Payment> {
  const { data } = await api.patch(`/payments/${paymentId}/verify`, {
    status,
    verification_notes: verificationNotes,
  });
  return data;
}

export async function createPayment(payload: {
  lease_id: string;
  amount: number;
  payment_method: "M-Pesa Paybill" | "M-Pesa Buy Goods" | "Bank Transfer" | "Bank Deposit" | "Cash";
  transaction_code: string;
  payment_date: string;
  verification_notes?: string;
  receipt_attachment?: string;
  payment_type?: "Monthly Rent" | "Advance Payment" | "Arrears" | "Partial Payment" | "Security Deposit";
  billing_period?: string;
}): Promise<Payment> {
  const { data } = await api.post("/payments", payload);
  return data;
}

// ── Tenant Self-Service ──────────────────────────────────────────────────────

export async function getMyTenantProfile() {
  const { data } = await api.get("/tenants/me");
  return data;
}

export async function getMyLeases() {
  const { data } = await api.get("/tenants/me/leases");
  return data;
}

export async function getRentSchedule(leaseId: string) {
  const { data } = await api.get(`/payments/schedule/${leaseId}`);
  return data;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardSummary(): Promise<{
  total_properties: number;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  occupancy_rate: number;
  expected_rent: number;
  collected_rent: number;
  outstanding_rent: number;
  pending_payments: number;
}> {
  const { data } = await api.get("/reports/summary");
  return data;
}

export async function getAuditLogs(limit = 50) {
  const { data } = await api.get(`/audit?limit=${limit}`);
  return data;
}

// ── Invitations ──────────────────────────────────────────────────────────────

export async function inviteTenant(payload: {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  national_id?: string;
  unit_id: string;
  monthly_rent: number;
  security_deposit: number;
  start_date: string;
  end_date: string;
}) {
  const { data } = await api.post("/tenants/invite", payload);
  return data;
}

export async function validateInvitation(token: string) {
  const { data } = await api.get(`/invitations/validate?token=${token}`);
  return data;
}

export async function activateInvitation(token: string, password: string) {
  const { data } = await api.post("/invitations/activate", { token, password });
  return data;
}
