import React from "react";
import Link from "next/link";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import {
  Home,
  ShoppingBag,
  Milk,
  HeartPulse,
  Receipt,
  GraduationCap,
  ArrowLeftRight,
  PiggyBank,
  Bot,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  IndianRupee,
  Calendar,
  Lock,
} from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GrihaLedger - Intelligent Household Management for Indian Middle-Class Families",
  description:
    "Zero-cost family ledger, Kirana monthly ration planner, daily milk card tracker, doctor health log, bills & LPG tracking, and conversational Parivar AI.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative border-b border-slate-border bg-surface px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-24 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 rounded-md border border-primary-border bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary mb-6">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
              <span>100% Free Tier Cloud Architecture • Zero Monthly Subscription</span>
            </div>

            {/* Direct, Honest Headline (Zero AI Slop) */}
            <h1 className="text-3xl font-black tracking-tight text-slate-text sm:text-5xl sm:leading-tight">
              Every Rupee Accounted For.
              <br />
              <span className="text-primary">Every Household Detail Remembered.</span>
            </h1>

            {/* Clear Subtitle */}
            <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-muted leading-relaxed">
              GrihaLedger is an intelligent household ledger and family management platform designed specifically for Indian middle-class homes. Track monthly Kirana variance, daily milk cards, doctor visits, LPG cylinders, and school fees across all family phones in real time.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors min-h-[44px]"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md border border-slate-border bg-surface px-6 py-3 text-sm font-semibold text-slate-text hover:bg-slate-card transition-colors min-h-[44px]"
              >
                <span>Login to Family Vault</span>
              </Link>
            </div>

            {/* Trust Points */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-muted">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={1.75} />
                <span>6-Digit Family Vault Code</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={1.75} />
                <span>Installable PWA (Android / iOS / PC)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={1.75} />
                <span>Zero Data Selling Guaranteed</span>
              </div>
            </div>
          </div>
        </section>

        {/* Fresh Vault Preview */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-text">
              Start with a Clean Ledger
            </h2>
            <p className="text-xs sm:text-sm text-slate-muted mt-1 max-w-xl mx-auto">
              Every new family vault begins with no transactions and a zero recorded balance.
            </p>
          </div>

          <div className="rounded-xl border border-slate-border bg-surface p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
                <ShoppingBag className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-text">No ledger items yet</h3>
              <p className="mt-1 text-xs text-slate-muted">Your first transaction will appear here after you create a family vault.</p>
              <div className="mt-4 flex items-center gap-6 text-xs">
                <span className="font-semibold text-slate-text">Items: 0</span>
                <span className="font-semibold text-slate-text">Recorded total: ₹0</span>
              </div>
              <Link
                href="/login"
                className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition-colors"
              >
                <span>Create Your Family Vault</span>
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Link>
            </div>
          </div>
        </section>

        {/* 7 SPECIALIZED HOUSEHOLD MODULES */}
        <section className="py-12 bg-slate-card/50 border-y border-slate-border px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-text">
                7 Core Household Management Modules
              </h2>
              <p className="text-xs sm:text-sm text-slate-muted mt-1 max-w-xl mx-auto">
                Purpose-built ledgers addressing the day-to-day realities of Indian middle-class families
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Kirana */}
              <div className="rounded-xl border border-slate-border bg-surface p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary mb-3">
                  <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-bold text-slate-text">Kirana & Monthly Ration</h3>
                <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                  Staple pantry items, unpolished dals, cold-pressed oils, flours, and monthly detergent supplies with expected vs actual variance.
                </p>
              </div>

              {/* Sabzi & Dairy */}
              <div className="rounded-xl border border-slate-border bg-surface p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary mb-3">
                  <Milk className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-bold text-slate-text">Sabzi & Daily Milk Card</h3>
                <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                  Interactive monthly milk card calculator (rate × daily liters × days elapsed), mandi vegetable runs, eggs, and fruit baskets.
                </p>
              </div>

              {/* Medical */}
              <div className="rounded-xl border border-slate-border bg-surface p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary mb-3">
                  <HeartPulse className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-bold text-slate-text">Medical & Doctor Health Log</h3>
                <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                  Family member prescription refills, blood pressure & diabetes medicines, doctor consultation dates, and reminder alerts.
                </p>
              </div>

              {/* Education */}
              <div className="rounded-xl border border-slate-border bg-surface p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary mb-3">
                  <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-bold text-slate-text">Kids & Education</h3>
                <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                  Quarterly school tuition fee receipts, coaching classes, NCERT book sets, uniforms, and annual exam fees.
                </p>
              </div>

              {/* Bills & EMI */}
              <div className="rounded-xl border border-slate-border bg-surface p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary mb-3">
                  <Receipt className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-bold text-slate-text">Bills, LPG Gas & EMIs</h3>
                <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                  Electricity bills, Wi-Fi broadband, mobile prepaid recharges, bike/home EMIs, and a dedicated LPG cylinder countdown tracker.
                </p>
              </div>

              {/* Udhaar */}
              <div className="rounded-xl border border-slate-border bg-surface p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary mb-3">
                  <ArrowLeftRight className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-bold text-slate-text">Udhaar & Len-Den Register</h3>
                <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                  Money lent to relatives or borrowed during emergencies, with date logs for partial settlements and remaining balances.
                </p>
              </div>

              {/* Savings */}
              <div className="rounded-xl border border-slate-border bg-surface p-5 shadow-sm sm:col-span-2 md:col-span-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary mb-3">
                  <PiggyBank className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-bold text-slate-text">Savings, RD/FD & Gold/Chit</h3>
                <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                  Track monthly recurring deposits, LIC premium due dates, emergency cash reserve targets, and gold savings.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PARIVAR AI HIGHLIGHT */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-primary-border bg-gradient-to-b from-white to-primary-light/30 p-6 sm:p-10 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-md bg-primary text-white px-3 py-1 text-xs font-semibold">
                  <Bot className="h-4 w-4" strokeWidth={1.75} />
                  <span>Meet Parivar AI</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-text">
                  The Intelligent Household Member Who Remembers Everything
                </h2>
                <p className="text-xs sm:text-sm text-slate-muted leading-relaxed">
                  Ask in plain Hindi, English, or Hinglish:
                  <br />
                  <span className="font-semibold text-slate-text">
                    "Pichla gas cylinder kab book kiya tha?"
                  </span>
                  <br />
                  <span className="font-semibold text-slate-text">
                    "Kirana budget se kitna upar gaya?"
                  </span>
                  <br />
                  Or speak naturally to log expenses:
                  <br />
                  <span className="font-semibold text-primary">
                    "Aaj 450 ka sabzi liya, 1200 papa ki dawai, aur doodh wale ko 1500 diye"
                  </span>
                  <br />
                  Parivar AI automatically parses the items, assigns categories, and prepares them for 1-click confirmation.
                </p>
                <div className="pt-2">
                  <Link
                    href="/assistant"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-sm transition-colors min-h-[44px]"
                  >
                    <span>Open Parivar AI Conversation</span>
                    <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                  </Link>
                </div>
              </div>

              <div className="w-full md:w-80 rounded-xl border border-slate-border bg-surface p-4 shadow-sm text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-text pb-2 border-b border-slate-border">
                  <Bot className="h-4 w-4 text-primary" strokeWidth={1.75} />
                  <span>Expense Logging Flow</span>
                </div>
                <div className="rounded-lg bg-slate-card p-2.5 text-slate-text">
                  <span className="text-[10px] font-semibold text-slate-muted block">1. Describe</span>
                  Enter an expense in natural language.
                </div>
                <div className="rounded-lg bg-primary-light p-2.5 text-primary border border-primary-border">
                  <span className="text-[10px] font-semibold text-primary block">2. Review</span>
                  Check the extracted names, amounts, and categories.
                </div>
                <div className="rounded-lg border border-slate-border bg-white p-2.5 text-slate-text">
                  <span className="text-[10px] font-semibold text-slate-muted block">3. Confirm</span>
                  Nothing is added until you confirm the items.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="py-12 bg-surface border-t border-slate-border px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-text">
              Start Tracking Your Household Today
            </h2>
            <p className="text-xs sm:text-sm text-slate-muted mt-2">
              No credit card required. No hidden fees. Instant access with pre-loaded staple categories.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors min-h-[44px]"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md border border-slate-border bg-surface px-6 py-3 text-sm font-semibold text-slate-text hover:bg-slate-card transition-colors min-h-[44px]"
              >
                <Home className="h-4 w-4" strokeWidth={1.75} />
                <span>Go to Dashboard</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
