// src/app/api/account/delete/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accetta sia POST che DELETE (comodo da button/fetch)
export async function POST() { return handle(); }
export async function DELETE() { return handle(); }

async function handle() {
  try {
    const jar = cookies();
    const uid = jar.get("uid")?.value || null; // email usata come uid

    if (!uid) {
      return NextResponse.json(
        { ok: false, error: "Non sei autenticato." },
        { status: 401 }
      );
    }

    // 1) Cancella i dati collegati all'utente (hard delete)
    //    Aggiungi qui eventuali altre tabelle collegate.
    await prisma.$transaction([
      prisma.usage.deleteMany({ where: { uid } }),
      prisma.user.deleteMany({ where: { email: uid } }),
    ]);

    // 2) (Opzionale) Se in futuro salvi token magic-link/sessions in tabella, eliminali qui.

    // 3) Pulisci *tutti* i cookie legati all’auth/piano/usage
    ["uid", "sid", "plan"].forEach((name) => {
      // safe delete su root path
      jar.set(name, "", { path: "/", httpOnly: true, secure: true, sameSite: "lax", maxAge: 0 });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Errore eliminazione account" },
      { status: 500 }
    );
  }
}
