// src/app/api/account/export/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const uid = cookies().get("uid")?.value;
    if (!uid) {
      return NextResponse.json({ ok: false, error: "Non sei autenticato." }, { status: 401 });
    }

    // Legge l'utente senza select "fragili"
    const user = await prisma.user.findUnique({ where: { email: uid } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "Utente non trovato." }, { status: 404 });
    }

    // Storico uso (id/day sono i campi sicuri che abbiamo)
    const usage = await prisma.usage.findMany({
      where: { uid },
      orderBy: { id: "desc" }, // se preferisci, puoi rimuovere l'orderBy
    });

    // Documento GDPR-friendly
    const doc = {
      meta: {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        service: "CVBoost.ai",
      },
      account: {
        userId: uid,            // usiamo la mail come identificatore
        email: user.email,
        plan: (user as any).plan ?? null,
      },
      billing: null,            // aggiungeremo dettagli quando colleghi Stripe live
      content: {
        analyses: usage.map((u: any) => ({
          id: u.id,
          day: u.day ?? null,   // nel tuo schema "day" è presente
        })),
      },
      stats: {
        totalAnalyses: usage.length,
      },
      settings: {},             // da popolare se/quando salvi consensi
    };

    const body = JSON.stringify(doc, null, 2);
    const ts = new Date().toISOString().slice(0, 10);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="cvboost_export_${ts}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Errore export" },
      { status: 500 }
    );
  }
}
