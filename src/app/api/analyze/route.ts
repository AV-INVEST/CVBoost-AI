// src/app/api/analyze/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { analyzeATS } from "@/lib/analyze";
import { consumeUsage, getSummary } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const jar = cookies();
  const plan = (jar.get("plan")?.value || "free") as
    | "free"
    | "pro"
    | "business"
    | "business_plus";

  // 1) Consuma 1 credito in base al piano
  const consume = consumeUsage(jar, plan);
  if (!consume.ok) {
    return NextResponse.json(
      { error: consume.error, plan, remaining: consume.remaining },
      { status: 429 }
    );
  }

  // 2) Leggi input e lancia l’analisi
  const body = await req.json().catch(() => ({}));
  const { resume = "", jobDescription = "", locale = "it", mode } = body || {};
  const payload = await analyzeATS({ resume, jobDescription, locale, mode });

  // 3) Riepilogo aggiornato per il contatore
  const summary = getSummary(jar, plan);

  return NextResponse.json({
    ...payload,
    plan: summary.plan,
    remaining: summary.scope === "unlimited" ? "infinite" : summary.remaining,
  });
}
