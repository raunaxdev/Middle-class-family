import React from "react";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { FileText, CheckCircle2, AlertCircle, Mail, Phone } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions | GrihaLedger",
  description:
    "GrihaLedger Terms and Conditions. Free-tier operational guidelines, family data custody, and terms of service for Indian households.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-xl border border-slate-border bg-surface p-6 sm:p-10 shadow-sm">
          {/* Header */}
          <div className="border-b border-slate-border pb-6">
            <div className="inline-flex items-center gap-2 rounded-md bg-primary-light px-3 py-1 text-xs font-semibold text-primary mb-3">
              <FileText className="h-4 w-4" strokeWidth={1.75} />
              <span>User Agreement</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-text tracking-tight">
              Terms and Conditions of Use
            </h1>
            <p className="mt-2 text-sm text-slate-muted">
              Effective Date: November 2026. Governing use of GrihaLedger and Parivar AI services.
            </p>
          </div>

          {/* Content */}
          <div className="mt-8 space-y-8 text-sm text-slate-text leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-text">
                1. Acceptance of Terms
              </h2>
              <p className="text-slate-muted">
                By creating a family vault, joining via a 6-digit Family Join Code, or installing the GrihaLedger Progressive Web Application (PWA), you agree to be bound by these Terms and Conditions. If you disagree with any portion, please cease usage immediately.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-text">
                2. Zero Operational Cost Model
              </h2>
              <p className="text-slate-muted">
                GrihaLedger is engineered to operate on generous cloud free tiers (PostgreSQL via Supabase, Google Gemini API free tier, and Vercel hosting) to remain ₹0 for Indian families. Users agree to use the service for genuine household management without abusive automated scripting or excessive high-frequency scraping.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-text">
                3. Family Code Security & Custody
              </h2>
              <p className="text-slate-muted">
                Your 6-digit Family Join Code functions as an access key to your family vault. You are responsible for maintaining confidentiality of this code. Share it only with trustworthy household members.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-text">
                4. Informational Purpose of Parivar AI
              </h2>
              <p className="text-slate-muted">
                Parivar AI provides conversational budget summaries, variance analysis, and reminder forecasts. While mathematical computations are verified against your entries, it does not provide certified legal, investment, or statutory tax advice. Users are encouraged to verify critical banking EMIs and medical prescriptions directly with official providers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-text">
                5. Modifications & Availability
              </h2>
              <p className="text-slate-muted">
                We reserve the right to improve features, update category presets, or enhance security protocols. Any significant change will be announced within the platform.
              </p>
            </section>

            <section className="space-y-3 border-t border-slate-border pt-6">
              <h2 className="text-base font-bold text-slate-text">
                6. Questions & Contact
              </h2>
              <p className="text-slate-muted">
                If you have inquiries regarding these terms, reach our support team:
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-1">
                <a
                  href="mailto:support@grihaledger.in"
                  className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" strokeWidth={1.75} />
                  <span>support@grihaledger.in</span>
                </a>
                <a
                  href="tel:+919811234567"
                  className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" strokeWidth={1.75} />
                  <span>+91 98112 34567</span>
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
