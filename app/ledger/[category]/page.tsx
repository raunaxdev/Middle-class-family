"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLedger } from "@/lib/context/ledger-context";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { AddItemModal } from "@/components/modals/add-item-modal";
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
  Search,
  Filter,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  Calendar,
  AlertTriangle,
  Flame,
  User,
  Phone,
  FileSpreadsheet,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  formatRupees,
  formatDate,
  getLocalDateString,
  getDaysSince,
  getDaysDifference,
  sumMoney,
  toMoney,
} from "@/lib/utils";
import { LedgerItem, ItemStatus } from "@/types";
import { toast } from "sonner";
import Link from "next/link";

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

export default function CategoryLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = (params?.category as string) || "kirana";

  const {
    user,
    family,
    authLoading,
    isLoaded,
    categories,
    items,
    toggleItemStatus,
    deleteItem,
    updateItem,
    updateMilkDays,
    addUdhaarRepayment,
    loadBlankTemplate,
  } = useLedger();

  // Auth protection
  React.useEffect(() => {
    if (!authLoading && isLoaded) {
      if (!user) {
        router.push("/login");
      } else if (!family) {
        router.push("/onboarding");
      }
    }
  }, [user, family, authLoading, isLoaded, router]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCustomCategoryModalOpen, setIsCustomCategoryModalOpen] = useState(false);

  // Inline editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editActualPrice, setEditActualPrice] = useState<string>("");
  const [editExpectedPrice, setEditExpectedPrice] = useState<string>("");
  const [editQuantity, setEditQuantity] = useState<string>("");

  // Udhaar partial payment input state
  const [udhaarPayingItemId, setUdhaarPayingItemId] = useState<string | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [repaymentNotes, setRepaymentNotes] = useState("");

  const currentCategory = useMemo(() => {
    return (
      categories.find((c) => c.slug === categorySlug) || {
        slug: categorySlug,
        name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace("-", " "),
        hindi_name: "",
        description: "Household ledger module",
        icon_name: "ShoppingBag",
        monthly_budget: 5000,
        is_system: false,
      }
    );
  }, [categories, categorySlug]);

  const categoryItems = useMemo(() => {
    return items.filter((item) => item.category_slug === categorySlug);
  }, [items, categorySlug]);

  const filteredItems = useMemo(() => {
    return categoryItems.filter((item) => {
      const matchesSearch =
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.created_by_name && item.created_by_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "All" ? true : item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [categoryItems, searchQuery, statusFilter]);

  // Statistics
  const totalExpected = sumMoney(categoryItems.map((i) => i.expected_price || 0));
  const totalActual = sumMoney(categoryItems.map((i) => i.actual_price || 0));
  const priceVariance = toMoney(totalActual - totalExpected);
  const boughtCount = categoryItems.filter((i) => i.status === "Bought" || i.status === "Paid" || i.status === "Settled").length;

  const IconComponent = CATEGORY_ICON_MAP[currentCategory.icon_name] || CATEGORY_ICON_MAP[categorySlug] || ShoppingBag;

  // Milk Card specific item
  const milkCardItem = categorySlug === "sabzi-dairy"
    ? categoryItems.find((i) => i.extra_data?.milk_daily_liters !== undefined)
    : null;

  // LPG specific item
  const lpgItem = categorySlug === "bills-emi"
    ? categoryItems.find((i) => i.extra_data?.bill_type === "lpg" || i.item_name.toLowerCase().includes("lpg") || i.item_name.toLowerCase().includes("cylinder"))
    : null;

  // Start inline edit
  const handleStartEdit = (item: LedgerItem) => {
    setEditingItemId(item.id);
    setEditActualPrice(item.actual_price.toString());
    setEditExpectedPrice(item.expected_price.toString());
    setEditQuantity(item.quantity.toString());
  };

  const handleSaveEdit = (id: string) => {
    const actualPrice = Number(editActualPrice);
    const expectedPrice = Number(editExpectedPrice);
    const maxPrice = 9_999_999_999.99;
    if (
      !Number.isFinite(actualPrice) ||
      !Number.isFinite(expectedPrice) ||
      actualPrice < 0 ||
      expectedPrice < 0 ||
      actualPrice > maxPrice ||
      expectedPrice > maxPrice
    ) {
      toast.error("Prices must be valid non-negative amounts");
      return;
    }

    updateItem(id, {
      actual_price: toMoney(actualPrice),
      expected_price: toMoney(expectedPrice),
      quantity: editQuantity || "1",
    });
    setEditingItemId(null);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (categoryItems.length === 0) {
      toast.info("No items to export");
      return;
    }

    const headers = ["Item Name", "Quantity", "Unit", "Expected Price (INR)", "Actual Price (INR)", "Status", "Recurrence", "Due Date", "Added By", "Notes"];
    const rows = categoryItems.map((i) => [
      `"${i.item_name.replace(/"/g, '""')}"`,
      `"${i.quantity}"`,
      `"${i.unit}"`,
      i.expected_price,
      i.actual_price,
      `"${i.status}"`,
      `"${i.recurrence}"`,
      `"${i.due_date || ""}"`,
      `"${i.created_by_name}"`,
      `"${(i.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${categorySlug}_ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${categorySlug} ledger to CSV`);
  };

  // Print Summary
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs text-slate-muted mb-4">
          <Link href="/dashboard" className="hover:text-primary transition-colors">
            Family Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span className="font-semibold text-slate-text">{currentCategory.name}</span>
        </div>

        {/* Top Header Card */}
        <div className="rounded-xl border border-slate-border bg-surface p-5 sm:p-6 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-sm flex-shrink-0">
                <IconComponent className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-text">
                    {currentCategory.name}
                  </h1>
                  {currentCategory.hindi_name && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-card text-xs font-semibold text-slate-muted border border-slate-border">
                      {currentCategory.hindi_name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-muted mt-1 leading-relaxed max-w-2xl">
                  {currentCategory.description}
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={handleExportCSV}
                title="Download spreadsheet"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-slate-border bg-surface text-slate-text hover:bg-slate-card transition-colors min-h-[44px]"
              >
                <Download className="h-4 w-4 text-slate-muted" strokeWidth={1.75} />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-primary text-white hover:bg-primary-hover shadow-sm transition-colors min-h-[44px]"
              >
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-border">
            <div className="p-3 rounded-lg bg-slate-card border border-slate-border">
              <span className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider block">
                Total Actual Spend
              </span>
              <span className="text-lg sm:text-xl font-bold text-slate-text mt-0.5 block">
                {formatRupees(totalActual)}
              </span>
              <span className="text-[10px] text-slate-muted">
                {boughtCount} of {categoryItems.length} items completed
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-card border border-slate-border">
              <span className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider block">
                Estimated / Planned
              </span>
              <span className="text-lg sm:text-xl font-bold text-slate-text mt-0.5 block">
                {formatRupees(totalExpected)}
              </span>
              <span className="text-[10px] text-slate-muted">Based on initial list</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-card border border-slate-border">
              <span className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider block">
                Price Variance
              </span>
              <span
                className={`text-lg sm:text-xl font-bold mt-0.5 block ${
                  priceVariance > 0 ? "text-danger" : priceVariance < 0 ? "text-primary" : "text-slate-text"
                }`}
              >
                {priceVariance > 0 ? `+${formatRupees(priceVariance)}` : formatRupees(priceVariance)}
              </span>
              <span className="text-[10px] text-slate-muted">
                {priceVariance > 0 ? "Above expected" : priceVariance < 0 ? "Under planned cost" : "Exact match"}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-card border border-slate-border">
              <span className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider block">
                Category Monthly Target
              </span>
              <span className="text-lg sm:text-xl font-bold text-slate-text mt-0.5 block">
                {formatRupees(currentCategory.monthly_budget)}
              </span>
              <span className="text-[10px] text-slate-muted">
                {currentCategory.monthly_budget > totalActual
                  ? `${formatRupees(currentCategory.monthly_budget - totalActual)} remaining`
                  : "Target exceeded"}
              </span>
            </div>
          </div>
        </div>

        {/* SPECIAL MODULE: Monthly Milk Card Calculator for Sabzi-Dairy */}
        {categorySlug === "sabzi-dairy" && milkCardItem && (
          <div className="mb-6 rounded-xl border border-primary-border bg-primary-light/40 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                  <Milk className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-text">
                    Monthly Milk Card Calculator (दूध का हिसाब)
                  </h2>
                  <p className="text-xs text-slate-muted">
                    {milkCardItem.item_name} • Rate: ₹{milkCardItem.extra_data?.milk_rate_per_liter || 54}/L • Daily: {milkCardItem.extra_data?.milk_daily_liters || 1.5} Liters
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-text">
                  Projected Month Cost:
                </span>
                <span className="font-mono text-base font-bold text-primary">
                  {formatRupees(milkCardItem.expected_price)}
                </span>
              </div>
            </div>

            {/* Quick Tap Daily Incrementer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg bg-white p-3.5 border border-primary-border">
              <div>
                <span className="text-xs font-semibold text-slate-text block">
                  Days Milk Received This Month:
                </span>
                <span className="text-xs text-slate-muted">
                  Tap to quickly adjust days if doodhwala missed a day
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const currentDays = milkCardItem.extra_data?.days_taken ?? 0;
                    if (currentDays > 0) updateMilkDays(milkCardItem.id, currentDays - 1);
                  }}
                  className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-border text-sm font-bold text-slate-text hover:bg-slate-card"
                >
                  -
                </button>
                <div className="px-4 py-1.5 rounded-md bg-primary-light border border-primary-border font-mono text-sm font-bold text-primary">
                  {milkCardItem.extra_data?.days_taken ?? 0} Days
                </div>
                <button
                  onClick={() => {
                    const currentDays = milkCardItem.extra_data?.days_taken ?? 0;
                    if (currentDays < 31) updateMilkDays(milkCardItem.id, currentDays + 1);
                  }}
                  className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-border text-sm font-bold text-slate-text hover:bg-slate-card"
                >
                  +
                </button>
                <div className="border-l border-slate-border pl-3 ml-2 text-right">
                  <div className="text-[10px] text-slate-muted uppercase font-semibold">Current Bill</div>
                  <div className="text-sm font-bold text-slate-text">
                    {formatRupees(milkCardItem.actual_price)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SPECIAL MODULE: LPG Gas Cylinder Booking Lifespan Tracker for Bills-EMI */}
        {categorySlug === "bills-emi" && lpgItem && (
          <div className="mb-6 rounded-xl border border-amber-alertBorder bg-amber-alertLight p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-alert text-white flex-shrink-0">
                  <Flame className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-text flex items-center gap-2">
                    <span>LPG Gas Cylinder Refill Tracker</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-alert text-white">
                      INDANE 14.2 KG
                    </span>
                  </h2>
                  <p className="text-xs text-slate-muted mt-0.5">
                    Last booked on {formatDate(lpgItem.extra_data?.lpg_last_booking_date || lpgItem.created_at)} ({getDaysSince(lpgItem.extra_data?.lpg_last_booking_date || lpgItem.created_at)} days ago).
                    Average middle-class cylinder lifespan: ~32 days.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-slate-muted uppercase block">Estimated Remaining</span>
                  <span className="text-base font-bold text-amber-alert">
                    {Math.max(0, 32 - (getDaysSince(lpgItem.extra_data?.lpg_last_booking_date || lpgItem.created_at) || 0))} Days Left
                  </span>
                </div>
                <button
                  onClick={() => {
                    const todayStr = getLocalDateString();
                    updateItem(lpgItem.id, {
                      status: "Bought",
                      actual_price: lpgItem.actual_price,
                      created_at: new Date().toISOString(),
                      extra_data: {
                        ...lpgItem.extra_data,
                        lpg_last_booking_date: todayStr,
                      },
                    });
                    toast.success("Updated LPG booking date to today!");
                  }}
                  className="px-3 py-2 text-xs font-semibold rounded-md bg-amber-alert text-white hover:bg-amber-700 transition-colors shadow-sm min-h-[44px]"
                >
                  Booked New Cylinder Today
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search, Status Filters & Categories Nav */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-muted" strokeWidth={1.75} />
            <input
              type="text"
              placeholder={`Search in ${currentCategory.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-border bg-surface pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-text placeholder:text-slate-subtle focus:border-primary focus:outline-none min-h-[44px]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {["All", "Pending", "Bought", "Paid"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap min-h-[36px] ${
                  statusFilter === st
                    ? "bg-slate-text text-white border-slate-text font-semibold"
                    : "bg-surface text-slate-muted border-slate-border hover:bg-slate-card"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Items Table / Cards */}
        <div className="rounded-xl border border-slate-border bg-surface shadow-sm overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center px-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-card text-slate-muted mb-3">
                <IconComponent className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <h3 className="text-sm font-bold text-slate-text">No items found</h3>
              <p className="text-xs text-slate-muted mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? "No ledger items matched your search query."
                  : `You have not added any items to ${currentCategory.name} yet.`}
              </p>
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-md bg-primary text-white hover:bg-primary-hover shadow-sm min-h-[44px]"
                >
                  <Plus className="h-4 w-4" strokeWidth={1.75} />
                  <span>+ Add First Item</span>
                </button>
                <button
                  onClick={() => loadBlankTemplate(categorySlug)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-md border border-primary-border bg-primary-light text-primary hover:bg-emerald-100 transition-colors min-h-[44px]"
                >
                  <FileSpreadsheet className="h-4 w-4" strokeWidth={1.75} />
                  <span>Load Blank Indian Household Template</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-border bg-slate-card/60 text-[11px] font-semibold uppercase tracking-wider text-slate-muted">
                    <th className="py-3 px-4">Item & Details</th>
                    <th className="py-3 px-4">Qty / Unit</th>
                    <th className="py-3 px-4">Expected (₹)</th>
                    <th className="py-3 px-4">Actual (₹)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Attribution</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-border text-xs text-slate-text">
                  {filteredItems.map((item) => {
                    const isEditing = editingItemId === item.id;
                    const isUdhaar = categorySlug === "udhaar";

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-card/40 transition-colors ${
                          item.status === "Bought" || item.status === "Paid" || item.status === "Settled"
                            ? "bg-surface"
                            : "bg-amber-50/20"
                        }`}
                      >
                        {/* Item Name & Notes */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-text">{item.item_name}</div>
                          {item.notes && (
                            <div className="text-[11px] text-slate-muted line-clamp-1 mt-0.5">
                              {item.notes}
                            </div>
                          )}
                          {item.extra_data?.doctor_name && (
                            <div className="text-[10px] text-primary font-medium mt-0.5">
                              Doctor: {item.extra_data.doctor_name} • {item.extra_data.patient_name || "Self"}
                            </div>
                          )}
                          {item.extra_data?.fee_type && (
                            <div className="text-[10px] text-primary font-medium mt-0.5">
                              {item.extra_data.student_name}: {item.extra_data.fee_type}
                            </div>
                          )}
                          {item.due_date && (
                            <div className="text-[10px] text-amber-alert font-medium mt-0.5 flex items-center gap-1">
                              <Calendar className="h-3 w-3" strokeWidth={1.75} />
                              <span>Due: {formatDate(item.due_date)}</span>
                            </div>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(e.target.value)}
                              className="w-16 rounded border border-slate-border bg-surface px-2 py-1 text-xs"
                            />
                          ) : (
                            <span className="font-medium text-slate-text">
                              {item.quantity} {item.unit}
                            </span>
                          )}
                        </td>

                        {/* Expected Price */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editExpectedPrice}
                              onChange={(e) => setEditExpectedPrice(e.target.value)}
                              className="w-20 rounded border border-slate-border bg-surface px-2 py-1 text-xs"
                            />
                          ) : (
                            <span className="text-slate-muted font-medium">
                              {formatRupees(item.expected_price)}
                            </span>
                          )}
                        </td>

                        {/* Actual Price */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editActualPrice}
                              onChange={(e) => setEditActualPrice(e.target.value)}
                              className="w-20 rounded border border-slate-border bg-surface px-2 py-1 text-xs"
                            />
                          ) : (
                            <span
                              className={`font-bold ${
                                item.actual_price > item.expected_price && item.expected_price > 0
                                  ? "text-danger"
                                  : "text-slate-text"
                              }`}
                            >
                              {formatRupees(item.actual_price)}
                            </span>
                          )}
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleItemStatus(item.id)}
                            title="Click to advance status"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                              item.status === "Bought" || item.status === "Paid"
                                ? "bg-primary-light text-primary border-primary-border hover:bg-emerald-100"
                                : item.status === "Settled"
                                ? "bg-slate-100 text-slate-text border-slate-border"
                                : "bg-amber-alertLight text-amber-alert border-amber-alertBorder hover:bg-amber-100"
                            }`}
                          >
                            {item.status === "Bought" || item.status === "Paid" || item.status === "Settled" ? (
                              <CheckCircle2 className="h-3 w-3" strokeWidth={1.75} />
                            ) : (
                              <Clock className="h-3 w-3" strokeWidth={1.75} />
                            )}
                            <span>{item.status}</span>
                          </button>
                        </td>

                        {/* Attribution */}
                        <td className="py-3 px-4 whitespace-nowrap text-[11px] text-slate-muted">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-subtle" strokeWidth={1.75} />
                            <span>{item.created_by_name}</span>
                          </div>
                          <div className="text-[10px] text-slate-subtle mt-0.5">
                            {formatDate(item.created_at)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                className="px-2.5 py-1 bg-primary text-white text-xs font-semibold rounded hover:bg-primary-hover"
                              >
                                Save
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(item)}
                                title="Inline Edit"
                                className="p-1.5 rounded text-slate-muted hover:bg-slate-card hover:text-slate-text min-h-[36px] min-w-[36px] flex items-center justify-center"
                              >
                                <Edit3 className="h-3.5 w-3.5" strokeWidth={1.75} />
                              </button>
                            )}

                            {/* Udhaar Partial Repayment Button */}
                            {isUdhaar && item.status !== "Settled" && (
                              <button
                                onClick={() => setUdhaarPayingItemId(item.id)}
                                className="px-2 py-1 text-[10px] font-semibold rounded bg-primary-light text-primary border border-primary-border hover:bg-emerald-100"
                              >
                                Record Payment
                              </button>
                            )}

                            <button
                              onClick={() => deleteItem(item.id)}
                              title="Delete Item"
                              className="p-1.5 rounded text-slate-muted hover:bg-danger-light hover:text-danger min-h-[36px] min-w-[36px] flex items-center justify-center"
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal for Partial Udhaar Repayment */}
        {udhaarPayingItemId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-sm rounded-xl border border-slate-border bg-surface p-5 shadow-xl">
              <h3 className="text-sm font-bold text-slate-text mb-1">
                Record Udhaar Partial Repayment
              </h3>
              <p className="text-xs text-slate-muted mb-3">
                Log money received or paid back to reduce pending balance
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-text mb-1">
                    Payment Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="9999999999.99"
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={repaymentAmount}
                    onChange={(e) => setRepaymentAmount(e.target.value)}
                    className="w-full rounded-md border border-slate-border bg-surface px-3 py-2 text-sm text-slate-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-text mb-1">
                    Payment Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GPay transfer, Cash returned"
                    value={repaymentNotes}
                    onChange={(e) => setRepaymentNotes(e.target.value)}
                    className="w-full rounded-md border border-slate-border bg-surface px-3 py-2 text-sm text-slate-text"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setUdhaarPayingItemId(null)}
                    className="px-3 py-1.5 text-xs rounded border border-slate-border text-slate-text"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const amt = parseFloat(repaymentAmount);
                      if (!amt || amt <= 0) {
                        toast.error("Please enter a valid amount");
                        return;
                      }
                      addUdhaarRepayment(udhaarPayingItemId, {
                        amount: amt,
                        date: new Date().toISOString().split("T")[0],
                        notes: repaymentNotes || "Partial settlement",
                      });
                      setUdhaarPayingItemId(null);
                      setRepaymentAmount("");
                      setRepaymentNotes("");
                    }}
                    className="px-4 py-1.5 text-xs font-semibold rounded bg-primary text-white"
                  >
                    Save Repayment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Module Navigator & Add Custom Category button */}
        <div className="mt-8 rounded-xl border border-slate-border bg-surface p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-text">
              Household Ledger Modules
            </h3>
            <button
              onClick={() => setIsCustomCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-border bg-slate-card text-slate-text hover:bg-slate-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
              <span>+ Add Custom Category</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {categories.map((c) => {
              const Icon = CATEGORY_ICON_MAP[c.icon_name] || CATEGORY_ICON_MAP[c.slug] || ShoppingBag;
              const isCurrent = c.slug === categorySlug;
              return (
                <Link
                  key={c.slug}
                  href={`/ledger/${c.slug}`}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-center transition-all min-h-[44px] ${
                    isCurrent
                      ? "border-primary bg-primary-light text-primary font-bold shadow-sm"
                      : "border-slate-border bg-surface text-slate-text hover:bg-slate-card"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  <span className="text-[11px] truncate max-w-full">{c.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultCategorySlug={categorySlug}
      />

      {/* Custom Category Modal */}
      <CustomCategoryModal
        isOpen={isCustomCategoryModalOpen}
        onClose={() => setIsCustomCategoryModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
