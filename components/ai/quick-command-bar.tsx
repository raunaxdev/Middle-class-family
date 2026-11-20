"use client";

import React, { useState } from "react";
import { useLedger } from "@/lib/context/ledger-context";
import { Bot, Send, Sparkles, CheckCircle2, ArrowRight, CornerDownLeft, Loader2 } from "lucide-react";
import { formatRupees } from "@/lib/utils";
import { LedgerItem } from "@/types";
import { toast } from "sonner";

export function QuickCommandBar() {
  const { items, categories, family, addItem } = useLedger();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [pendingItems, setPendingItems] = useState<Partial<LedgerItem>[] | null>(null);

  const quickPrompts = [
    "Pichla gas cylinder kab book kiya tha?",
    "Is mahine kirana budget se kitna upar gaya?",
    "Kaun kaun se bills due hain?",
    "Aaj 450 ka sabzi aur 1200 papa ki dawai liya",
  ];

  const handleExecute = async (textToRun?: string) => {
    const query = (textToRun || prompt).trim();
    if (!query || isLoading) return;

    setIsConfirming(false);
    setIsLoading(true);
    setResponse(null);
    setPendingItems(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          items,
          categories,
          monthlyBudget: family?.monthly_budget ?? 45000,
        }),
      });

      const data = await res.json();
      if (data.answer) {
        setResponse(data.answer);
      }
      if (data.parsed_actions?.items && data.parsed_actions.items.length > 0) {
        setPendingItems(data.parsed_actions.items);
      }
    } catch {
      toast.error("Could not process request at the moment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAddItems = () => {
    if (isConfirming || !pendingItems || pendingItems.length === 0 || !family) return;

    setIsConfirming(true);
    let count = 0;
    for (const item of pendingItems) {
      addItem({
        family_id: family.id,
        category_slug: item.category_slug || "kirana",
        item_name: item.item_name || "Ghar ka kharcha",
        quantity: item.quantity || "1",
        unit: item.unit || "unit",
        expected_price: item.expected_price ?? item.actual_price ?? 0,
        actual_price: item.actual_price ?? 0,
        status: "Bought",
        recurrence: "One-time",
        created_by_name: "Parivar AI",
        extra_data: item.extra_data || {},
      });
      count++;
    }

    toast.success(`Successfully logged ${count} items into family ledger!`);
    setPendingItems(null);
    setResponse("Yeh sabhi kharche aapke ledger mein jod diye gaye hain.");
    setPrompt("");
  };

  return (
    <div className="rounded-xl border border-primary-border bg-gradient-to-b from-white to-primary-light/20 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
          <Bot className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-text flex items-center gap-1.5">
            <span>Parivar AI Command Bar</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-white">
              HINGLISH READY
            </span>
          </h2>
          <p className="text-xs text-slate-muted">
            Ask questions about family spending or log expenses naturally in Hindi/English
          </p>
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleExecute();
        }}
        className="relative flex items-center"
      >
        <input
          type="text"
          placeholder="e.g. 'Aaj 450 ki sabzi aur 300 ka mustard oil liya' or 'Gas cylinder kab book kiya tha?'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full rounded-lg border border-slate-border bg-surface pl-3.5 pr-24 py-2.5 text-sm text-slate-text placeholder:text-slate-subtle focus:border-primary focus:outline-none min-h-[44px]"
        />
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="absolute right-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
          ) : (
            <>
              <span>Ask</span>
              <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
            </>
          )}
        </button>
      </form>

      {/* Quick Prompt Pills */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="text-[11px] font-semibold text-slate-muted self-center mr-1">
          Try asking:
        </span>
        {quickPrompts.map((qp) => (
          <button
            key={qp}
            type="button"
            disabled={isLoading}
            onClick={() => {
              setPrompt(qp);
              handleExecute(qp);
            }}
            className="rounded-md border border-slate-border bg-white px-2.5 py-1 text-[11px] font-medium text-slate-text hover:border-primary hover:bg-primary-light/50 transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* AI Response Display */}
      {response && (
        <div className="mt-4 rounded-lg border border-slate-border bg-surface p-3.5 text-xs text-slate-text leading-relaxed animate-in fade-in">
          <div className="flex items-center gap-1.5 font-bold text-primary mb-1">
            <Bot className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Parivar AI Answer:</span>
          </div>
          <p className="whitespace-pre-line text-slate-text">{response}</p>

          {/* If items were extracted, offer 1-click confirmation */}
          {pendingItems && pendingItems.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-border">
              <div className="font-semibold text-slate-text mb-2">
                Identified {pendingItems.length} Expenses:
              </div>
              <div className="space-y-1.5 mb-3">
                {pendingItems.map((pi, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-md bg-slate-card px-2.5 py-1.5 text-xs"
                  >
                    <span className="font-medium text-slate-text">
                      {pi.item_name} ({pi.category_slug})
                    </span>
                    <span className="font-bold text-primary">
                      {formatRupees(pi.actual_price)}
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleConfirmAddItems}
                disabled={isConfirming}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                <span>Confirm & Add to Ledger</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
