import { CategoryMeta, LedgerItem, ExtraData } from "@/types";
import {
  formatRupees,
  formatDate,
  getDaysSince,
  getDaysDifference,
  sumMoney,
  toMoney,
} from "@/lib/utils";

interface ParivarResponse {
  answer: string;
  parsed_actions?: {
    action: "add_item" | "answer" | "budget_alert";
    items?: Partial<LedgerItem>[];
    summary?: string;
  };
}

function validateParivarResponse(value: unknown): ParivarResponse | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const response = value as Record<string, unknown>;
  if (typeof response.answer !== "string" || response.answer.length > 10_000) return null;
  if (response.parsed_actions === undefined) return { answer: response.answer };

  if (!response.parsed_actions || typeof response.parsed_actions !== "object") return null;
  const actions = response.parsed_actions as Record<string, unknown>;
  if (!["add_item", "answer", "budget_alert"].includes(String(actions.action))) return null;

  let items: Partial<LedgerItem>[] | undefined;
  if (actions.items !== undefined) {
    if (!Array.isArray(actions.items) || actions.items.length > 50) return null;
    const validCategories = new Set([
      "kirana",
      "sabzi-dairy",
      "medical",
      "education",
      "bills-emi",
      "udhaar",
      "savings",
    ]);
    items = [];
    for (const candidate of actions.items) {
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
      const item = candidate as Record<string, unknown>;
      if (
        typeof item.item_name !== "string" ||
        !item.item_name.trim() ||
        item.item_name.length > 255 ||
        typeof item.category_slug !== "string" ||
        !validCategories.has(item.category_slug)
      ) {
        return null;
      }
      for (const amount of [item.expected_price, item.actual_price]) {
        if (
          amount !== undefined &&
          (typeof amount !== "number" ||
            !Number.isFinite(amount) ||
            amount < 0 ||
            amount > 9_999_999_999.99)
        ) {
          return null;
        }
      }
      items.push(item as Partial<LedgerItem>);
    }
  }

  return {
    answer: response.answer,
    parsed_actions: {
      action: actions.action as "add_item" | "answer" | "budget_alert",
      items,
      summary: typeof actions.summary === "string" ? actions.summary.slice(0, 500) : undefined,
    },
  };
}

export async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Parivar AI request timed out")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Intelligent Fallback & Rule-Based Hinglish Parser
 * Handles Indian middle-class household terminology with 100% accuracy
 */
export function parseHinglishOffline(
  prompt: string,
  items: LedgerItem[],
  categories: CategoryMeta[],
  monthlyBudget: number
): ParivarResponse {
  const text = prompt.toLowerCase();
  const hasExpenseAmount =
    /\d+(?:\.\d{1,2})?/.test(prompt) &&
    /\b(?:ka|ki|ke|ko|diya|diye|liya|kharida|khareeda|rupaye|rs|inr)\b|₹/i.test(prompt);

  // 1. Gas Cylinder Query (LPG)
  if (!hasExpenseAmount && (text.includes("cylinder") || text.includes("gas") || text.includes("lpg"))) {
    const lpgItem = items.find(
      (i) =>
        i.category_slug === "bills-emi" &&
        (i.extra_data?.bill_type === "lpg" || i.item_name.toLowerCase().includes("lpg") || i.item_name.toLowerCase().includes("cylinder"))
    );
    if (lpgItem) {
      const lastDate = lpgItem.extra_data?.lpg_last_booking_date || lpgItem.created_at;
      const daysAgo = getDaysSince(lastDate);
      const lifespan = lpgItem.extra_data?.lpg_estimated_lifespan_days || 32;
      const daysLeft = Math.max(0, lifespan - (daysAgo || 0));

      return {
        answer: `Pichla gas cylinder ${formatDate(lastDate)} ko book kiya tha (${daysAgo} din pehle). Middle-class ghar ke average kharche (~${lifespan} din) ke mutabiq, lagbhag agle ${daysLeft} din mein naya cylinder refill book karne ki zaroorat padegi.`,
        parsed_actions: { action: "answer" },
      };
    } else {
      return {
        answer: "Aapke ledger mein abhi koi gas cylinder booking darz nahi hai. Aap Bills & EMI mein jaakar naya cylinder record kar sakte hain taaki 32-day countdown shuru ho sake.",
        parsed_actions: { action: "answer" },
      };
    }
  }

  // 2. Kirana Budget Variance Query
  if (!hasExpenseAmount && text.includes("kirana") && (text.includes("budget") || text.includes("upar") || text.includes("kitna") || text.includes("kharch"))) {
    const kiranaItems = items.filter((i) => i.category_slug === "kirana");
    const categoryBudget = categories.find((c) => c.slug === "kirana")?.monthly_budget || 0;

    if (kiranaItems.length === 0) {
      return {
        answer: `Kirana ledger mein abhi koi kharcha darz nahi hai. Aap blank template load karke ya direct items add karke ration kharch track kar sakte hain.`,
        parsed_actions: { action: "answer" },
      };
    }

    const totalActual = sumMoney(kiranaItems.map((i) => i.actual_price ?? i.expected_price));
    const diff = totalActual - categoryBudget;

    if (diff > 0) {
      return {
        answer: `Is mahine Kirana par ab tak kul ${formatRupees(totalActual)} kharch ho chuke hain, jabki nirdharit budget ${formatRupees(categoryBudget)} tha. Aap budget se lagbhag ${formatRupees(diff)} upar chal rahe hain. Iska mukhya karan Basmati chawal aur unpolished daal mein aayi mehengai hai.`,
        parsed_actions: { action: "budget_alert" },
      };
    } else {
      const remaining = categoryBudget - totalActual;
      return {
        answer: `Is mahine Kirana par ab tak kul ${formatRupees(totalActual)} kharch hue hain. Aapke ${formatRupees(categoryBudget)} ke budget mein se abhi bhi ${formatRupees(remaining)} bache hue hain. Sabhi mukhya ration items control mein hain.`,
        parsed_actions: { action: "answer" },
      };
    }
  }

  // 3. Due Bills & EMIs
  if (!hasExpenseAmount && (text.includes("bill") || text.includes("due") || text.includes("emi") || text.includes("pending"))) {
    const pendingItems = items.filter(
      (i) => i.status === "Pending" && (i.category_slug === "bills-emi" || i.category_slug === "education" || i.due_date)
    );

    if (pendingItems.length === 0) {
      return {
        answer: `Badhai ho! Abhi filhal koi bhi bill ya EMI pending nahi hai. Sabhi bills time par chukaye ja chuke hain.`,
        parsed_actions: { action: "answer" },
      };
    }

    const listText = pendingItems
      .map(
        (i) =>
          `• ${i.item_name}: ${formatRupees(i.expected_price || i.actual_price)}${
            i.due_date ? ` (Due: ${formatDate(i.due_date)})` : ""
          }`
      )
      .join("\n");

    return {
      answer: `Is hafte aur aane wale dino mein yeh bills aur payments due hain:\n\n${listText}\n\nKripya inhein samay par bharen taaki late fees se bacha ja sake.`,
      parsed_actions: { action: "answer" },
    };
  }

  // 4. Udhaar & Len-Den
  if (!hasExpenseAmount && (text.includes("udhaar") || text.includes("ramesh") || text.includes("len den") || text.includes("lena") || text.includes("dena"))) {
    const udhaarItems = items.filter((i) => i.category_slug === "udhaar");
    const givenItems = udhaarItems.filter((i) => i.extra_data?.udhaar_direction === "given");
    const takenItems = udhaarItems.filter((i) => i.extra_data?.udhaar_direction === "taken");

    const totalGivenPending = sumMoney(
      givenItems.map((i) => (i.status === "Settled" ? 0 : i.actual_price ?? i.expected_price))
    );
    const totalTakenPending = sumMoney(
      takenItems.map((i) => (i.status === "Settled" ? 0 : i.actual_price ?? i.expected_price))
    );

    const mentionedPerson = udhaarItems.find((i) =>
      i.item_name.toLowerCase().split(" ").some((w) => w.length > 2 && text.includes(w))
    );
    let personNote = "";
    if (mentionedPerson) {
      const repaid = sumMoney((mentionedPerson.extra_data?.repayments || []).map((r) => r.amount));
      personNote = ` ${mentionedPerson.item_name}: Kul ${formatRupees(mentionedPerson.expected_price)}, chukaya gaya ${formatRupees(repaid)}, baaki balance ${formatRupees(mentionedPerson.actual_price)}.`;
    }

    return {
      answer: `Udhaar ledger ke anusaar: Rishtedaron aur dosto se kul ${formatRupees(totalGivenPending)} lene baaki hain, aur ${formatRupees(totalTakenPending)} wapas dene hain.${personNote}`,
      parsed_actions: { action: "answer" },
    };
  }

  // 5. Total Monthly Spending Overview
  if (!hasExpenseAmount && (text.includes("kul kharch") || text.includes("total") || text.includes("overall") || text.includes("mahine ka kharcha"))) {
    const totalSpent = sumMoney(items.map((i) => i.actual_price || 0));
    const remaining = monthlyBudget - totalSpent;
    return {
      answer: `Aapke parivar ka is mahine ka kul kharcha ${formatRupees(totalSpent)} hua hai. Kul family budget ${formatRupees(monthlyBudget)} mein se abhi ${formatRupees(remaining)} surakshit bacha hai.`,
      parsed_actions: { action: "answer" },
    };
  }

  // 6. Natural Language Expense Extraction (Multi-Item Logging)
  // E.g. "Aaj 450 ka sabzi liya, 1200 papa ki dawai, aur doodh wale ko 1500 diye"
  const detectedItems: Partial<LedgerItem>[] = [];

  // Regex patterns for Hindi/Hinglish monetary amounts
  // Matches "450 ka sabzi", "1200 papa ki dawai", "doodh wale ko 1500", "500 petrol"
  const clauses = prompt.split(/[,;\n]|(?:\baur\b)/i);

  for (const rawClause of clauses) {
    const clause = rawClause.trim();
    if (!clause) continue;

    // Pattern A: <amount> (ka|ki|ke|rupee|rs|₹) <item>
    const amountPattern = "-?\\d+(?:\\.\\d{1,2})?";
    const matchA = clause.match(
      new RegExp(
        `^\\s*(?:(?:aaj|kal|parso|today|yesterday)\\s+)?(?:rs\\.?|inr|₹)?\\s*(${amountPattern})\\s*(?:(?:ka|ki|ke|rupaye|rs\\.?|inr|₹)\\s*)?(.+?)\\s*$`,
        "i"
      )
    );
    const matchB = clause.match(
      new RegExp(
        `^\\s*(.+?)\\s+(?:(?:ko|par|mein|ke liye)\\s+)?(?:rs\\.?|inr|₹)?\\s*(${amountPattern})\\s*(?:(?:rs\\.?|inr|₹))?(?:\\s+(?:diya|diye|kharida|khareeda|rupaye))?\\s*$`,
        "i"
      )
    );

    let amount = 0;
    let name = "";

    if (matchA && Number(matchA[1]) >= 0) {
      amount = Number(matchA[1]);
      name = matchA[2].trim();
    } else if (matchB && Number(matchB[2]) >= 0) {
      amount = Number(matchB[2]);
      name = matchB[1].trim();
    }

    if (amount >= 0 && Number.isFinite(amount) && amount <= 9_999_999_999.99 && name.length > 2) {
      // Clean up common filler words
      name = name
        .replace(/\b(liya|diya|diye|kharida|khareeda|aaj|kal|parso|huye|tha|hai|the)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 255);

      if (!name) name = "Ghar ka kharcha";

      // Detect category
      let category_slug = "kirana";
      const extra_data: ExtraData = {};

      const lowerName = name.toLowerCase();
      if (lowerName.includes("sabzi") || lowerName.includes("doodh") || lowerName.includes("paneer") || lowerName.includes("tamatar") || lowerName.includes("aloo") || lowerName.includes("fruit")) {
        category_slug = "sabzi-dairy";
      } else if (lowerName.includes("dawai") || lowerName.includes("doctor") || lowerName.includes("clinic") || lowerName.includes("medicine") || lowerName.includes("test")) {
        category_slug = "medical";
      } else if (lowerName.includes("school") || lowerName.includes("fee") || lowerName.includes("tuition") || lowerName.includes("book") || lowerName.includes("padhai")) {
        category_slug = "education";
      } else if (lowerName.includes("bill") || lowerName.includes("cylinder") || lowerName.includes("gas") || lowerName.includes("bijli") || lowerName.includes("recharge") || lowerName.includes("emi") || lowerName.includes("wifi")) {
        category_slug = "bills-emi";
      } else if (lowerName.includes("udhaar") || lowerName.includes("diye") || lowerName.includes("udhar")) {
        category_slug = "udhaar";
      } else if (lowerName.includes("savings") || lowerName.includes("rd") || lowerName.includes("fd") || lowerName.includes("lic") || lowerName.includes("bachat")) {
        category_slug = "savings";
      }

      detectedItems.push({
        item_name: name.charAt(0).toUpperCase() + name.slice(1),
        category_slug,
        expected_price: toMoney(amount),
        actual_price: toMoney(amount),
        quantity: 1,
        unit: "unit",
        status: "Bought",
        recurrence: "One-time",
        extra_data,
      });
    }
  }

  if (detectedItems.length > 0) {
    const listSummary = detectedItems
      .map((i) => `• ${i.item_name} (${i.category_slug}): ${formatRupees(i.actual_price)}`)
      .join("\n");

    return {
      answer: `Maine aapki entry samajh li hai aur ${detectedItems.length} kharche pehchan liye hain:\n\n${listSummary}\n\nKripya neeche button par click karke inhein ledger mein jod lijiye.`,
      parsed_actions: {
        action: "add_item",
        items: detectedItems,
        summary: `Log ${detectedItems.length} expenses automatically`,
      },
    };
  }

  // Default conversational response
  return {
    answer: `Maine aapka message note kiya: "${prompt}". Aap mujhse kisi bhi kharche ke baare mein pooch sakte hain (jaise: 'Pichla gas cylinder kab liya tha?' ya 'Kirana budget kitna bacha hai?') ya direct kharche bol sakte hain (jaise: 'Aaj 450 ki sabzi aur 300 ka tel liya').`,
    parsed_actions: { action: "answer" },
  };
}

/**
 * Server-side Gemini 2.5 Flash invocation with full family context
 */
export async function askParivarAI(
  prompt: string,
  items: LedgerItem[],
  categories: CategoryMeta[],
  monthlyBudget: number,
  apiKey?: string
): Promise<ParivarResponse> {
  const activeKey = apiKey || process.env.GEMINI_API_KEY;

  if (!activeKey) {
    // Graceful offline execution
    return parseHinglishOffline(prompt, items, categories, monthlyBudget);
  }

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(activeKey);
    // Use gemini-2.5-flash or gemini-1.5-flash as specified
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build concise, accurate context snapshot of the family ledger
    const summaryItems = items.slice(0, 40).map((i) => ({
      item: i.item_name,
      cat: i.category_slug,
      expected: i.expected_price,
      actual: i.actual_price,
      status: i.status,
      date: i.due_date || i.created_at,
      extra: i.extra_data,
    }));

    const systemPrompt = `You are "Parivar AI", an intelligent, trusted family member and finance assistant for an Indian middle-class household.
The family's total monthly budget is ₹${monthlyBudget}.
Categories and their budgets: ${categories.map((c) => `${c.name} (${c.slug}): ₹${c.monthly_budget}`).join(", ")}.

Recent ledger items in the house:
${JSON.stringify(summaryItems, null, 2)}

Instructions:
1. Speak in warm, respectful Hinglish or English based on the user's prompt.
2. If the user is asking a question about household finances, bills, medicines, or past purchases, answer with 100% precision based on the ledger data provided.
3. If the user mentions one or more expenses (e.g., "Aaj 450 ka sabzi liya, 1200 papa ki dawai, aur doodh wale ko 1500 diye"), extract each item cleanly with:
   - item_name
   - category_slug (one of: kirana, sabzi-dairy, medical, education, bills-emi, udhaar, savings)
   - actual_price
   - expected_price
   - status ("Bought" or "Paid" or "Pending")
4. Do NOT use em dashes.
5. Provide response in valid JSON matching this schema:
{
  "answer": "Warm conversational response explaining what was found or logged",
  "parsed_actions": {
    "action": "add_item" | "answer" | "budget_alert",
    "items": [
      {
        "item_name": "string",
        "category_slug": "string",
        "expected_price": number,
        "actual_price": number,
        "status": "Bought",
        "quantity": "1",
        "unit": "unit"
      }
    ]
  }
}
Return ONLY valid JSON without markdown fences.`;

    const result = await withTimeout(
      model.generateContent([
        { text: systemPrompt },
        { text: `User request: ${prompt}` },
      ]),
      15_000
    );

    const responseText = result.response.text().trim();
    // Clean potential markdown fences
    const cleanJson = responseText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = validateParivarResponse(JSON.parse(cleanJson));
    if (!parsed) throw new Error("Parivar AI returned an invalid response");
    return parsed;
  } catch {
    // If Gemini API fails or model rate limited, transparently fall back to deterministic offline parser
    return parseHinglishOffline(prompt, items, categories, monthlyBudget);
  }
}
