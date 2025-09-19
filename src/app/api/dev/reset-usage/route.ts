import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

function getRequesterKey(): string | null {
  const jar = cookies();
  const uid = jar.get("uid")?.value;
  const anon = jar.get("anon_id")?.value;
  if (uid) return `user:${uid}`;
  if (anon) return `anon:${anon}`;
  return null;
}

export async function GET() {
  const rk = getRequesterKey();
  if (!rk) return NextResponse.json({ ok: false, error: "no requesterKey" }, { status: 400 });
await prisma.usage.deleteMany({});
  return NextResponse.json({ ok: true, clearedFor: rk });
}
