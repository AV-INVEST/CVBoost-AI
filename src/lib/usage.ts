// src/lib/usage.ts
import { cookies as nextCookies } from "next/headers";

export const DAILY_LIMIT = 3;
export const MONTHLY_LIMIT = 50;

export const COOKIE_USED = "search_used";                 // free/pro con uid
export const COOKIE_RESET = "search_reset_at";
export const COOKIE_USED_ANON = "search_used_anon";       // free anon
export const COOKIE_RESET_ANON = "search_reset_anon_at";
export const PRO_USED = "pro_used";                       // pro mensile
export const PRO_RESET = "pro_reset_at";

const TZ = "Europe/Rome";

function cookieBase() {
  const prod = process.env.NODE_ENV === "production";
  return { httpOnly: true, sameSite: "lax" as const, secure: prod, path: "/" };
}
function nowRome(): Date {
  const s = new Date().toLocaleString("en-US", { timeZone: TZ });
  return new Date(s);
}
function nextMidnightRome(): Date {
  const d = nowRome();
  d.setHours(24, 0, 0, 0);
  return d;
}
function firstOfNextMonthRome(): Date {
  const d = nowRome();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function secondsUntil(date: Date) {
  return Math.max(1, Math.floor((date.getTime() - Date.now()) / 1000));
}
function readInt(val: string | undefined, fallback = 0) {
  const n = parseInt(val || "", 10);
  return Number.isFinite(n) ? n : fallback;
}

export type UsageSummary =
  | { plan: "business" | "business_plus"; scope: "unlimited"; limit: null; used: null; remaining: "infinite"; resetAt: null }
  | { plan: "pro"; scope: "monthly"; limit: number; used: number; remaining: number; resetAt: number }
  | { plan: "free"; scope: "daily"; limit: number; used: number; remaining: number; resetAt: number };

export function getSummary(jar = nextCookies(), planParam?: string): UsageSummary {
  const plan = (planParam || jar.get("plan")?.value || "free") as "free" | "pro" | "business" | "business_plus";

  if (plan === "business" || plan === "business_plus") {
    return { plan, scope: "unlimited", limit: null, used: null, remaining: "infinite", resetAt: null };
  }

  if (plan === "pro") {
    const now = Date.now();
    let used = readInt(jar.get(PRO_USED)?.value, 0);
    let resetAt = readInt(jar.get(PRO_RESET)?.value, 0);
    if (!resetAt || now >= resetAt) {
      used = 0;
      const next = firstOfNextMonthRome();
      resetAt = next.getTime();
      jar.set(PRO_USED, String(used), { ...cookieBase(), maxAge: secondsUntil(next) });
      jar.set(PRO_RESET, String(resetAt), { ...cookieBase(), maxAge: secondsUntil(next) });
    }
    const remaining = Math.max(0, MONTHLY_LIMIT - used);
    return { plan: "pro", scope: "monthly", limit: MONTHLY_LIMIT, used, remaining, resetAt };
  }

  // FREE: giornaliero, separa uid vs anon
  const uid = jar.get("uid")?.value || null;
  const usedKey = uid ? COOKIE_USED : COOKIE_USED_ANON;
  const resetKey = uid ? COOKIE_RESET : COOKIE_RESET_ANON;

  const now = Date.now();
  let used = readInt(jar.get(usedKey)?.value, 0);
  let resetAt = readInt(jar.get(resetKey)?.value, 0);
  if (!resetAt || now >= resetAt) {
    used = 0;
    const next = nextMidnightRome();
    resetAt = next.getTime();
    jar.set(usedKey, String(used), { ...cookieBase(), maxAge: secondsUntil(next) });
    jar.set(resetKey, String(resetAt), { ...cookieBase(), maxAge: secondsUntil(next) });
  }
  const remaining = Math.max(0, DAILY_LIMIT - used);
  return { plan: "free", scope: "daily", limit: DAILY_LIMIT, used, remaining, resetAt };
}

export function consumeUsage(jar = nextCookies(), planParam?: string) {
  const plan = (planParam || jar.get("plan")?.value || "free") as "free" | "pro" | "business" | "business_plus";

  if (plan === "business" || plan === "business_plus") {
    return { ok: true, plan, scope: "unlimited" as const, limit: null, used: null, remaining: "infinite" as const };
  }

  if (plan === "pro") {
    const now = Date.now();
    let used = readInt(jar.get(PRO_USED)?.value, 0);
    let resetAt = readInt(jar.get(PRO_RESET)?.value, 0);
    if (!resetAt || now >= resetAt) {
      used = 0;
      const next = firstOfNextMonthRome();
      resetAt = next.getTime();
    }
    if (used >= MONTHLY_LIMIT) {
      return { ok: false as const, plan, error: "Hai esaurito le 50 analisi mensili del piano Pro. Passa a Business per analisi illimitate.", limit: MONTHLY_LIMIT, used, remaining: 0, resetAt };
    }
    used += 1;
    const maxAge = secondsUntil(new Date(resetAt || firstOfNextMonthRome()));
    jar.set(PRO_USED, String(used), { ...cookieBase(), maxAge });
    jar.set(PRO_RESET, String(resetAt || firstOfNextMonthRome().getTime()), { ...cookieBase(), maxAge });
    return { ok: true as const, plan, limit: MONTHLY_LIMIT, used, remaining: Math.max(0, MONTHLY_LIMIT - used), resetAt };
  }

  // FREE
  const uid = jar.get("uid")?.value || null;
  const usedKey = uid ? COOKIE_USED : COOKIE_USED_ANON;
  const resetKey = uid ? COOKIE_RESET : COOKIE_RESET_ANON;

  const now = Date.now();
  let used = readInt(jar.get(usedKey)?.value, 0);
  let resetAt = readInt(jar.get(resetKey)?.value, 0);
  if (!resetAt || now >= resetAt) {
    used = 0;
    const next = nextMidnightRome();
    resetAt = next.getTime();
  }
  if (used >= DAILY_LIMIT) {
    return { ok: false as const, plan: "free", error: "Hai esaurito le 3 analisi gratuite di oggi.", limit: DAILY_LIMIT, used, remaining: 0, resetAt };
  }
  used += 1;
  const maxAge = secondsUntil(new Date(resetAt || nextMidnightRome()));
  jar.set(usedKey, String(used), { ...cookieBase(), maxAge });
  jar.set(resetKey, String(resetAt || nextMidnightRome().getTime()), { ...cookieBase(), maxAge });
  return { ok: true as const, plan: "free", limit: DAILY_LIMIT, used, remaining: Math.max(0, DAILY_LIMIT - used), resetAt };
}
