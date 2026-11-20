import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toMoney(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.round((value + Math.sign(value) * Number.EPSILON) * 100) / 100;
}

export function sumMoney(values: readonly (number | null | undefined)[]): number {
  const totalPaise = values.reduce<number>((total, value) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return total;
    return total + Math.round((value + Math.sign(value) * Number.EPSILON) * 100);
  }, 0);
  return totalPaise / 100;
}

/**
 * Format amounts in Indian Rupee format (e.g. ₹1,25,000 or ₹450)
 */
export function formatRupees(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return "₹0";
  }
  const rounded = toMoney(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded);
}

/**
 * Format date in friendly Indian format: "18 Nov 2026"
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculate difference in calendar days between today and target date
 */
export function getDaysDifference(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  try {
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

/**
 * Calculate days elapsed since a past date (e.g. LPG Cylinder booking)
 */
export function getDaysSince(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  try {
    const past = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    past.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - past.getTime();
    return Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  } catch {
    return null;
  }
}

/**
 * Generate 6-digit numeric Family Join Code
 */
export function generateFamilyCode(): string {
  const range = 900_000;
  const limit = Math.floor(0x1_0000_0000 / range) * range;
  const randomValues = new Uint32Array(1);
  let value: number;

  do {
    globalThis.crypto.getRandomValues(randomValues);
    value = randomValues[0];
  } while (value >= limit);

  return String(100_000 + (value % range));
}

export function isValidFamilyCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}
