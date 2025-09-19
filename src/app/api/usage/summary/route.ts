// src/app/api/usage/summary/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Plan = "free" | "pro" | "business" | "business_plus";
type Scope = "daily" | "monthly" | "unlimited";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}
function startOfTomorrow() {
  const t0 = startOfToday();
  return new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + 1, 0, 0, 0, 0);
}
function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}
function startOfNextMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
}

export async function GET() {
  try {
    const jar = cookies();
    const uid = jar.get("uid")?.value || null;

    // Piano dal DB (fallback: free)
    let plan: Plan = "free";
    if (uid) {
      const u = await prisma.user.findUnique({ where: { email: uid } });
      if (u?.plan) plan = u.plan as Plan;
    }

    // Mappatura limiti/scope
    const scope: Scope =
      plan === "business" || plan === "business_plus"
        ? "unlimited"
        : plan === "pro"
        ? "monthly"
        : "daily";

    const limit =
      scope === "unlimited" ? null : scope === "monthly" ? 50 : 3;

    // Conteggio usi nel periodo
    let used: number | null = null;
    if (uid && scope !== "unlimited") {
      const range =
        scope === "daily"
          ? { gte: startOfToday(), lt: startOfTomorrow() }
          : { gte: startOfMonth(), lt: startOfNextMonth() };

      used = await prisma.usage.count({
        where: { uid, createdAt: range },
      });
    }

    // Restanti + reset
    let remaining: number | "infinite";
    let resetAt: number | null;

    if (scope === "unlimited") {
      remaining = "infinite";
      resetAt = null;
      used = null; // non serve su illimitato
    } else {
      const u = typeof used === "number" ? used : 0;
      const cap = limit as number;
      remaining = Math.max(0, cap - u);
      resetAt =
        scope === "daily"
          ? startOfTomorrow().getTime()
          : startOfNextMonth().getTime();
    }

    // Risposta nel formato atteso da <UsageCounter />
    return NextResponse.json({
      plan,
      scope,          // "daily" | "monthly" | "unlimited"
      limit,          // number | null
      used,           // number | null
      remaining,      // number | "infinite"
      resetAt,        // epoch ms | null
    });
  } catch (e: any) {
    // Fallback safe (free daily) se qualcosa va storto
    const tmr = startOfTomorrow().getTime();
    return NextResponse.json({
      plan: "free",
      scope: "daily",
      limit: 3,
      used: 0,
      remaining: 3,
      resetAt: tmr,
      error: e?.message || "summary error",
    }, { status: 200 });
  }
}
