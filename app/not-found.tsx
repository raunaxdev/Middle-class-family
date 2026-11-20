import React from "react";
import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | GrihaLedger",
  description: "The requested family ledger page could not be found.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary border border-primary-border mb-6">
        <Search className="h-8 w-8" strokeWidth={1.75} />
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-slate-text sm:text-5xl">
        404
      </h1>
      <h2 className="mt-2 text-lg font-bold text-slate-text">
        Household Page Not Found
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-muted">
        The ledger section or record you are looking for does not exist or has been moved to another household folder.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors min-h-[44px]"
        >
          <Home className="h-4 w-4" strokeWidth={1.75} />
          <span>Return to Family Dashboard</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md border border-slate-border bg-surface px-5 py-2.5 text-sm font-semibold text-slate-text hover:bg-slate-card transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          <span>Go to Home Page</span>
        </Link>
      </div>
    </div>
  );
}
