import { create } from "zustand";
import { UserRole, Organization, User } from "@/types";

interface AuthState {
  user: User | null;
  organization: Organization | null;
  currentRole: UserRole;
  isLoggedIn: boolean;
  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
  setCurrentRole: (role: UserRole) => void;
  setLoggedIn: (loggedIn: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  organization: null,
  currentRole: "org_owner",
  isLoggedIn: false,
  setUser: (user) => set({ user }),
  setOrganization: (organization) => set({ organization }),
  setCurrentRole: (currentRole) => set({ currentRole }),
  setLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
  logout: () =>
    set({
      user: null,
      organization: null,
      isLoggedIn: false,
      currentRole: "org_owner",
    }),
}));
