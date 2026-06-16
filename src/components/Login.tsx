/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Building, 
  Lock, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  User, 
  Phone, 
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  Laptop
} from "lucide-react";
import { User as AppUser, Organization, UserRole } from "../types";

interface LoginProps {
  users: AppUser[];
  onAddUser: (newUser: AppUser) => void;
  organizations: Organization[];
  onLoginSuccess: (user: AppUser) => void;
  // Deep-linking params
  initialSignupOrgId?: string;
}

export const Login: React.FC<LoginProps> = ({
  users,
  onAddUser,
  organizations,
  onLoginSuccess,
  initialSignupOrgId
}) => {
  // Mode switcher: "login" or "signup" or "redeem"
  const [viewMode, setViewMode] = useState<"login" | "signup" | "redeem">(
    initialSignupOrgId ? "signup" : "login"
  );

  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("password123"); // Mock prefilled
  const [loginError, setLoginError] = useState("");

  // E-Sign Onboarding Signup Form States
  const [signupOrgId, setSignupOrgId] = useState(initialSignupOrgId || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");

  // Redeem code state (if they manually paste or enter invite code)
  const [manualInviteOrgId, setManualInviteOrgId] = useState("");
  const [redeemError, setRedeemError] = useState("");

  // Copy-paste state feedback
  const [copiedCode, setCopiedCode] = useState(false);

  // Synchronize initialSignupOrgId if it changes
  useEffect(() => {
    if (initialSignupOrgId) {
      setSignupOrgId(initialSignupOrgId);
      setViewMode("signup");
    }
  }, [initialSignupOrgId]);

  // Find organization being signed up
  const selectedOrg = organizations.find(o => o.id === signupOrgId);

  // Authenticate user
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim()) {
      setLoginError("Please enter your email address.");
      return;
    }

    // Attempt matching email
    const matchedUser = users.find(
      u => u.email.toLowerCase() === loginEmail.trim().toLowerCase()
    );

    if (matchedUser) {
      if (!matchedUser.isActive) {
        setLoginError("This user account has been suspended by the platform administrator.");
        return;
      }
      onLoginSuccess(matchedUser);
    } else {
      // Create a friendly fallback or error
      setLoginError("No user account matching this email found in our tenant partitions.");
    }
  };

  // Onboarding Signup Submit
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setSignupSuccess("");

    if (!signupOrgId) {
      setSignupError("Invalid organization invitation reference.");
      return;
    }

    const orgExist = organizations.find(o => o.id === signupOrgId);
    if (!orgExist) {
      setSignupError("Invitation organization token is invalid or expired.");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setSignupError("Administrator First and Last name are required.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setSignupError("Please enter a valid business email address.");
      return;
    }

    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      setSignupError("An administrator or tenant account with this email already exists.");
      return;
    }

    if (!phoneNumber.trim()) {
      setSignupError("Working business phone number is required.");
      return;
    }

    // Create the new Org Owner
    const newOwnerUser: AppUser = {
      id: `user-${firstName.toLowerCase()}-${Date.now().toString().slice(-4)}`,
      uuid: `u-uuid-${Date.now()}`,
      organizationId: signupOrgId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim().toLowerCase(),
      role: "org_owner",
      isActive: true
    };

    onAddUser(newOwnerUser);
    setSignupSuccess(`✓ Account registered! Organization ${orgExist.name} is now e-signed and active.`);

    setTimeout(() => {
      onLoginSuccess(newOwnerUser);
    }, 1500);
  };

  const handleRedeemInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemError("");

    const parsedOrgId = manualInviteOrgId.trim();
    if (!parsedOrgId) {
      setRedeemError("Please enter an Organization Invite ID.");
      return;
    }

    const orgMatched = organizations.find(
      o => o.id === parsedOrgId || o.uuid === parsedOrgId
    );

    if (orgMatched) {
      setSignupOrgId(orgMatched.id);
      setViewMode("signup");
      setRedeemError("");
    } else {
      setRedeemError("Could not find a registered organization matching this Invite Reference code.");
    }
  };

  // Pre-configured Demo Users for easy switcher click-logs
  const demoProfiles = [
    {
      name: "Fatuma Ali",
      roleLabel: "Amani Property Owner",
      role: "org_owner" as UserRole,
      email: "fatuma.ali@amani.com",
      avatarBg: "bg-emerald-100 text-[#006c0c]"
    },
    {
      name: "Jane Doe",
      roleLabel: "Greenwood Tenant (Unit B12)",
      role: "tenant" as UserRole,
      email: "jane.doe@gmail.com",
      avatarBg: "bg-blue-100 text-blue-700"
    },
    {
      name: "Mwangi Karanja",
      roleLabel: "Amani Property Manager",
      role: "property_manager" as UserRole,
      email: "mwangi.k@amani.com",
      avatarBg: "bg-indigo-100 text-indigo-700"
    },
    {
      name: "Super Administrator",
      roleLabel: "SaaS Platform Admin",
      role: "super_admin" as UserRole,
      email: "admin@rentflow.co",
      avatarBg: "bg-purple-100 text-purple-700"
    }
  ];

  const handleDemoLogin = (email: string) => {
    const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      onLoginSuccess(matched);
    } else {
      // Super admin dummy build
      if (email === "admin@rentflow.co") {
        onLoginSuccess({
          id: "system-admin",
          uuid: "sys-uuid-999",
          organizationId: "org-amani",
          firstName: "System",
          lastName: "Administrator",
          phoneNumber: "+254 000 000000",
          email: "admin@rentflow.co",
          role: "super_admin",
          isActive: true
        });
      }
    }
  };

  return (
    <div className="min-h-screen py-10 flex flex-col justify-center items-center px-4 bg-[#f8faf8] relative">
      
      {/* Decorative Brand Accent Background */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-primary" />
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Info Column - SaaS Value Prop & Logo */}
        <div className="lg:col-span-5 flex flex-col justify-between p-8 bg-zinc-900 rounded-3xl text-left text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#006c0c]/10 rounded-full blur-3xl -mr-20 -mt-20" />
          
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Building className="w-5.5 h-5.5" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight block">RentFlow</span>
                <span className="text-[10px] font-mono tracking-widest text-[#4CAF50] uppercase font-bold leading-none">
                  Ledger Engine v1.1
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h1 className="text-2xl font-black tracking-tight leading-snug">
                The Secure Property Trust &amp; Rent Ledger Platform
              </h1>
              <p className="text-sm text-zinc-300 leading-relaxed font-semibold">
                Instant digital tenant onboarding, automated MPesa reconciliation, isolated SaaS partitions, and secure financial audit trials.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-10 relative z-10 border-t border-zinc-800">
            <span className="block text-[10px] font-bold font-mono text-[#4CAF50] uppercase tracking-wider">
              Platform Features
            </span>
            <div className="space-y-2.5">
              {[
                "100% Secure Tenant Schema Isolation",
                "Automated Rent Reminders & e-Logs",
                "Instant Bank & MPesa Outbox Feeds",
                "Superadmin SaaS Controller Portal"
              ].map((feat, i) => (
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

        {/* Right Active Column - Forms (Login/Signup/Redeem) */}
        <div className="lg:col-span-7 flat-card rounded-3xl p-8 flex flex-col justify-between space-y-8 bg-white shadow-xl min-h-[580px]">
          
          {/* Header Area */}
          <div className="text-left space-y-1">
            {viewMode === "login" && (
              <>
                <h2 className="text-2xl font-black text-on-surface tracking-tight">Access Your Portal</h2>
                <p className="text-sm text-on-surface-variant font-semibold">
                  Sign in to your private organization storage partition below.
                </p>
              </>
            )}
            {viewMode === "signup" && (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary text-xs font-bold font-mono uppercase mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> E-Sign Activation Active
                </div>
                <h2 className="text-2xl font-black text-on-surface tracking-tight">Onboard Company owner</h2>
                <p className="text-sm text-on-surface-variant font-semibold">
                  Set up your SuperAdmin Owner account for <span className="text-primary font-black uppercase font-mono">{selectedOrg?.name || "Invited Org"}</span>.
                </p>
              </>
            )}
            {viewMode === "redeem" && (
              <>
                <h2 className="text-2xl font-black text-on-surface tracking-tight">Enter Invitation Code</h2>
                <p className="text-sm text-on-surface-variant font-semibold">
                  Have a private onboarding token from the platform administrator? Redeem it here.
                </p>
              </>
            )}
          </div>

          {/* MAIN FORMS SECTION */}
          <div className="flex-1">
            {viewMode === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-650 font-bold">
                    {loginError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold font-mono text-zinc-650 uppercase">
                    Operator Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. fatuma.ali@amani.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-zinc-250 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold font-mono text-zinc-650 uppercase">
                    Security Passcode
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-zinc-250 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all font-bold text-zinc-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-primary/10 active:scale-98"
                >
                  <span>Authenticate Operator</span>
                  <ArrowRight className="w-4 h-4 stroke-[3px]" />
                </button>
              </form>
            )}

            {viewMode === "signup" && (
              <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-left">
                
                {signupError && (
                  <div className="p-3.5 bg-red-50 border border-red-150 rounded-2xl text-xs text-red-650 font-bold">
                    {signupError}
                  </div>
                )}

                {signupSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-150 rounded-2xl text-xs text-emerald-810 text-[#006c0c] font-black">
                    {signupSuccess}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase">First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mwenda"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-zinc-250 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                      disabled={!!signupSuccess}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase">Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kinoti"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-zinc-250 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                      disabled={!!signupSuccess}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase">Business Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. executive@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-250 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                    disabled={!!signupSuccess}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase">Business Mobile Contact</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +254 712 000 000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-250 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all pb-2"
                    disabled={!!signupSuccess}
                  />
                </div>

                <div className="space-y-1 pb-2">
                  <label className="block text-[10px] font-bold font-mono text-zinc-650 uppercase">Core Admin Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Choose a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-250 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                    disabled={!!signupSuccess}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                  disabled={!!signupSuccess}
                >
                  <Laptop className="w-4 h-4" />
                  <span>Finalize Onboarding &amp; Lock Ledger</span>
                </button>
              </form>
            )}

            {viewMode === "redeem" && (
              <form onSubmit={handleRedeemInvite} className="space-y-4 text-left">
                {redeemError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-650 font-bold">
                    {redeemError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold font-mono text-zinc-650 uppercase">
                    Enter Organization ID / Invite Reference Token
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. org-amani"
                    value={manualInviteOrgId}
                    onChange={(e) => setManualInviteOrgId(e.target.value)}
                    className="w-full px-4 py-3 border border-zinc-250 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all font-mono font-bold uppercase tracking-wider"
                  />
                  <p className="text-[10px] text-zinc-400 font-mono">
                    Can be found on the SuperAdmin panel or of form &quot;org-xxxx-xxxx&quot;.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Redeem Registration Token</span>
                  <ArrowRight className="w-4 h-4 stroke-[3px]" />
                </button>
              </form>
            )}
          </div>

          {/* SANDBOX EVALUATION DEMO ACCOUNTS */}
          <div className="border-t border-zinc-150 pt-6 space-y-4 text-left">
            {viewMode === "login" && (
              <>
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                  <span>Select Sandbox Evaluation Account:</span>
                  <button 
                    onClick={() => setViewMode("redeem")}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Use Onboarding Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Precompiled Evaluation Account Profiles Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {demoProfiles.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleDemoLogin(p.email)}
                      className="p-3 rounded-2xl border border-zinc-200/80 bg-zinc-50 hover:bg-zinc-100 hover:border-primary/40 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${p.avatarBg} flex items-center justify-center text-xs font-extrabold shrink-0`}>
                          {p.name.charAt(0)}
                        </div>
                        <div className="truncate text-left">
                          <p className="text-xs font-black text-on-surface truncate leading-tight">{p.name}</p>
                          <p className="text-[9px] font-mono text-zinc-500 font-bold leading-none truncate mt-0.5 uppercase tracking-wide">{p.roleLabel}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {viewMode !== "login" && (
              <button
                onClick={() => setViewMode("login")}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Operator login screen</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
