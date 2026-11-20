import { NextRequest, NextResponse } from "next/server";
import { askParivarAI } from "@/lib/gemini/parivar-engine";
import type { CategoryMeta, LedgerItem } from "@/types";

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 1_000_000) {
    return NextResponse.json({ error: "Request is too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  try {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
    }

    const requestBody = body as Record<string, unknown>;
    const { prompt } = requestBody;
    const items = requestBody.items ?? [];
    const categories = requestBody.categories ?? [];
    const monthlyBudget = requestBody.monthlyBudget ?? 50000;

    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt must be a non-empty string of at most 2,000 characters" },
        { status: 400 }
      );
    }

    const isRecord = (value: unknown): value is Record<string, unknown> =>
      Boolean(value) && typeof value === "object" && !Array.isArray(value);
    const validMoney = (value: unknown) =>
      value === undefined ||
      (typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 9_999_999_999.99);

    if (
      !Array.isArray(items) ||
      items.length > 1000 ||
      !items.every(
        (item) =>
          isRecord(item) &&
          typeof item.item_name === "string" &&
          item.item_name.length <= 255 &&
          typeof item.category_slug === "string" &&
          item.category_slug.length <= 64 &&
          validMoney(item.expected_price) &&
          validMoney(item.actual_price)
      )
    ) {
      return NextResponse.json({ error: "Ledger items are invalid or exceed the request limit" }, { status: 400 });
    }

    if (
      !Array.isArray(categories) ||
      categories.length > 100 ||
      !categories.every(
        (category) =>
          isRecord(category) &&
          typeof category.slug === "string" &&
          category.slug.length <= 64 &&
          typeof category.name === "string" &&
          category.name.length <= 100 &&
          validMoney(category.monthly_budget)
      )
    ) {
      return NextResponse.json({ error: "Categories are invalid or exceed the request limit" }, { status: 400 });
    }

    if (
      typeof monthlyBudget !== "number" ||
      !Number.isFinite(monthlyBudget) ||
      monthlyBudget < 0 ||
      monthlyBudget > 9_999_999_999.99
    ) {
      return NextResponse.json({ error: "Monthly budget must be a valid non-negative amount" }, { status: 400 });
    }

    const response = await askParivarAI(
      prompt,
      items as LedgerItem[],
      categories as CategoryMeta[],
      monthlyBudget,
      process.env.GEMINI_API_KEY
    );

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("AI route failed", error);
    return NextResponse.json({ error: "Unable to process the AI request" }, { status: 500 });
  }
}
