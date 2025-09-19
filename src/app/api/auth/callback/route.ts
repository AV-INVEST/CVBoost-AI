// src/app/api/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyJWT(token: string) {
  const [h, b, s] = token.split(".");
  if (!h || !b || !s) return null;
  const expect = createHmac("sha256", process.env.AUTH_SECRET || "dev-secret")
    .update(`${h}.${b}`)
    .digest("base64url");
  if (expect !== s) return null;
  try {
    const payload = JSON.parse(Buffer.from(b, "base64url").toString());
    if (!payload?.email || !payload?.exp || Date.now() > payload.exp) return null;
    return payload as { email: string; exp: number };
  } catch {
    return null;
  }
}

function cookieBase() {
  const prod = process.env.NODE_ENV === "production";
  return { httpOnly: true, sameSite: "lax" as const, secure: prod, path: "/" };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const jar = cookies();

  const payload = verifyJWT(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/", url.origin), {
      headers: { "Set-Cookie": "signup_err=1; Max-Age=10; Path=/" },
    });
  }

  const email = payload.email.trim().toLowerCase();

  // ✅ CREA/AGGIORNA l’utente nel DB
  const user = await prisma.user.upsert({
    where: { email },
    update: {},                  // qui potresti aggiornare il plan
    create: { email, plan: "free" },
  });

  // Cookie coerenti col DB
  jar.set("uid", user.email, { ...cookieBase(), maxAge: 60 * 60 * 24 * 180 });
  jar.set("plan", user.plan,  { ...cookieBase(), maxAge: 60 * 60 * 24 * 180 });

  return NextResponse.redirect(new URL("/?signed=1", url.origin));
}
