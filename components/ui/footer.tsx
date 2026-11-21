import React from "react";
import Link from "next/link";
import { Home, Phone, Mail, ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-border bg-surface text-slate-text">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-90"
              aria-label="GrihaLedger Home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <Home className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <span className="text-base font-bold text-slate-text">GrihaLedger</span>
            </Link>
            <p className="text-xs text-slate-muted leading-relaxed">
              Intelligent, zero-cost household management platform crafted for Indian middle-class families.
              Track every rupee, ration item, medical refill, and bill with 100% accuracy.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-muted">
              <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={1.75} />
              <span>Authenticated, family-scoped data access</span>
            </div>
          </div>

          {/* Quick Ledgers */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-text">
              Household Ledgers
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link
                  href="/ledger/kirana"
                  className="text-slate-muted hover:text-primary transition-colors"
                >
                  Kirana & Monthly Ration
                </Link>
              </li>
              <li>
                <Link
                  href="/ledger/sabzi-dairy"
                  className="text-slate-muted hover:text-primary transition-colors"
                >
                  Daily Milk Card & Mandi Sabzi
                </Link>
              </li>
              <li>
                <Link
                  href="/ledger/medical"
                  className="text-slate-muted hover:text-primary transition-colors"
                >
                  Medical, Doctor & Prescriptions
                </Link>
              </li>
              <li>
                <Link
                  href="/ledger/education"
                  className="text-slate-muted hover:text-primary transition-colors"
                >
                  Kids School Fees & Books
                </Link>
              </li>
              <li>
                <Link
                  href="/ledger/bills-emi"
                  className="text-slate-muted hover:text-primary transition-colors"
                >
                  Bills, LPG Gas Tracker & EMIs
                </Link>
              </li>
            </ul>
          </div>

          {/* Features & AI */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-text">
              Platform & Tools
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link
                  href="/dashboard"
                  className="text-slate-muted hover:text-primary transition-colors"
                >
                  Family Overview Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/assistant"
                  className="text-slate-muted hover:text-primary transition-colors font-medium text-primary"
                >
                  Parivar AI Voice & Chat Assistant
                </Link>
              </li>
              <li>
                <Link
                  href="/ledger/udhaar"
                  className="text-slate-muted hover:text-primary transition-colors"
                >
                  Udhaar & Len-Den Register
                </Link>
              </li>
              <li>
                <Link
                  href="/ledger/savings"
                  className="text-slate-muted hover:text-primary transition-colors"
                >
                  Savings, RD/FD & Emergency Fund
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-text">
              Support & Legal
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-slate-muted hover:text-primary transition-colors"
                >
                  Privacy Policy (Zero Data Selling)
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-slate-muted hover:text-primary transition-colors"
                >
                  Terms and Conditions
                </Link>
              </li>
              <li className="pt-2">
                <a
                  href="tel:+919811234567"
                  className="flex items-center gap-1.5 text-slate-muted hover:text-primary transition-colors"
                  aria-label="Call Support"
                >
                  <Phone className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                  <span>+91 81029 77723</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:raunakjha.dav@gmail.com"
                  className="flex items-center gap-1.5 text-slate-muted hover:text-primary transition-colors"
                  aria-label="Email Support"
                >
                  <Mail className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                  <span>support@grihaledger.in</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-slate-border pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-muted gap-3">
          <p>© {currentYear} GrihaLedger. All rights reserved. Built for Indian middle-class households.</p>
          <p className="flex items-center gap-1 text-slate-muted">
            Designed for financial clarity and family harmony.
          </p>
        </div>
      </div>
    </footer>
  );
}
