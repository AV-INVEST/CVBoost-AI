// app/api/usage/search/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAILY_LIMIT = 3;
const COOKIE_USED = "search_used";           // per utenti con uid
const COOKIE_RESET = "search_reset_at";      // per utenti con uid
const COOKIE_USED_ANON = "search_used_anon"; // per anon_id
const COOKIE_RESET_ANON = "search_reset_anon_at";
const TZ = "Europe/Rome";

function nowRome(): Date {
  const s = new Date().toLocaleString("en-US", { timeZone: TZ });
  return new Date(s);
}
function nextMidnightRome(): Date {
  const d = nowRome();
  d.setHours(24, 0, 0, 0);
  return d;
}
function secondsUntil(date: Date) {
  return Math.max(1, Math.floor((date.getTime() - Date.now()) / 1000));
}

function cookieBase() {
  const prod = process.env.NODE_ENV === "production";
  return { httpOnly: true, sameSite: "lax" as const, secure: prod, path: "/" };
}

function readIntCookie(jar: ReturnType<typeof cookies>, key: string) {
  return parseInt(jar.get(key)?.value || "0", 10) || 0;
}

// Scegliamo se usare cookie uid o anon in base alla presenza di 'uid' cookie.
// Nota: questa è una soluzione semplice senza DB.
export async function GET() {
  const jar = cookies();
  const uid = jar.get("uid")?.value || null;
  const anonId = jar.get("anon_id")?.value || null;

  const now = Date.now();
  if (uid) {
    // user-based
    let used = readIntCookie(jar, COOKIE_USED);
    let resetAt = parseInt(jar.get(COOKIE_RESET)?.value || "0", 10) || 0;
    if (!resetAt || now >= resetAt) {
      const next = nextMidnightRome();
      used = 0;
      resetAt = next.getTime();
      jar.set(COOKIE_USED, String(used), { ...cookieBase(), maxAge: secondsUntil(next) });
      jar.set(COOKIE_RESET, String(resetAt), { ...cookieBase(), maxAge: secondsUntil(next) });
    }
    return NextResponse.json({ used, limit: DAILY_LIMIT, resetAt });
  } else {
    // anon/device-based
    let used = readIntCookie(jar, COOKIE_USED_ANON);
    let resetAt = parseInt(jar.get(COOKIE_RESET_ANON)?.value || "0", 10) || 0;
    if (!resetAt || now >= resetAt) {
      const next = nextMidnightRome();
      used = 0;
      resetAt = next.getTime();
      jar.set(COOKIE_USED_ANON, String(used), { ...cookieBase(), maxAge: secondsUntil(next) });
      jar.set(COOKIE_RESET_ANON, String(resetAt), { ...cookieBase(), maxAge: secondsUntil(next) });
    }
    return NextResponse.json({ used, limit: DAILY_LIMIT, resetAt });
  }
}

export async function POST() {
  const jar = cookies();
  const uid = jar.get("uid")?.value || null;
  const now = Date.now();

  if (uid) {
    // user-based consume
    let used = readIntCookie(jar, COOKIE_USED);
    const reset = parseInt(jar.get(COOKIE_RESET)?.value || "0", 10) || 0;
    if (!reset || now >= reset) used = 0;
    if (used >= DAILY_LIMIT) {
      return NextResponse.json({ error: "Daily limit reached", used, limit: DAILY_LIMIT }, { status: 429 });
    }
    used += 1;
    const nextTs = reset && now < reset ? reset : nextMidnightRome().getTime();
    const maxAge = secondsUntil(new Date(nextTs));
    jar.set(COOKIE_USED, String(used), { ...cookieBase(), maxAge });
    jar.set(COOKIE_RESET, String(nextTs), { ...cookieBase(), maxAge });
    return NextResponse.json({ ok: true, used, limit: DAILY_LIMIT, resetAt: nextTs });
  } else {
    // anon/device-based consume
    let used = readIntCookie(jar, COOKIE_USED_ANON);
    const reset = parseInt(jar.get(COOKIE_RESET_ANON)?.value || "0", 10) || 0;
    if (!reset || now >= reset) used = 0;
    if (used >= DAILY_LIMIT) {
      return NextResponse.json({ error: "Daily limit reached", used, limit: DAILY_LIMIT }, { status: 429 });
    }
    used += 1;
    const nextTs = reset && now < reset ? reset : nextMidnightRome().getTime();
    const maxAge = secondsUntil(new Date(nextTs));
    jar.set(COOKIE_USED_ANON, String(used), { ...cookieBase(), maxAge });
    jar.set(COOKIE_RESET_ANON, String(nextTs), { ...cookieBase(), maxAge });
    return NextResponse.json({ ok: true, used, limit: DAILY_LIMIT, resetAt: nextTs });
  }
}
