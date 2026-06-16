import axios from "axios";
import { LoginResponse } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

export function getStoredUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function storeUser(user: Record<string, unknown>) {
  localStorage.setItem("user", JSON.stringify(user));
}
