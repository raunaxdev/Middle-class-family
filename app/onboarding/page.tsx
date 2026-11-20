"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLedger } from "@/lib/context/ledger-context";
import {
  Home,
  Users,
  UserPlus,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Building,
  User,
  IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import { isValidFamilyCode } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, family, createFamily, joinFamily, authLoading, isLoaded } = useLedger();

  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  // Option A: Create
  const [headFullName, setHeadFullName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("45000");
  const [isCreating, setIsCreating] = useState(false);

  // Option B: Join
  const [memberFullName, setMemberFullName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Auto-fill user name if available
  useEffect(() => {
    if (user?.name) {
      setHeadFullName(user.name);
      setMemberFullName(user.name);
    }
  }, [user]);

  // If already linked to family, go to dashboard
  useEffect(() => {
    if (!authLoading && isLoaded) {
      if (!user) {
        router.push("/login");
      } else if (family) {
        router.push("/dashboard");
      }
    }
  }, [user, family, authLoading, isLoaded, router]);

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    if (!headFullName.trim() || !familyName.trim()) {
      toast.error("Please enter your name and family name");
      return;
    }

    const budgetNum = Number(monthlyBudget);
    if (!Number.isFinite(budgetNum) || budgetNum < 1000 || budgetNum > 9_999_999_999.99) {
      toast.error("Enter a valid monthly budget");
      return;
    }
    setIsCreating(true);

    try {
      const newFam = await createFamily(familyName.trim(), budgetNum, headFullName.trim());
      // Welcome banner query param
      router.push(`/dashboard?welcome=head&code=${newFam.join_code}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create family";
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isJoining) return;
    if (!memberFullName.trim() || !isValidFamilyCode(joinCode.trim())) {
      toast.error("Please enter your name and the 6-digit family code");
      return;
    }

    setIsJoining(true);
    try {
      const joinedFam = await joinFamily(joinCode.trim(), memberFullName.trim());
      router.push(`/dashboard?welcome=member&family=${encodeURIComponent(joinedFam.name)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid code or connection failed";
      toast.error(msg);
    } finally {
      setIsJoining(false);
    }
  };

  if (authLoading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" strokeWidth={1.75} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-90 mb-4"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <Home className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-text">
            GrihaLedger
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-text">
          Connect Your Household
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-muted max-w-md mx-auto">
          Every family has one central Family Vault. Choose whether you are setting up the vault or joining one created by a family member.
        </p>

        {/* Option Tabs */}
        <div className="mt-6 inline-flex rounded-lg bg-slate-card p-1 border border-slate-border max-w-sm w-full">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors min-h-[40px] flex items-center justify-center gap-1.5 ${
              activeTab === "create"
                ? "bg-surface text-primary shadow-sm"
                : "text-slate-muted hover:text-slate-text"
            }`}
          >
            <Building className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Create New Family</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("join")}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors min-h-[40px] flex items-center justify-center gap-1.5 ${
              activeTab === "join"
                ? "bg-surface text-primary shadow-sm"
                : "text-slate-muted hover:text-slate-text"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Join Existing Family</span>
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {/* OPTION A: CREATE FAMILY */}
        {activeTab === "create" && (
          <div className="rounded-xl border border-slate-border bg-surface p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-border mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
                <Users className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-text">Family Head Setup</h2>
                <p className="text-xs text-slate-muted">You will receive a shareable 6-digit Join Code</p>
              </div>
            </div>

            <form onSubmit={handleCreateFamily} className="space-y-4">
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
                    value={headFullName}
                    onChange={(e) => setHeadFullName(e.target.value)}
                    className="w-full rounded-md border border-slate-border bg-surface pl-9 pr-3 py-2 text-sm text-slate-text placeholder:text-slate-subtle focus:border-primary focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-text mb-1">
                  Family / Household Name *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-muted" strokeWidth={1.75} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sharma Parivar, Verma Household"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="w-full rounded-md border border-slate-border bg-surface pl-9 pr-3 py-2 text-sm text-slate-text placeholder:text-slate-subtle focus:border-primary focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-text mb-1">
                  Monthly Target Budget (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-muted">₹</span>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    placeholder="e.g. 45000"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    className="w-full rounded-md border border-slate-border bg-surface pl-7 pr-3 py-2 text-sm text-slate-text placeholder:text-slate-subtle focus:border-primary focus:outline-none min-h-[44px]"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-muted">
                  Used by Parivar AI to alert you if Kirana or bills exceed budget
                </p>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50 transition-colors min-h-[44px]"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                    <span>Creating Family Vault...</span>
                  </>
                ) : (
                  <>
                    <span>Create Vault & Generate Code</span>
                    <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* OPTION B: JOIN FAMILY */}
        {activeTab === "join" && (
          <div className="rounded-xl border border-slate-border bg-surface p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-border mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-alertLight text-amber-alert border border-amber-alertBorder">
                <KeyRound className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-text">Join Family Member</h2>
                <p className="text-xs text-slate-muted">Ask your Family Head for the 6-digit Join Code</p>
              </div>
            </div>

            <form onSubmit={handleJoinFamily} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-text mb-1">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-muted" strokeWidth={1.75} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunita Sharma"
                    value={memberFullName}
                    onChange={(e) => setMemberFullName(e.target.value)}
                    className="w-full rounded-md border border-slate-border bg-surface pl-9 pr-3 py-2 text-sm text-slate-text placeholder:text-slate-subtle focus:border-primary focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-text mb-1">
                  6-Digit Family Join Code *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-muted" strokeWidth={1.75} />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    placeholder="e.g. 849201"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full uppercase font-mono tracking-widest text-center rounded-md border border-slate-border bg-surface px-3 py-2 text-base font-bold text-primary placeholder:text-slate-subtle focus:border-primary focus:outline-none min-h-[44px]"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-muted">
                  Found on the Family Head's dashboard under Family Vault
                </p>
              </div>

              <button
                type="submit"
                disabled={isJoining}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50 transition-colors min-h-[44px]"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Connect & Sync Family Ledger</span>
                    <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
