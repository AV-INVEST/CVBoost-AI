// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const jar = cookies();
  const uid = jar.get("uid")?.value || null;
  let plan = jar.get("plan")?.value || "free";
  if (uid) {
    const u = await prisma.user.findUnique({ where: { email: uid } });
    if (u) plan = u.plan;
  }
  return NextResponse.json({ uid, plan });
}
