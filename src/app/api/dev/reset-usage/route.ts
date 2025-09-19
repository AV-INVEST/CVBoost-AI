import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma"; // ← 4 livelli su

export const runtime = "nodejs";

type JsonBody = { requestKey?: string };

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      const secret = req.headers.get("x-admin-secret");
      if (!secret || secret !== process.env.DEV_ADMIN_SECRET) {
        return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }
    }

    let body: JsonBody | null = null;
    try { body = (await req.json()) as JsonBody; } catch { body = null; }

    const url = new URL(req.url);
    const rkFromQuery = url.searchParams.get("requestKey") || undefined;
    const rkFromHeader = req.headers.get("x-request-key") || undefined;
    const requestKey = body?.requestKey ?? rkFromHeader ?? rkFromQuery;

    const result = requestKey
      ? await prisma.usage.deleteMany({ where: { requestKey } })
      : await prisma.usage.deleteMany({});

    return NextResponse.json({ ok: true, cleared: result.count, byKey: requestKey ?? null });
  } catch (err) {
    console.error("reset-usage error:", err);
    return NextResponse.json({ ok: false, error: "reset-failed" }, { status: 500 });
  }
}
