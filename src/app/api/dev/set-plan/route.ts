// src/app/api/dev/set-plan/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Consenti SOLO in non-production
const ALLOWED = process.env.NODE_ENV !== "production";

type Plan = "free" | "pro" | "business" | "business_plus";

export async function POST(req: Request) {
  try {
    if (!ALLOWED) {
      return NextResponse.json({ ok: false, error: "Disabled in production" }, { status: 403 });
    }

    const { email, plan, secret } = await req.json();
    const clean = String(email || "").trim().toLowerCase();
    const p = String(plan || "").trim() as Plan;

    if (secret !== process.env.DEV_ADMIN_SECRET) {
      return NextResponse.json({ ok: false, error: "Invalid secret" }, { status: 401 });
    }
    if (!clean) {
      return NextResponse.json({ ok: false, error: "Email mancante" }, { status: 400 });
    }
    if (!["free", "pro", "business", "business_plus"].includes(p)) {
      return NextResponse.json({ ok: false, error: "Plan non valido" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { email: clean },
      update: { plan: p },
      create: { email: clean, plan: p },
    });

    return NextResponse.json({ ok: true, email: user.email, plan: user.plan });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "set-plan error" }, { status: 500 });
  }
}
