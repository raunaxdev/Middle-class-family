"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLedger } from "@/lib/context/ledger-context";
import { Home, Lock, Mail, User, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { user, family, signIn, signUp, authLoading } = useLedger();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, route appropriately
  useEffect(() => {
    if (!authLoading && user) {
      if (family) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    }
  }, [user, family, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in both email and password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        const res = await signUp(email.trim(), password, fullName.trim());
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Account created successfully!");
          router.push("/onboarding");
        }
      } else {
        const res = await signIn(email.trim(), password);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Signed in successfully!");
          // useEffect will redirect to dashboard or onboarding
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <Home className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-text">
            GrihaLedger
          </span>
        </Link>
        <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-slate-text">
          {mode === "signin" ? "Sign In to Your Family Vault" : "Create Your Family Account"}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-muted">
          {mode === "signin"
            ? "Enter your email credentials to access your household ledger"
            : "Get started at ₹0 operational cost with family-scoped data access"}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-slate-border bg-surface p-6 sm:p-8 shadow-sm">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-2 mb-6 rounded-lg bg-slate-card p-1 border border-slate-border">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`py-2 text-xs font-semibold rounded-md transition-colors min-h-[40px] ${
                mode === "signin"
                  ? "bg-surface text-slate-text shadow-sm"
                  : "text-slate-muted hover:text-slate-text"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`py-2 text-xs font-semibold rounded-md transition-colors min-h-[40px] ${
                mode === "signup"
                  ? "bg-surface text-slate-text shadow-sm"
                  : "text-slate-muted hover:text-slate-text"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-text mb-1">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-muted" strokeWidth={1.75} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-md border border-slate-border bg-surface pl-9 pr-3 py-2 text-sm text-slate-text placeholder:text-slate-subtle focus:border-primary focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-text mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-muted" strokeWidth={1.75} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-border bg-surface pl-9 pr-3 py-2 text-sm text-slate-text placeholder:text-slate-subtle focus:border-primary focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-text mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-muted" strokeWidth={1.75} />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-slate-border bg-surface pl-9 pr-3 py-2 text-sm text-slate-text placeholder:text-slate-subtle focus:border-primary focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50 transition-colors min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{mode === "signin" ? "Sign In" : "Continue to Setup Family"}</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-border text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-muted">
              <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={1.75} />
              <span>Free Tier Cloud Architecture • Zero Data Selling</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
