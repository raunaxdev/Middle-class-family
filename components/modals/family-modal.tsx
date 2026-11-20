"use client";

import React, { useState } from "react";
import { useLedger } from "@/lib/context/ledger-context";
import { X, Users, Copy, Check, Shield, DollarSign, UserPlus } from "lucide-react";
import { formatRupees } from "@/lib/utils";
import { toast } from "sonner";

interface FamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FamilyModal({ isOpen, onClose }: FamilyModalProps) {
  const { family, updateMonthlyBudget, joinFamily, currentMember } = useLedger();
  const [budgetInput, setBudgetInput] = useState(family ? family.monthly_budget.toString() : "45000");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen || !family) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(family.join_code);
    setCopied(true);
    toast.success(`Copied 6-digit family invite code: ${family.join_code}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(budgetInput);
    if (!Number.isFinite(val) || val <= 0 || val > 9_999_999_999.99) {
      toast.error("Please enter a valid monthly budget amount");
      return;
    }
    await updateMonthlyBudget(val);
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isJoining) return;
    if (!/^\d{6}$/.test(joinCodeInput.trim())) {
      toast.error("Please enter a valid 6-digit Family Join Code");
      return;
    }
    setIsJoining(true);
    try {
      await joinFamily(joinCodeInput.trim(), currentMember?.name || "Family Member");
      setJoinCodeInput("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to join family";
      toast.error(msg);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-border bg-surface p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <Users className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-text">{family.name} Vault</h2>
              <p className="text-xs text-slate-muted">Multi-device sync and family access controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-muted hover:bg-slate-card hover:text-slate-text"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Shareable Family Join Code Card */}
          <div className="rounded-lg bg-primary-light/50 border border-primary-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Family Join Code
                </span>
                <p className="text-xs text-slate-muted mt-0.5">
                  Share with spouse, parents, or children to sync devices instantly.
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-primary-border text-xs font-semibold text-primary shadow-sm hover:bg-primary-light transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center rounded-md bg-white py-2.5 border border-primary-border">
              <span className="font-mono text-xl font-black tracking-widest text-primary">
                {family.join_code}
              </span>
            </div>
          </div>

          {/* Monthly Family Budget */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-text mb-2">
              Monthly Household Target Budget
            </h3>
            <form onSubmit={handleUpdateBudget} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-sm text-slate-muted">₹</span>
                <input
                  type="number"
                  min="1"
                  max="9999999999.99"
                  step="0.01"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full rounded-md border border-slate-border bg-surface pl-7 pr-3 py-2 text-sm text-slate-text focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-md bg-slate-text text-white hover:bg-slate-800 transition-colors"
              >
                Save Budget
              </button>
            </form>
          </div>

          {/* Family Members List */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-text mb-2">
              Connected Family Members ({family.members.length})
            </h3>
            <div className="divide-y divide-slate-border rounded-lg border border-slate-border bg-surface">
              {family.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-xs"
                      style={{ backgroundColor: member.avatar_color }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-text">{member.name}</div>
                      <div className="text-[11px] text-slate-muted">
                        {member.relation} • {member.phone || "No phone"}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      member.role === "Head"
                        ? "bg-primary-light text-primary border border-primary-border"
                        : "bg-slate-card text-slate-muted border border-slate-border"
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Join Another Family Vault */}
          <div className="rounded-lg border border-slate-border p-3.5 bg-slate-card">
            <h3 className="text-xs font-semibold text-slate-text mb-1">
              Join Another Family Vault
            </h3>
            <p className="text-xs text-slate-muted mb-2">
              Have an invite code from another family member? Enter it below:
            </p>
            <form onSubmit={handleJoinFamily} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]{6}"
                placeholder="e.g. 849201"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="flex-1 uppercase font-mono rounded-md border border-slate-border bg-surface px-3 py-1.5 text-xs text-slate-text focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={isJoining}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-white hover:bg-primary-hover transition-colors"
              >
                Join Vault
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
