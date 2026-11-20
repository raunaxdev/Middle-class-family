"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Bot, Users } from "lucide-react";
import { FamilyModal } from "@/components/modals/family-modal";
import { useLedger } from "@/lib/context/ledger-context";

export function MobileBottomTabs() {
  const pathname = usePathname();
  const { user, family } = useLedger();
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);

  // Only show bottom tabs when user is logged in
  if (!user || !family) return null;

  // Don't show on login or onboarding
  if (pathname === "/login" || pathname === "/onboarding") return null;

  const isDashboard = pathname === "/dashboard";
  const isLedger = pathname.startsWith("/ledger");
  const isAssistant = pathname === "/assistant";

  return (
    <>
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-slate-border shadow-lg"
      >
        <div className="grid grid-cols-4 h-14">
          {/* 1. Dashboard Tab */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${
              isDashboard ? "text-primary font-bold" : "text-slate-muted hover:text-slate-text"
            }`}
          >
            <Home className="h-5 w-5" strokeWidth={isDashboard ? 2.2 : 1.75} />
            <span className="text-[10px] mt-0.5">Dashboard</span>
          </Link>

          {/* 2. Ledgers Tab */}
          <Link
            href="/ledger/kirana"
            className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${
              isLedger ? "text-primary font-bold" : "text-slate-muted hover:text-slate-text"
            }`}
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={isLedger ? 2.2 : 1.75} />
            <span className="text-[10px] mt-0.5">Ledgers</span>
          </Link>

          {/* 3. Parivar AI Tab */}
          <Link
            href="/assistant"
            className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${
              isAssistant ? "text-primary font-bold" : "text-slate-muted hover:text-slate-text"
            }`}
          >
            <div className="relative">
              <Bot className="h-5 w-5" strokeWidth={isAssistant ? 2.2 : 1.75} />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </div>
            <span className="text-[10px] mt-0.5">Parivar AI</span>
          </Link>

          {/* 4. Family Tab */}
          <button
            type="button"
            onClick={() => setIsFamilyModalOpen(true)}
            className="flex flex-col items-center justify-center min-h-[48px] text-slate-muted hover:text-slate-text transition-colors"
          >
            <Users className="h-5 w-5" strokeWidth={1.75} />
            <span className="text-[10px] mt-0.5">Family</span>
          </button>
        </div>
      </nav>

      <FamilyModal
        isOpen={isFamilyModalOpen}
        onClose={() => setIsFamilyModalOpen(false)}
      />
    </>
  );
}
