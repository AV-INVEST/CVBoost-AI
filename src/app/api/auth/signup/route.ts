// src/app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =======================
   Config rate-limit
   - Per IP+Email: max 5 richieste ogni 10 minuti
   - Per IP:       max 20 richieste ogni 10 minuti
   Modifica qui se serve.
======================= */
const WINDOW_MS = 10 * 60 * 1000;   // 10 minuti
const LIMIT_PER_IP_EMAIL = 5;
const LIMIT_PER_IP = 20;

/* In-memory store (ok per una singola istanza / dev).
   In produzione usa Redis/Upstash per un rate-limit distribuito. */
type RLStore = Map<string, number[]>; // key -> timestamps (ms)
const g = globalThis as unknown as { __rateStore?: RLStore };
const store: RLStore = g.__rateStore ?? new Map();
if (!g.__rateStore) g.__rateStore = store;

function hitRate(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const start = now - windowMs;
  const arr = (store.get(key) ?? []).filter((t) => t > start);
  if (arr.length >= limit) {
    // seconds until first entry esce dalla finestra
    const waitMs = windowMs - (now - arr[0]);
    return { limited: true, retryAfter: Math.ceil(waitMs / 1000) };
  }
  arr.push(now);
  store.set(key, arr);
  return { limited: false, retryAfter: 0 };
}

function getClientIp(req: Request) {
  const h = (name: string) => req.headers.get(name) ?? "";
  const xff = h("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h("x-real-ip") || "127.0.0.1";
}

/* =======================
   Helpers auth/token
======================= */
function appUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}
function fromEmail() {
  return process.env.EMAIL_FROM || "noreply@cvboost.ai";
}
function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function signToken(payload: object) {
  const header = { alg: "HS256", typ: "JWT" };
  const secret = process.env.AUTH_SECRET || "dev-secret";
  const head = base64url(JSON.stringify(header));
  const body = base64url(JSON.stringify(payload));
  const sig = createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

/* =======================
   Route handler
======================= */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const clean = String(email || "").trim().toLowerCase();

    if (!clean) {
      return NextResponse.json({ ok: false, error: "Email mancante" }, { status: 400 });
    }
    // semplice check email (light)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return NextResponse.json({ ok: false, error: "Email non valida" }, { status: 400 });
    }

    // Rate-limit
    const ip = getClientIp(req);
    const keyIp = `ip:${ip}`;
    const keyPair = `pair:${ip}:${clean}`;

    const r1 = hitRate(keyPair, LIMIT_PER_IP_EMAIL, WINDOW_MS);
    if (r1.limited) {
      return NextResponse.json(
        { ok: false, error: `Troppi tentativi da questa email/IP. Riprova tra ~${r1.retryAfter}s.` },
        { status: 429, headers: { "Retry-After": String(r1.retryAfter) } }
      );
    }
    const r2 = hitRate(keyIp, LIMIT_PER_IP, WINDOW_MS);
    if (r2.limited) {
      return NextResponse.json(
        { ok: false, error: `Troppi tentativi da questo IP. Riprova tra ~${r2.retryAfter}s.` },
        { status: 429, headers: { "Retry-After": String(r2.retryAfter) } }
      );
    }

    // token valido 30 minuti
    const exp = Date.now() + 30 * 60 * 1000;
    const token = signToken({ email: clean, exp });
    const link = `${appUrl()}/api/auth/callback?token=${encodeURIComponent(token)}`;

    // 1) INVIO con Resend (se configurato)
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: fromEmail(),
          to: clean,
          subject: "Accedi a CVBoost.ai",
          html: `<p>Clicca per accedere in modo sicuro:</p>
                 <p><a href="${link}">${link}</a></p>
                 <p>Il link è monouso e scade tra 30 minuti.</p>`,
        });
        return NextResponse.json({ ok: true, message: "Email inviata." });
      } catch (err) {
        console.error("Errore Resend:", err);
        // continua con fallback dev
      }
    }

    // 2) DEV: Ethereal (invia email di anteprima senza dominio)
    if (process.env.NODE_ENV !== "production") {
      try {
        const nodemailer = await import("nodemailer");
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        const info = await transporter.sendMail({
          from: fromEmail(),
          to: clean,
          subject: "Accedi a CVBoost.ai (Ethereal)",
          html: `<p>Clicca per accedere in modo sicuro:</p>
                 <p><a href="${link}">${link}</a></p>
                 <p>Il link è monouso e scade tra 30 minuti.</p>`,
        });
        const preview = nodemailer.getTestMessageUrl(info);
        console.log("[ETHEREAL preview]", preview);
        return NextResponse.json({
          ok: true,
          message: "Email di prova inviata (Ethereal).",
          preview, // url per vedere l’email
        });
      } catch (err) {
        console.error("Errore Ethereal:", err);
        // continua con console fallback
      }
    }

    // 3) Fallback assoluto: stampa in console (DEV/assenza provider)
    console.log("[DEV magic-link]", { to: clean, from: fromEmail(), link });
    return NextResponse.json({
      ok: true,
      message: "Link generato (console).",
      devLink: link,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "Signup error" }, { status: 500 });
  }
}
