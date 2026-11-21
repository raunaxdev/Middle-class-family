import React from "react";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { ShieldCheck, Lock, EyeOff, Server, Mail, Phone } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | GrihaLedger",
  description:
    "GrihaLedger Family Privacy Policy. Zero data selling, encrypted family vaults, and complete privacy for Indian middle-class households.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-xl border border-slate-border bg-surface p-6 sm:p-10 shadow-sm">
          {/* Header */}
          <div className="border-b border-slate-border pb-6">
            <div className="inline-flex items-center gap-2 rounded-md bg-primary-light px-3 py-1 text-xs font-semibold text-primary mb-3">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
              <span>Family Privacy Commitment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-text tracking-tight">
              Privacy Policy & Household Data Protection
            </h1>
            <p className="mt-2 text-sm text-slate-muted">
              Last updated: November 2026. Designed with strict zero-cost, zero-commercialization principles.
            </p>
          </div>

          {/* Content */}
          <div className="mt-8 space-y-8 text-sm text-slate-text leading-relaxed">
            {/* Core Promise */}
            <div className="rounded-lg bg-slate-card p-4 border border-slate-border">
              <h2 className="text-sm font-bold text-slate-text flex items-center gap-2 mb-1.5">
                <Lock className="h-4 w-4 text-primary" strokeWidth={1.75} />
                <span>Our 3 Unbreakable Middle-Class Family Privacy Rules</span>
              </h2>
              <ul className="space-y-1.5 text-xs text-slate-muted list-disc list-inside">
                <li><strong className="text-slate-text">Rule 1 (Zero Data Selling):</strong> We will never sell, rent, monetize, or broker your household spending habits, Kirana receipts, or doctor visits to advertisers, insurance companies, or third parties.</li>
                <li><strong className="text-slate-text">Rule 2 (Family Vault Isolation):</strong> Supabase Row Level Security restricts cloud records to authenticated users who belong to that family. A 6-digit invite code is required to join.</li>
                <li><strong className="text-slate-text">Rule 3 (Local-First Reliability):</strong> When cloud credentials are not configured, records are stored in browser localStorage. Browser localStorage is not encrypted by this app, so secure your device and browser profile.</li>
              </ul>
            </div>

            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-text">
                1. Information We Collect
              </h2>
              <p className="text-slate-muted">
                GrihaLedger collects only the operational data explicitly provided by you and your family members:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-muted pl-2">
                <li><strong>Ledger Records:</strong> Grocery and Kirana item names, unit quantities, expected and actual expenditure amounts in Indian Rupees.</li>
                <li><strong>Household Utility Reminders:</strong> LPG booking dates, electricity bill due dates, broadband recharges, and loan EMIs.</li>
                <li><strong>Medical & Health Notes:</strong> Doctor appointments, medicine refill dates, and prescription dosage notes recorded by family members.</li>
                <li><strong>Family Vault Profiles:</strong> First names, chosen avatar colors, and relationship labels (e.g. Father, Mother, Self) used for attribution.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-text">
                2. How Parivar AI Uses Your Data
              </h2>
              <p className="text-slate-muted">
                When you use Parivar AI, your prompt and a limited ledger snapshot may be sent to Google Gemini to generate a response. Avoid entering sensitive information you do not want processed by that provider, and review its current data-handling terms. The offline rule-based parser runs without that request when no Gemini API key is configured.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-text">
                3. Data Storage & Cloud Architecture
              </h2>
              <p className="text-slate-muted">
                Cloud records are hosted in Supabase PostgreSQL and API routes may use Google Gemini. Network traffic is protected in transit by HTTPS. This app does not provide end-to-end encryption; browser localStorage is also not encrypted by this app.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-text">
                4. Data Portability & Deletion
              </h2>
              <p className="text-slate-muted">
                You retain complete ownership of your family records. You can export your full ledger as CSV/PDF at any time from the ledger screens or delete individual records with one tap. To request complete purging of your family vault, you may contact our privacy desk.
              </p>
            </section>

            {/* Section 5: Contact */}
            <section className="space-y-3 border-t border-slate-border pt-6">
              <h2 className="text-base font-bold text-slate-text">
                5. Contacting the GrihaLedger Privacy Desk
              </h2>
              <p className="text-slate-muted">
                For any questions regarding your household records or data safety, please reach out to our team:
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-1">
                <a
                  href="mailto:raunakjha.dav@gmail.com"
                  className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" strokeWidth={1.75} />
                  <span>raunakjha.dav@gmail.com</span>
                </a>
                <a
                  href="tel:+918102977723"
                  className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" strokeWidth={1.75} />
                  <span>+91 81029 77723</span>
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
