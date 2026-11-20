"use client";

import React, { useEffect, useState } from "react";
import { useLedger } from "@/lib/context/ledger-context";
import { CategorySlug, ExtraData, ItemStatus, LedgerItem } from "@/types";
import { X, Plus, Calendar, IndianRupee, Tag, FileText } from "lucide-react";
import { toast } from "sonner";
import { getLocalDateString } from "@/lib/utils";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategorySlug?: CategorySlug;
}

export function AddItemModal({ isOpen, onClose, defaultCategorySlug = "kirana" }: AddItemModalProps) {
  const { categories, addItem, family } = useLedger();

  const [categorySlug, setCategorySlug] = useState<CategorySlug>(defaultCategorySlug);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("unit");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [actualPrice, setActualPrice] = useState("");
  const [status, setStatus] = useState<ItemStatus>("Pending");
  const [recurrence, setRecurrence] = useState<LedgerItem["recurrence"]>("Monthly");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Category specific extra fields
  const [brand, setBrand] = useState("");
  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [billType, setBillType] = useState<ExtraData["bill_type"]>("electricity");
  const [udhaarDirection, setUdhaarDirection] = useState<"given" | "taken">("given");
  const [partyName, setPartyName] = useState("");
  const [partyPhone, setPartyPhone] = useState("");
  const [savingsType, setSavingsType] = useState<ExtraData["savings_type"]>("rd");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setIsSubmitting(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!itemName.trim()) {
      toast.error("Please enter an item name");
      return;
    }

    if (itemName.trim().length > 255) {
      toast.error("Item name must be 255 characters or fewer");
      return;
    }

    const exp = expectedPrice.trim() ? Number(expectedPrice) : 0;
    const act = actualPrice.trim()
      ? Number(actualPrice)
      : status === "Bought" || status === "Paid"
        ? exp
        : 0;
    const maxPrice = 9_999_999_999.99;
    if (
      !Number.isFinite(exp) ||
      !Number.isFinite(act) ||
      exp < 0 ||
      act < 0 ||
      exp > maxPrice ||
      act > maxPrice
    ) {
      toast.error("Prices must be valid non-negative amounts");
      return;
    }

    const extra_data: ExtraData = {};

    if (categorySlug === "kirana" && brand) {
      extra_data.brand = brand.trim();
    } else if (categorySlug === "medical") {
      if (patientName) extra_data.patient_name = patientName.trim();
      if (doctorName) extra_data.doctor_name = doctorName.trim();
    } else if (categorySlug === "education") {
      if (studentName) extra_data.student_name = studentName.trim();
    } else if (categorySlug === "bills-emi") {
      extra_data.bill_type = billType;
      if (billType === "lpg") {
        extra_data.lpg_last_booking_date = dueDate || getLocalDateString();
        extra_data.lpg_estimated_lifespan_days = 32;
      }
    } else if (categorySlug === "udhaar") {
      extra_data.udhaar_direction = udhaarDirection;
      extra_data.person_name = partyName || itemName;
      extra_data.person_phone = partyPhone;
    } else if (categorySlug === "savings") {
      extra_data.savings_type = savingsType;
    }

    if (!family) {
      toast.error("Please connect your family vault first");
      return;
    }

    setIsSubmitting(true);
    addItem({
      family_id: family.id,
      category_slug: categorySlug,
      item_name: itemName.trim(),
      quantity: quantity.trim() || "1",
      unit: unit.trim() || "unit",
      expected_price: exp,
      actual_price: act,
      status,
      recurrence,
      due_date: dueDate || undefined,
      notes: notes.trim() || undefined,
      created_by_name: "Self",
      extra_data,
    });

    // Reset and close
    setItemName("");
    setExpectedPrice("");
    setActualPrice("");
    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-border bg-surface p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-border pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Plus className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-text">Add Household Ledger Item</h2>
              <p className="text-xs text-slate-muted">Track cost, expected price and family notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-muted hover:bg-slate-card hover:text-slate-text"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-text mb-1">
              Household Category *
            </label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full rounded-md border border-slate-border bg-surface px-3 py-2 text-sm text-slate-text focus:border-primary focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} {c.hindi_name ? `(${c.hindi_name})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-text mb-1">
              Item or Expense Name *
            </label>
            <input
              type="text"
              required
              maxLength={255}
              placeholder="e.g. Aashirvaad Atta 10kg, Electricity Bill, Papa BP Meds"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full rounded-md border border-slate-border bg-surface px-3 py-2 text-sm text-slate-text placeholder:text-slate-subtle focus:border-primary focus:outline-none"
            />
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-text mb-1">
                Quantity
              </label>
              <input
                type="text"
                placeholder="e.g. 10, 2, 500"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-md border border-slate-border bg-surface px-3 py-2 text-sm text-slate-text focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-text mb-1">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-md border border-slate-border bg-surface px-3 py-2 text-sm text-slate-text focus:border-primary focus:outline-none"
              >
                <option value="kg">kg</option>
                <option value="g">gram (g)</option>
                <option value="L">Liter (L)</option>
                <option value="ml">ml</option>
                <option value="pack">pack</option>
                <option value="unit">unit / pcs</option>
                <option value="month">month</option>
                <option value="bill">bill</option>
                <option value="installment">installment</option>
              </select>
            </div>
          </div>

          {/* Pricing: Expected vs Actual */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-text mb-1">
                Expected Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-muted">₹</span>
                <input
                  type="number"
                  min="0"
                  max="9999999999.99"
                  step="0.01"
                  placeholder="0"
                  value={expectedPrice}
                  onChange={(e) => setExpectedPrice(e.target.value)}
                  className="w-full rounded-md border border-slate-border bg-surface pl-7 pr-3 py-2 text-sm text-slate-text focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-text mb-1">
                Actual Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-muted">₹</span>
                <input
                  type="number"
                  min="0"
                  max="9999999999.99"
                  step="0.01"
                  placeholder="0"
                  value={actualPrice}
                  onChange={(e) => setActualPrice(e.target.value)}
                  className="w-full rounded-md border border-slate-border bg-surface pl-7 pr-3 py-2 text-sm text-slate-text focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Status & Recurrence */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-text mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemStatus)}
                className="w-full rounded-md border border-slate-border bg-surface px-3 py-2 text-sm text-slate-text focus:border-primary focus:outline-none"
              >
                <option value="Pending">Pending</option>
                <option value="Bought">Bought</option>
                <option value="Paid">Paid</option>
                <option value="Settled">Settled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-text mb-1">
                Frequency
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as LedgerItem["recurrence"])}
                className="w-full rounded-md border border-slate-border bg-surface px-3 py-2 text-sm text-slate-text focus:border-primary focus:outline-none"
              >
                <option value="Monthly">Monthly</option>
                <option value="Daily">Daily</option>
                <option value="Quarterly">Quarterly</option>
                <option value="One-time">One-time</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-text mb-1">
              Due / Reminder Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-slate-border bg-surface px-3 py-2 text-sm text-slate-text focus:border-primary focus:outline-none"
            />
          </div>

          {/* Category-Specific Dynamic Inputs */}
          {categorySlug === "medical" && (
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-card p-3 border border-slate-border">
              <div>
                <label className="block text-[11px] font-semibold text-slate-text mb-1">
                  Family Patient Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Papa, Mummy, Self"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full rounded-md border border-slate-border bg-surface px-2.5 py-1.5 text-xs text-slate-text focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-text mb-1">
                  Doctor / Clinic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. R.K. Gupta"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full rounded-md border border-slate-border bg-surface px-2.5 py-1.5 text-xs text-slate-text focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {categorySlug === "bills-emi" && (
            <div className="rounded-lg bg-slate-card p-3 border border-slate-border">
              <label className="block text-[11px] font-semibold text-slate-text mb-1">
                Bill Type
              </label>
              <select
                value={billType}
                onChange={(e) => setBillType(e.target.value as ExtraData["bill_type"])}
                className="w-full rounded-md border border-slate-border bg-surface px-2.5 py-1.5 text-xs text-slate-text focus:border-primary focus:outline-none"
              >
                <option value="electricity">Electricity Bill</option>
                <option value="lpg">LPG Gas Cylinder</option>
                <option value="wifi">Wi-Fi Broadband</option>
                <option value="mobile">Mobile Recharge</option>
                <option value="emi">Loan / Vehicle EMI</option>
                <option value="dth">DTH / Cable TV</option>
                <option value="water">Water Bill</option>
              </select>
            </div>
          )}

          {categorySlug === "udhaar" && (
            <div className="space-y-2 rounded-lg bg-slate-card p-3 border border-slate-border">
              <label className="block text-[11px] font-semibold text-slate-text">
                Udhaar Direction
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUdhaarDirection("given")}
                  className={`py-1.5 text-xs font-medium rounded-md border ${
                    udhaarDirection === "given"
                      ? "bg-primary text-white border-primary"
                      : "bg-surface text-slate-text border-slate-border"
                  }`}
                >
                  Given (We will receive)
                </button>
                <button
                  type="button"
                  onClick={() => setUdhaarDirection("taken")}
                  className={`py-1.5 text-xs font-medium rounded-md border ${
                    udhaarDirection === "taken"
                      ? "bg-amber-alert text-white border-amber-alert"
                      : "bg-surface text-slate-text border-slate-border"
                  }`}
                >
                  Taken (We must return)
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Person / Relative Name"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="rounded-md border border-slate-border bg-surface px-2.5 py-1.5 text-xs text-slate-text"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={partyPhone}
                  onChange={(e) => setPartyPhone(e.target.value)}
                  className="rounded-md border border-slate-border bg-surface px-2.5 py-1.5 text-xs text-slate-text"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-text mb-1">
              Household Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Bought from local store, bill paid via UPI"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-slate-border bg-surface px-3 py-2 text-sm text-slate-text placeholder:text-slate-subtle focus:border-primary focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-border text-slate-text hover:bg-slate-card transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-md bg-primary text-white hover:bg-primary-hover transition-colors shadow-sm"
            >
              Save to Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
