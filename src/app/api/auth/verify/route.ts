export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/** Helpers **/
function parseList(s?: string): Set<string> {
  return new Set(
    (s || "")
      .split(/[,\s;]+/)
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean)
  );
}

const PRO_SET = parseList(process.env.PRO_TEST_EMAILS);
const BUSINESS_SET = parseList(process.env.BUSINESS_TEST_EMAILS);

type Plan = "free" | "pro" | "business";

function decidePlan(email: string): Plan {
  if (BUSINESS_SET.has(email)) return "business";
  if (PRO_SET.has(email)) return "pro";
  return "free";
}

function setAuthCookies(email: string, plan: Plan) {
  const jar = cookies();
  const common = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 180 giorni
  };
  jar.set("uid", email, common);
  jar.set("plan", plan, common);
}

/** GET /api/auth/verify?email=... **/
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = (url.searchParams.get("email") || "").trim().toLowerCase();

  // Se non passi email, restituisco lo stato attuale dai cookie
  if (!raw) {
    const jar = cookies();
    const uid = jar.get("uid")?.value || "";
    const plan = (jar.get("plan")?.value as Plan) || "free";
    return NextResponse.json({ ok: true, email: uid, plan, via: "GET" });
  }

  const plan = decidePlan(raw);
  setAuthCookies(raw, plan);
  return NextResponse.json({ ok: true, email: raw, plan, via: "GET" });
}

/** POST /api/auth/verify  { email } **/
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const raw = (body?.email || "").trim().toLowerCase();
  if (!raw) {
    return NextResponse.json(
      { ok: false, error: "Email mancante" },
      { status: 400 }
    );
  }

  const plan = decidePlan(raw);
  setAuthCookies(raw, plan);
  return NextResponse.json({ ok: true, email: raw, plan, via: "POST" });
}
