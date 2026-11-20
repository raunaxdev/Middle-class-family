import type { Metadata, Viewport } from "next";
import { LedgerProvider } from "@/lib/context/ledger-context";
import { MobileBottomTabs } from "@/components/ui/mobile-bottom-tabs";
import { Toaster } from "sonner";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#047857",
};

export const metadata: Metadata = {
  title: {
    template: "%s | GrihaLedger",
    default: "GrihaLedger - Intelligent Household & Family Finance Management",
  },
  description:
    "Zero-cost, production-ready household ledger and family management platform for Indian middle-class homes. Features Kirana ration tracking, daily milk card calculator, doctor health logs, bills & LPG tracking, and Parivar AI.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GrihaLedger",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "GrihaLedger",
    title: "GrihaLedger - Intelligent Household & Family Finance Management",
    description:
      "Zero-cost, production-ready household ledger and family management platform for Indian middle-class homes.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="min-h-screen bg-background text-slate-text font-sans antialiased overflow-x-hidden selection:bg-primary-light selection:text-primary pb-16 md:pb-0">
        <LedgerProvider>
          {children}
          <MobileBottomTabs />
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              className: "font-sans text-xs rounded-lg shadow-md",
            }}
          />
        </LedgerProvider>
      </body>
    </html>
  );
}
