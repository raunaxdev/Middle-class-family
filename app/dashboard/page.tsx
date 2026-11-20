"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLedger } from "@/lib/context/ledger-context";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { QuickCommandBar } from "@/components/ai/quick-command-bar";
import { AddItemModal } from "@/components/modals/add-item-modal";
import { FamilyModal } from "@/components/modals/family-modal";
import { CustomCategoryModal } from "@/components/modals/custom-category-modal";
import {
  ShoppingBag,
  Milk,
  HeartPulse,
  GraduationCap,
  Receipt,
  ArrowLeftRight,
  PiggyBank,
  Plus,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Flame,
  ChevronRight,
  Loader2,
  X,
  Copy,
  Check,
} from "lucide-react";
import { formatRupees, formatDate, getDaysSince, sumMoney } from "@/lib/utils";
import { CategorySlug } from "@/types";
import { toast } from "sonner";

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag,
  Milk,
  HeartPulse,
  GraduationCap,
  Receipt,
  ArrowLeftRight,
  PiggyBank,
  kirana: ShoppingBag,
  "sabzi-dairy": Milk,
  medical: HeartPulse,
  education: GraduationCap,
  "bills-emi": Receipt,
  udhaar: ArrowLeftRight,
  savings: PiggyBank,
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const welcomeType = searchParams?.get("welcome");

  const { user, family, currentMember, categories, items, authLoading, isLoaded } = useLedger();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [isCustomCategoryModalOpen, setIsCustomCategoryModalOpen] = useState(false);
  const [selectedAddCategory, setSelectedAddCategory] = useState<CategorySlug>("kirana");
  const [dismissWelcome, setDismissWelcome] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Auth & Onboarding Protection
  useEffect(() => {
    if (!authLoading && isLoaded) {
      if (!user) {
        router.push("/login");
      } else if (!family) {
        router.push("/onboarding");
      }
    }
  }, [user, family, authLoading, isLoaded, router]);

  // Calculations
  const totalActualSpent = useMemo(() => {
    return sumMoney(items.map((item) => item.actual_price || 0));
  }, [items]);

  const totalExpectedBudget = family?.monthly_budget || 45000;
  const budgetRemaining = totalExpectedBudget - totalActualSpent;
  const budgetPercentUsed = Math.min(100, Math.round((totalActualSpent / (totalExpectedBudget || 1)) * 100));

  // Category Spends
  const categorySpends = useMemo(() => {
    return categories.map((cat) => {
      const catItems = items.filter((i) => i.category_slug === cat.slug);
      const spent = sumMoney(catItems.map((i) => i.actual_price || 0));
      const expected = sumMoney(catItems.map((i) => i.expected_price || 0));
      const percent = cat.monthly_budget > 0 ? Math.min(100, Math.round((spent / cat.monthly_budget) * 100)) : 0;
      return {
        ...cat,
        spent,
        expected,
        percent,
        itemCount: catItems.length,
      };
    });
  }, [categories, items]);

  // Due alerts: Pending items with due dates within 14 days or bills
  const dueAlerts = useMemo(() => {
    return items
      .filter((i) => i.status === "Pending" && (i.due_date || i.category_slug === "bills-emi"))
      .slice(0, 5);
  }, [items]);

  // LPG tracker
  const lpgItem = useMemo(() => {
    return items.find(
      (i) =>
        i.category_slug === "bills-emi" &&
        (i.extra_data?.bill_type === "lpg" ||
          i.item_name.toLowerCase().includes("lpg") ||
          i.item_name.toLowerCase().includes("cylinder"))
    );
  }, [items]);

  const lpgDaysAgo = lpgItem
    ? getDaysSince(lpgItem.extra_data?.lpg_last_booking_date || lpgItem.created_at)
    : null;
  const lpgDaysLeft = lpgDaysAgo !== null ? Math.max(0, 32 - lpgDaysAgo) : null;

  // Recent 6 ledger activities
  const recentActivities = useMemo(() => {
    return [...items]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [items]);

  const handleCopyCode = () => {
    if (!family) return;
    navigator.clipboard.writeText(family.join_code);
    setCopiedCode(true);
    toast.success(`Copied 6-digit Join Code: ${family.join_code}`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (authLoading || !isLoaded || !family) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" strokeWidth={1.75} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onOpenFamilyModal={() => setIsFamilyModalOpen(true)} />

      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Welcome Banner for Newly Created or Joined Family */}
        {welcomeType && !dismissWelcome && (
          <div className="mb-6 rounded-xl border border-primary-border bg-primary-light p-4 sm:p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-text">
                    {welcomeType === "head"
                      ? `Welcome to your new ${family.name} Vault!`
                      : `Successfully connected to ${family.name}!`}
                  </h2>
                  <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                    {welcomeType === "head" ? (
                      <>
                        Your 6-digit Family Join Code is{" "}
                        <span className="inline-flex items-center gap-1 font-mono text-primary font-bold bg-white px-2 py-0.5 rounded border border-primary-border">
                          {family.join_code}
                          <button
                            onClick={handleCopyCode}
                            className="text-slate-muted hover:text-primary ml-1"
                            title="Copy Code"
                          >
                            {copiedCode ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </span>
                        . Share this code with your spouse, parents, or children so they can connect from their phones in real time.
                      </>
                    ) : (
                      "You are now linked to the household vault. Any expenses you record will synchronize live across all family members."
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDismissWelcome(true)}
                className="text-slate-muted hover:text-slate-text p-1 rounded"
                aria-label="Dismiss welcome banner"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        )}

        {/* Top Welcome & Family Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-text tracking-tight flex items-center gap-2">
              <span>{family.name} Ledger</span>
              <button
                onClick={() => setIsFamilyModalOpen(true)}
                className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary-light text-primary border border-primary-border hover:bg-emerald-100 transition-colors"
              >
                Code: {family.join_code}
              </button>
            </h1>
            <p className="text-xs text-slate-muted mt-0.5">
              Logged in as <strong className="text-slate-text">{currentMember?.name || user?.name}</strong>{" "}
              ({currentMember?.role || "Member"}). Real-time multi-device sync active.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsFamilyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-slate-border bg-surface text-slate-text hover:bg-slate-card transition-colors min-h-[44px]"
            >
              <Users className="h-4 w-4 text-slate-muted" strokeWidth={1.75} />
              <span>Family Vault</span>
            </button>
            <button
              onClick={() => {
                setSelectedAddCategory("kirana");
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-primary text-white hover:bg-primary-hover shadow-sm transition-colors min-h-[44px]"
            >
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              <span>+ Add Expense</span>
            </button>
          </div>
        </div>

        {/* Parivar AI Command Bar */}
        <div className="mb-6">
          <QuickCommandBar />
        </div>

        {/* Financial Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Main Budget Card */}
          <div className="md:col-span-2 rounded-xl border border-slate-border bg-surface p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold text-slate-muted uppercase tracking-wider">
                  Monthly Household Budget Progress
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-text">
                    {formatRupees(totalActualSpent)}
                  </span>
                  <span className="text-xs text-slate-muted">
                    spent of {formatRupees(totalExpectedBudget)} budget
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-muted uppercase tracking-wider block">
                  Remaining
                </span>
                <span
                  className={`text-lg sm:text-xl font-bold mt-1 block ${
                    budgetRemaining < 0 ? "text-danger" : "text-primary"
                  }`}
                >
                  {formatRupees(budgetRemaining)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-md h-3.5 overflow-hidden p-0.5 border border-slate-border">
              <div
                className={`h-full rounded-sm transition-all duration-300 ${
                  budgetPercentUsed > 90
                    ? "bg-danger"
                    : budgetPercentUsed > 75
                    ? "bg-amber-alert"
                    : "bg-primary"
                }`}
                style={{ width: `${budgetPercentUsed}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-muted mt-2">
              <span>₹0</span>
              <span className="font-semibold text-slate-text">
                {items.length === 0 ? "Fresh start: 0 expenses logged" : `${budgetPercentUsed}% of monthly budget utilized`}
              </span>
              <span>{formatRupees(totalExpectedBudget)} Target</span>
            </div>
          </div>

          {/* LPG & Bill Quick Snapshot */}
          <div className="rounded-xl border border-slate-border bg-surface p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-muted uppercase tracking-wider">
                  LPG Cylinder Status
                </span>
                <Flame className="h-4 w-4 text-amber-alert" strokeWidth={1.75} />
              </div>
              <div className="text-xl font-bold text-slate-text">
                {lpgDaysLeft !== null ? `${lpgDaysLeft} Days Left` : "Not Tracked"}
              </div>
              <p className="text-xs text-slate-muted mt-1">
                {lpgDaysAgo !== null
                  ? `Booked ${lpgDaysAgo} days ago (${formatDate(lpgItem?.extra_data?.lpg_last_booking_date || lpgItem?.created_at)})`
                  : "Add an LPG booking in Bills & EMI to start 32-day countdown"}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-border mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-muted font-medium">Refill cycle:</span>
              <span className="font-bold text-amber-alert">
                {lpgItem?.due_date ? formatDate(lpgItem.due_date) : "32 Days Average"}
              </span>
            </div>
          </div>
        </div>

        {/* Due Alerts Bar (if any pending bills exist) */}
        {dueAlerts.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-alertBorder bg-amber-alertLight p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-alert" strokeWidth={1.75} />
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-alert">
                Upcoming Household Payments & Reminders ({dueAlerts.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {dueAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-lg bg-white p-3 border border-amber-alertBorder"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-text truncate max-w-[170px]">
                      {alert.item_name}
                    </div>
                    <div className="text-[11px] text-slate-muted">
                      {alert.due_date ? `Due: ${formatDate(alert.due_date)}` : alert.category_slug}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-text block">
                      {formatRupees(alert.expected_price || alert.actual_price)}
                    </span>
                    <Link
                      href={`/ledger/${alert.category_slug}`}
                      className="text-[10px] font-semibold text-primary hover:underline"
                    >
                      View & Pay
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid of Household Modules */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-text">Household Ledgers</h2>
              <p className="text-xs text-slate-muted">Tap any module to view details, inline-edit, or export</p>
            </div>
            <button
              onClick={() => setIsCustomCategoryModalOpen(true)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Add Custom Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categorySpends.map((cat) => {
              const Icon = CATEGORY_ICON_MAP[cat.icon_name] || CATEGORY_ICON_MAP[cat.slug] || ShoppingBag;
              return (
                <Link
                  key={cat.slug}
                  href={`/ledger/${cat.slug}`}
                  className="group rounded-xl border border-slate-border bg-surface p-4 sm:p-5 shadow-sm hover:border-primary hover:shadow transition-all flex flex-col justify-between min-h-[170px]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                      </div>
                      <ChevronRight
                        className="h-4 w-4 text-slate-muted group-hover:text-primary transition-colors"
                        strokeWidth={1.75}
                      />
                    </div>

                    <h3 className="text-sm font-bold text-slate-text group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    {cat.hindi_name && (
                      <span className="text-[11px] text-slate-muted block">
                        {cat.hindi_name}
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-border mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-text">{formatRupees(cat.spent)}</span>
                      <span className="text-slate-muted text-[11px]">
                        {cat.itemCount} items
                      </span>
                    </div>
                    {/* Micro Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cat.percent > 100 ? "bg-danger" : "bg-primary"}`}
                        style={{ width: `${Math.min(100, cat.percent)}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Family Activity Stream */}
        <div className="rounded-xl border border-slate-border bg-surface p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-text">Recent Family Activity</h2>
              <p className="text-xs text-slate-muted">Real-time log of expenses recorded across family members</p>
            </div>
            <span className="text-xs font-semibold text-slate-muted">
              {items.length} total entries
            </span>
          </div>

          {items.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-muted">
              <Clock className="h-7 w-7 text-slate-subtle mx-auto mb-2" strokeWidth={1.75} />
              <p className="font-semibold text-slate-text">No expenses recorded yet in {family.name}</p>
              <p className="mt-1 max-w-sm mx-auto">
                Tap "+ Add Expense" above or open a module like Kirana to load your staple monthly ration items.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-border">
              {recentActivities.map((act) => (
                <div key={act.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-card text-slate-text text-xs font-bold">
                      {act.created_by_name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-text">{act.item_name}</div>
                      <div className="text-[11px] text-slate-muted">
                        {act.category_slug} • Added by {act.created_by_name} • {formatDate(act.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-text block">
                      {formatRupees(act.actual_price || act.expected_price)}
                    </span>
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        act.status === "Bought" || act.status === "Paid"
                          ? "text-primary bg-primary-light"
                          : "text-amber-alert bg-amber-alertLight"
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultCategorySlug={selectedAddCategory}
      />

      <FamilyModal
        isOpen={isFamilyModalOpen}
        onClose={() => setIsFamilyModalOpen(false)}
      />

      <CustomCategoryModal
        isOpen={isCustomCategoryModalOpen}
        onClose={() => setIsCustomCategoryModalOpen(false)}
      />

      <Footer />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-primary" strokeWidth={1.75} />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
