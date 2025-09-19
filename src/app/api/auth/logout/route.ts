// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cookieBase() {
  const prod = process.env.NODE_ENV === "production";
  return { httpOnly: true, sameSite: "lax" as const, secure: prod, path: "/" };
}

export async function POST() {
  const jar = cookies();
  for (const k of ["uid", "plan"]) jar.set(k, "", { ...cookieBase(), maxAge: 0 });
  return NextResponse.json({ ok: true });
}
