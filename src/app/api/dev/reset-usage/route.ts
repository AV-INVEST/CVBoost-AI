// src/app/api/dev/reset-usage/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Prisma richiede runtime Node.js (non Edge)
export const runtime = "nodejs";

// ---- Prisma singleton tipato (evita troppe connessioni in dev) ----
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

type JsonBody = { requestKey?: string };

export async function POST(req: Request) {
  try {
    // --- sicurezza (richiesta solo in produzione) ---
    if (process.env.NODE_ENV === "production") {
      const secret = req.headers.get("x-admin-secret");
      if (!secret || secret !== process.env.DEV_ADMIN_SECRET) {
        return NextResponse.json(
          { ok: false, error: "unauthorized" },
          { status: 401 }
        );
        }
    }

    // --- prendo requestKey da body / header / query ---
    let body: JsonBody | null = null;
    try {
      body = (await req.json()) as JsonBody;
    } catch {
      body = null; // nessun body o non-JSON
    }

    const url = new URL(req.url);
    const rkFromQuery = url.searchParams.get("requestKey") || undefined;
    const rkFromHeader = req.headers.get("x-request-key") || undefined;
    const requestKey = body?.requestKey ?? rkFromHeader ?? rkFromQuery;

    // --- cancellazione ---
    const result = requestKey
      ? await prisma.usage.deleteMany({ where: { requestKey } })
      : await prisma.usage.deleteMany({});

    return NextResponse.json({
      ok: true,
      cleared: result.count,
      byKey: requestKey ?? null,
    });
  } catch (err) {
    console.error("reset-usage error:", err);
    return NextResponse.json(
      { ok: false, error: "reset-failed" },
      { status: 500 }
    );
  }
}
