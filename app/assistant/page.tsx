"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLedger } from "@/lib/context/ledger-context";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Trash2,
  CheckCircle2,
  Plus,
  ArrowRight,
  Clock,
  HelpCircle,
  Loader2,
  User,
} from "lucide-react";
import { formatRupees, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { LedgerItem } from "@/types";

import { useRouter } from "next/navigation";

export default function AssistantPage() {
  const router = useRouter();
  const {
    user,
    family,
    authLoading,
    isLoaded,
    chatMessages,
    addChatMessage,
    clearChatHistory,
    items,
    categories,
    currentMember,
    addItem,
  } = useLedger();

  useEffect(() => {
    if (!authLoading && isLoaded) {
      if (!user) {
        router.push("/login");
      } else if (!family) {
        router.push("/onboarding");
      }
    }
  }, [user, family, authLoading, isLoaded, router]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isLoading]);

  const quickQuestions = [
    "Pichla gas cylinder kab book kiya tha?",
    "Is mahine kirana budget se kitna upar gaya?",
    "Kaun kaun se bills aur EMI due hain?",
    "Ramesh uncle se kitna udhaar aana baaki hai?",
    "Aaj 450 ki sabzi aur 1200 papa ki dawai liya",
  ];

  const handleSend = async (overridePrompt?: string) => {
    const text = (overridePrompt || input).trim();
    if (!text || isLoading) return;

    // Add user message to state
    addChatMessage({
      role: "user",
      content: text,
    });

    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          items,
          categories,
          monthlyBudget: family?.monthly_budget ?? 45000,
        }),
      });

      const data = await res.json();
      addChatMessage({
        role: "assistant",
        content: data.answer || "Main samajh nahi paya, kripya dobara batayein.",
        parsed_actions: data.parsed_actions,
      });
    } catch {
      addChatMessage({
        role: "assistant",
        content: "Maaf kijiye, system offline hone ke karan parinam nahi mil paya.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Web Speech API Voice Dictation
  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "hi-IN"; // Hindi / Hinglish recognition
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Listening... Speak in Hindi or English (e.g. 'Aaj 450 ki sabzi li')");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSend(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error("Could not capture speech. Please try typing.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      toast.error("Microphone access could not be initialized");
    }
  };

  const handleLogParsedItems = (parsedItems: Partial<LedgerItem>[]) => {
    if (!family) {
      toast.error("Family vault not loaded");
      return;
    }
    let count = 0;
    for (const item of parsedItems) {
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
        created_by_name: currentMember?.name || "Self",
        extra_data: item.extra_data || {},
      });
      count++;
    }

    addChatMessage({
      role: "assistant",
      content: `Shukriya! Maine yeh ${count} kharche safaltapoorvak aapke household ledger mein add kar diye hain.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {/* Top Title Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-border mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <Bot className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-text flex items-center gap-2">
                <span>Parivar AI</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-light text-primary border border-primary-border">
                  FAMILY ASSISTANT
                </span>
              </h1>
              <p className="text-xs text-slate-muted">
                Answers based on available {family?.name || "Family"} ledger records
              </p>
            </div>
          </div>

          <button
            onClick={clearChatHistory}
            title="Clear conversation"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-border text-slate-muted hover:bg-slate-card hover:text-danger transition-colors min-h-[44px]"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Clear History</span>
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="text-xs font-semibold text-slate-muted self-center mr-1">
            Frequent questions:
          </span>
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-border bg-surface text-slate-text hover:border-primary hover:bg-primary-light/40 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-4 rounded-xl border border-slate-border bg-surface p-4 sm:p-6 shadow-sm min-h-[380px] max-h-[550px]">
          {chatMessages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                    <Bot className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? "bg-slate-text text-white rounded-br-none"
                      : "bg-slate-card border border-slate-border text-slate-text rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  {/* If items were identified, offer log button */}
                  {msg.parsed_actions?.items && msg.parsed_actions.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="font-semibold mb-1 text-slate-text">
                        Detected Expenses ({msg.parsed_actions.items.length}):
                      </div>
                      <div className="space-y-1 mb-2">
                        {msg.parsed_actions.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-border text-xs"
                          >
                            <span className="font-medium text-slate-text">
                              {it.item_name} ({it.category_slug})
                            </span>
                            <span className="font-bold text-primary">
                              {formatRupees(it.actual_price)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleLogParsedItems(msg.parsed_actions!.items!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-sm transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        <span>Log All to Ledger</span>
                      </button>
                    </div>
                  )}

                  <div
                    className={`mt-1.5 text-[10px] ${
                      isUser ? "text-slate-300 text-right" : "text-slate-muted"
                    }`}
                  >
                    {formatDate(msg.timestamp)}
                  </div>
                </div>

                {isUser && (
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white font-bold text-xs"
                    style={{ backgroundColor: currentMember?.avatar_color || "#047857" }}
                  >
                    {(currentMember?.name || user?.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center text-xs text-slate-muted">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <Bot className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-card p-3 border border-slate-border">
                <Loader2 className="h-4 w-4 animate-spin text-primary" strokeWidth={1.75} />
                <span>Parivar AI is analyzing family records...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Box */}
        <div className="mt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Ask anything or log expenses in Hinglish / English..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full rounded-lg border border-slate-border bg-surface pl-3.5 pr-10 py-3 text-sm text-slate-text placeholder:text-slate-subtle focus:border-primary focus:outline-none min-h-[44px]"
              />
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                title="Dictate in Hindi or English"
                className={`absolute right-2 top-2 p-1.5 rounded-md transition-colors ${
                  isListening
                    ? "bg-danger text-white animate-pulse"
                    : "text-slate-muted hover:bg-slate-card hover:text-slate-text"
                }`}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Mic className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex items-center gap-1.5 px-4 py-3 rounded-lg bg-primary text-white font-semibold text-xs hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-sm min-h-[44px]"
            >
              <span>Send</span>
              <Send className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </form>
          <div className="mt-2 text-center text-[11px] text-slate-muted">
            AI requests may include your prompt and a limited ledger snapshot sent to Google Gemini.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
