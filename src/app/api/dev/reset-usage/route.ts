// src/app/api/dev/reset-usage/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // FIX: la tabella Usage non ha 'requesterKey' -> pulizia totale
    await prisma.usage.deleteMany({});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("reset-usage error:", err);
    return NextResponse.json({ ok: false, error: "reset-failed" }, { status: 500 });
  }
}
