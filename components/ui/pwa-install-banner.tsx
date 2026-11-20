"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Share, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(checkStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosModal(true);
    }
  };

  // If already installed or dismissed, do not render banner
  if (isStandalone || isDismissed || (!deferredPrompt && !isIos)) {
    return null;
  }

  return (
    <>
      <div className="w-full bg-primary-light border-b border-primary-border px-4 py-2 text-xs">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-text">
            <Smartphone className="h-4 w-4 text-primary flex-shrink-0" strokeWidth={1.75} />
            <span className="font-semibold text-slate-text">
              Install GrihaLedger App on your phone for faster offline access and real-time alerts.
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Install App</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded text-slate-muted hover:text-slate-text"
              aria-label="Dismiss install banner"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Instructions Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-xl border border-slate-border bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-border mb-4">
              <h3 className="text-sm font-bold text-slate-text">
                Install on iOS / Safari
              </h3>
              <button
                onClick={() => setShowIosModal(false)}
                className="rounded p-1 text-slate-muted hover:bg-slate-card"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-muted leading-relaxed">
              <p>To install GrihaLedger as a native app on iPhone or iPad:</p>
              <div className="flex items-start gap-2.5 rounded-lg bg-slate-card p-2.5 border border-slate-border">
                <Share className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={1.75} />
                <span>1. Tap the <strong>Share</strong> button at the bottom of Safari.</span>
              </div>
              <div className="flex items-start gap-2.5 rounded-lg bg-slate-card p-2.5 border border-slate-border">
                <PlusSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={1.75} />
                <span>2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5 rounded-lg bg-slate-card p-2.5 border border-slate-border">
                <Smartphone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={1.75} />
                <span>3. Tap <strong>Add</strong> in the top right corner. The app will launch like a native application!</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="mt-5 w-full py-2 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary-hover"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
