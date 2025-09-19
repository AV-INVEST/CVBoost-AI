// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Accesso disabilitato. Usa il link magico dalla modale." },
    { status: 401 }
  );
}
