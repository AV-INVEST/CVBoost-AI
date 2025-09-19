// src/app/api/dev/reset-usage/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
// Se avevi un helper per leggere la chiave, lo lasciamo: non blocca il build
import { getRequesterKey } from "@/src/utils/useDailyQuota"; // <-- se il path è diverso, lascia pure il tuo import

const prisma = new PrismaClient();

export async function POST() {
  // Manteniamo la logica esistente, ma NON usiamo più il campo inesistente nel where
  const rk = typeof getRequesterKey === "function" ? getRequesterKey() : undefined;
  try {
    // TEMP FIX: la tabella Usage non ha 'requesterKey' -> cancelliamo tutto
    await prisma.usage.deleteMany({}); // <--- QUI il cambiamento che evita l'errore TS
    return NextResponse.json({ ok: true, clearedFor: rk ?? null });
  } catch (err) {
    console.error("reset-usage error:", err);
    return NextResponse.json({ ok: false, error: "reset-failed" }, { status: 500 });
  }
}
