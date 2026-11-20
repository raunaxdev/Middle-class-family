"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLedger } from "@/lib/context/ledger-context";
import { PwaInstallBanner } from "@/components/ui/pwa-install-banner";
import {
  Home,
  ShoppingBag,
  Milk,
  HeartPulse,
  GraduationCap,
  Receipt,
  ArrowLeftRight,
  PiggyBank,
  Bot,
  Menu,
  X,
  Users,
  Copy,
  Check,
  LogOut,
  User,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface HeaderProps {
  onOpenFamilyModal?: () => void;
}

export function Header({ onOpenFamilyModal }: HeaderProps) {
  const pathname = usePathname();
  const { user, family, currentMember, signOut } = useLedger();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/ledger/kirana", label: "Kirana Ration", icon: ShoppingBag },
    { href: "/ledger/sabzi-dairy", label: "Sabzi & Milk", icon: Milk },
    { href: "/ledger/bills-emi", label: "Bills & EMI", icon: Receipt },
    { href: "/assistant", label: "Parivar AI", icon: Bot, isHighlight: true },
  ];

  const allLedgers = [
    { href: "/ledger/kirana", label: "Kirana & Ration", icon: ShoppingBag },
    { href: "/ledger/sabzi-dairy", label: "Sabzi & Dairy", icon: Milk },
    { href: "/ledger/medical", label: "Medical & Doctor", icon: HeartPulse },
    { href: "/ledger/education", label: "Kids & Education", icon: GraduationCap },
    { href: "/ledger/bills-emi", label: "Bills, Recharge & EMI", icon: Receipt },
    { href: "/ledger/udhaar", label: "Udhaar & Len-Den", icon: ArrowLeftRight },
    { href: "/ledger/savings", label: "Savings & Investments", icon: PiggyBank },
  ];

  const handleCopyJoinCode = () => {
    if (!family) return;
    navigator.clipboard.writeText(family.join_code);
    setCopiedCode(true);
    toast.success(`Copied Family Join Code: ${family.join_code}`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <>
      <PwaInstallBanner />
      <header className="sticky top-0 z-40 w-full border-b border-slate-border bg-surface shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
              aria-label="GrihaLedger Home"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
                <Home className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-text">
                  GrihaLedger
                </span>
                <span className="hidden text-xs font-medium text-slate-muted sm:inline-block ml-1.5 border-l border-slate-border pl-1.5">
                  Parivar AI
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links (When Logged In) */}
            {user && family && (
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? "bg-primary-light text-primary font-semibold"
                          : "text-slate-muted hover:bg-slate-card hover:text-slate-text"
                      } ${link.isHighlight ? "border border-primary-border bg-primary-light/50 text-primary" : ""}`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Section: Family Vault Code, User Profile, Sign Out */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {user ? (
              <>
                {/* Family Join Code Pill */}
                {family && (
                  <button
                    onClick={handleCopyJoinCode}
                    title="Click to copy 6-digit family invite code"
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-slate-card border border-slate-border rounded-md text-slate-text hover:bg-slate-100 transition-colors"
                  >
                    <Users className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                    <span>Vault:</span>
                    <span className="font-mono text-primary font-bold tracking-wider">{family.join_code}</span>
                    {copiedCode ? (
                      <Check className="h-3 w-3 text-primary" strokeWidth={1.75} />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-muted" strokeWidth={1.75} />
                    )}
                  </button>
                )}

                {/* Real Logged-In User Profile */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-slate-border bg-surface text-xs font-medium text-slate-text min-h-[44px]">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white font-bold text-xs">
                    {(currentMember?.name || user.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block leading-tight">
                    <div className="font-semibold text-slate-text truncate max-w-[110px]">
                      {currentMember?.name || user.name || user.email}
                    </div>
                    <div className="text-[10px] text-slate-muted">
                      {currentMember?.role || "Member"}
                    </div>
                  </div>
                  {currentMember && (
                    <span
                      className={`hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        currentMember.role === "Head"
                          ? "bg-primary-light text-primary border border-primary-border"
                          : "bg-slate-card text-slate-muted"
                      }`}
                    >
                      {currentMember.role}
                    </span>
                  )}
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={() => signOut()}
                  title="Sign Out"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-border text-xs text-slate-muted hover:text-danger hover:bg-danger-light transition-colors min-h-[44px]"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.75} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              /* Unauthenticated Actions */
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-border text-slate-text hover:bg-slate-card transition-colors min-h-[40px] flex items-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-primary text-white hover:bg-primary-hover shadow-sm transition-colors min-h-[40px] flex items-center"
                >
                  Get Started Free
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle (Logged In) */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex md:hidden items-center justify-center h-11 w-11 rounded-md border border-slate-border text-slate-text hover:bg-slate-card focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" strokeWidth={1.75} />
                ) : (
                  <Menu className="h-5 w-5" strokeWidth={1.75} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && user && (
          <div className="md:hidden border-t border-slate-border bg-surface px-4 pt-3 pb-6 shadow-xl">
            {family && (
              <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-card p-3 border border-slate-border">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" strokeWidth={1.75} />
                  <div>
                    <div className="text-xs font-semibold text-slate-text">{family.name}</div>
                    <div className="font-mono text-xs text-primary font-bold">Code: {family.join_code}</div>
                  </div>
                </div>
                <button
                  onClick={handleCopyJoinCode}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-slate-border text-slate-text"
                >
                  Copy Code
                </button>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider px-2 py-1">
                Main Pages
              </div>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-md min-h-[44px] ${
                  pathname === "/dashboard"
                    ? "bg-primary-light text-primary font-semibold"
                    : "text-slate-text hover:bg-slate-card"
                }`}
              >
                <Home className="h-4 w-4" strokeWidth={1.75} />
                <span>Family Overview Dashboard</span>
              </Link>
              <Link
                href="/assistant"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-md min-h-[44px] border border-primary-border bg-primary-light/40 text-primary font-medium`}
              >
                <Bot className="h-4 w-4 text-primary" strokeWidth={1.75} />
                <span>Parivar AI Assistant</span>
              </Link>

              <div className="pt-2 text-[11px] font-semibold text-slate-muted uppercase tracking-wider px-2 py-1">
                Household Ledgers
              </div>
              {allLedgers.map((ledger) => {
                const Icon = ledger.icon;
                const isActive = pathname === ledger.href;
                return (
                  <Link
                    key={ledger.href}
                    href={ledger.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-md min-h-[44px] ${
                      isActive
                        ? "bg-primary-light text-primary font-semibold"
                        : "text-slate-text hover:bg-slate-card"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-slate-muted" strokeWidth={1.75} />
                    <span>{ledger.label}</span>
                  </Link>
                );
              })}

              <div className="pt-3 border-t border-slate-border mt-3">
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-md text-danger hover:bg-danger-light min-h-[44px]"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.75} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
