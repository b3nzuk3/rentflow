"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { validateInvitation, activateInvitation } from "@/lib/api";
import { Building, Lock, User, Check, X, AlertTriangle } from "lucide-react";

export default function ActivatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<{
    email: string;
    tenant_name: string;
    property_name: string;
    unit_code: string;
  } | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided.");
      setValidating(false);
      return;
    }
    validateInvitation(token)
      .then((data) => {
        if (data.valid) {
          setValid(true);
          setInfo({
            email: data.email || "",
            tenant_name: data.tenant_name || "",
            property_name: data.property_name || "",
            unit_code: data.unit_code || "",
          });
        } else {
          setError(data.error || "Invalid invitation.");
        }
      })
      .catch(() => setError("Failed to validate invitation."))
      .finally(() => setValidating(false));
  }, [token]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await activateInvitation(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to activate account.");
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-custom">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-on-surface-variant">Validating your invitation...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-custom px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface">Account Activated!</h1>
          <p className="text-sm text-on-surface-variant">
            Your account has been created successfully. You can now log in to access your tenant portal.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-custom px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface">Invitation Error</h1>
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <p className="text-xs text-on-surface-variant">
            If you believe this is an error, please contact your property manager.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-custom px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-900 p-6 text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Building className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Welcome to RentFlow</h1>
          <p className="text-sm text-zinc-400 mt-1">Activate your tenant account</p>
        </div>

        {/* Lease info */}
        {info && (
          <div className="px-6 pt-5 pb-2">
            <div className="bg-surface-container rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs">
                <User className="w-3.5 h-3.5 text-primary" />
                <span className="font-bold text-on-surface">{info.tenant_name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Building className="w-3.5 h-3.5 text-on-surface-variant" />
                <span className="font-medium text-on-surface-variant">{info.property_name} — {info.unit_code}</span>
              </div>
              <div className="text-[10px] font-mono text-on-surface-variant">{info.email}</div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-6 pt-3">
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleActivate} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">
              Set Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                minLength={8}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Activating...
              </>
            ) : (
              "Activate Account"
            )}
          </button>

          <p className="text-[10px] text-on-surface-variant text-center">
            This invitation link expires in 7 days. If it has expired, contact your property manager for a new one.
          </p>
        </form>
      </div>
    </div>
  );
}
