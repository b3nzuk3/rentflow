"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building, Lock, Mail, ArrowRight, Check, Sparkles, Laptop } from "lucide-react";
import { login, signup, storeUser } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setLoggedIn } = useAuthStore();
  const [viewMode, setViewMode] = useState<"login" | "signup">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [signupOrgId, setSignupOrgId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const data = await login(loginEmail, loginPassword);
      storeUser(data);
      setUser({ id: data.user_id, email: loginEmail, role: data.role, first_name: data.first_name, last_name: data.last_name, organization_id: data.organization_id, phone_number: "", is_active: true, created_at: "" } as any);
      setCurrentRole(data.role as any);
      setLoggedIn(true);
      router.push("/dashboard");
    } catch (err: any) {
      setLoginError(err.response?.data?.detail || "Login failed");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    try {
      const data = await signup({ organization_id: signupOrgId, first_name: firstName, last_name: lastName, email, phone_number: phoneNumber, password });
      setSignupSuccess("Account registered! Redirecting...");
      setTimeout(() => {
        storeUser(data);
        setUser({ id: data.user_id, email, role: data.role, first_name: data.first_name, last_name: data.last_name, organization_id: data.organization_id, phone_number: phoneNumber, is_active: true, created_at: "" } as any);
        setLoggedIn(true);
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setSignupError(err.response?.data?.detail || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen py-10 flex flex-col justify-center items-center px-4 bg-background-custom relative">
      <div className="absolute top-0 inset-x-0 h-1.5 bg-primary" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Info Column */}
        <div className="lg:col-span-5 flex flex-col justify-between p-8 bg-zinc-900 rounded-3xl text-left text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#006c0c]/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Building className="w-5.5 h-5.5" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight block">RentFlow</span>
                <span className="text-[10px] font-mono tracking-widest text-[#4CAF50] uppercase font-bold leading-none">Ledger Engine v1.1</span>
              </div>
            </div>
            <div className="space-y-4 pt-4">
              <h1 className="text-2xl font-black tracking-tight leading-snug">The Secure Property Trust &amp; Rent Ledger Platform</h1>
              <p className="text-sm text-zinc-300 leading-relaxed font-semibold">Instant digital tenant onboarding, automated MPesa reconciliation, isolated SaaS partitions, and secure financial audit trials.</p>
            </div>
          </div>
          <div className="space-y-4 pt-10 relative z-10 border-t border-zinc-800">
            <span className="block text-[10px] font-bold font-mono text-[#4CAF50] uppercase tracking-wider">Platform Features</span>
            <div className="space-y-2.5">
              {["100% Secure Tenant Schema Isolation", "Automated Rent Reminders & e-Logs", "Instant Bank & MPesa Outbox Feeds", "Superadmin SaaS Controller Portal"].map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-zinc-350">
                  <div className="w-4 h-4 rounded-full bg-primary/25 border border-primary/50 flex items-center justify-center text-primary shrink-0">
                    <Check className="w-2.5 h-2.5 text-[#4CAF50] stroke-[3px]" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-7 flat-card rounded-3xl p-8 flex flex-col justify-between space-y-8 bg-white shadow-xl min-h-[580px]">
          <div className="text-left space-y-1">
            {viewMode === "login" && (
              <>
                <h2 className="text-2xl font-black text-on-surface tracking-tight">Access Your Portal</h2>
                <p className="text-sm text-on-surface-variant font-semibold">Sign in to your organization account below.</p>
              </>
            )}
            {viewMode === "signup" && (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary text-xs font-bold font-mono uppercase mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> E-Sign Activation Active
                </div>
                <h2 className="text-2xl font-black text-on-surface tracking-tight">Onboard Company owner</h2>
                <p className="text-sm text-on-surface-variant font-semibold">Set up your SuperAdmin Owner account.</p>
              </>
            )}
          </div>

          <div className="flex-1">
            {viewMode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                {loginError && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-650 font-bold">{loginError}</div>}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold font-mono text-zinc-650 uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                    <input type="email" required placeholder="e.g. owner@rentflow.io" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-zinc-250 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all font-bold" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold font-mono text-zinc-650 uppercase">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                    <input type="password" required placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-zinc-250 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all font-bold text-zinc-600" />
                  </div>
                </div>
                <button type="submit" className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-primary/10 active:scale-98">
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 stroke-[3px]" />
                </button>

                <button type="button" onClick={() => setViewMode("signup")} className="w-full text-center text-xs text-primary font-bold hover:underline pt-2">
                  New organization? Sign up here
                </button>
              </form>
            )}

            {viewMode === "signup" && (
              <form onSubmit={handleSignup} className="space-y-3.5 text-left">
                {signupError && <div className="p-3.5 bg-red-50 border border-red-150 rounded-2xl text-xs text-red-650 font-bold">{signupError}</div>}
                {signupSuccess && <div className="p-3.5 bg-emerald-50 border border-emerald-150 rounded-2xl text-xs text-emerald-810 font-black">{signupSuccess}</div>}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase">Organization ID</label>
                  <input type="text" required placeholder="e.g. org-amani" value={signupOrgId} onChange={(e) => setSignupOrgId(e.target.value)} className="w-full px-3.5 py-2 border border-zinc-250 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all font-mono" disabled={!!signupSuccess} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase">First Name</label>
                    <input type="text" required placeholder="e.g. Mwenda" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3.5 py-2 border border-zinc-250 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all" disabled={!!signupSuccess} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase">Last Name</label>
                    <input type="text" required placeholder="e.g. Kinoti" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3.5 py-2 border border-zinc-250 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all" disabled={!!signupSuccess} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase">Business Email</label>
                  <input type="email" required placeholder="e.g. executive@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3.5 py-2 border border-zinc-250 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all" disabled={!!signupSuccess} />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase">Business Mobile Contact</label>
                  <input type="text" required placeholder="e.g. +254 712 000 000" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full px-3.5 py-2 border border-zinc-250 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all" disabled={!!signupSuccess} />
                </div>
                <div className="space-y-1 pb-2">
                  <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase">Core Admin Password</label>
                  <input type="password" required placeholder="Choose a strong password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3.5 py-2 border border-zinc-250 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all" disabled={!!signupSuccess} />
                </div>
                <button type="submit" className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98" disabled={!!signupSuccess}>
                  <Laptop className="w-4 h-4" />
                  <span>Finalize Onboarding &amp; Lock Ledger</span>
                </button>
                <button type="button" onClick={() => setViewMode("login")} className="w-full text-center text-xs text-primary font-bold hover:underline">
                  Already have an account? Sign in
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
