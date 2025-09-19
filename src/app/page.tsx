"use client";

import React, { useEffect, useState } from "react";
import HeaderAuth from "@/components/HeaderAuth";
import UsageCounter from "@/components/UsageCounter";
import PlanPill from "@/components/PlanPill";
import LandingPitch from "@/components/LandingPitch";
import ValueSection from "@/components/ValueSection";

// Unione dei piani ammessi nell'app
type Plan = "free" | "pro" | "business" | "business_plus";

// Tipo risultato analisi (adatta se nel tuo backend i campi sono diversi)
type AnalyzeResult = {
  score: number;
  missingKeywords: string[];
  suggestions: string[];
  improvedResume: string;
  coverLetter: string;
  remaining?: number | "infinite" | null;
  plan?: Plan;
};

function humanizeError(msg: string) {
  if (/50 analisi mensili del piano pro/i.test(msg)) {
    return "Hai esaurito le 50 analisi mensili del piano Pro. Passa a Business per analisi illimitate.";
  }
  return msg || "Si è verificato un errore.";
}

export default function Page() {
  // --- STATE ---
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingExport, setLoadingExport] = useState<null | "pdf" | "docx">(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [remaining, setRemaining] = useState<number | "infinite" | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // --- BOOT: carica piano utente ---
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        // j.plan arriva "sconosciuto": lo restringiamo alla nostra union Plan
        const p = (j?.plan ?? "free") as Plan;
        setPlan(p);
      } catch {
        setPlan("free");
      }
    })();
  }, []);

  // --- ANALYZE ---
  async function analyze() {
    try {
      setError(null);
      if (!resume || !jd) {
        setError("Inserisci sia il testo del CV che la Job Description.");
        return;
      }
      setLoading(true);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume,
          jobDescription: jd,
          locale: "it",
        }),
      });

      const data = (await res.json().catch(() => ({}))) as AnalyzeResult & {
        error?: string;
        plan?: unknown;
        remaining?: unknown;
      };

      if (!res.ok) throw new Error(humanizeError(data?.error || ""));

      setResult({
        score: Number(data.score ?? 0),
        missingKeywords: data.missingKeywords ?? [],
        suggestions: data.suggestions ?? [],
        improvedResume: data.improvedResume ?? "",
        coverLetter: data.coverLetter ?? "",
      });

      // restringi i tipi provenienti dal backend
      if (data?.plan) setPlan((data.plan as Plan) ?? plan ?? "free");
      if (data?.remaining !== undefined) {
        const r =
          (data.remaining as number | "infinite" | null) ?? null;
        setRemaining(r);
      }

      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      setError(humanizeError(e?.message));
      setRefreshKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  // --- EXPORT ---
  async function exportFile(kind: "pdf" | "docx") {
    if (!result) {
      setError("Esegui prima un’analisi.");
      return;
    }
    setLoadingExport(kind);
    try {
      const res = await fetch(`/api/export/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeImproved: result.improvedResume,
          coverLetter: result.coverLetter,
          score: result.score,
          missingKeywords: result.missingKeywords,
          suggestions: result.suggestions,
          locale: "it",
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(humanizeError(d?.error || ""));
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = kind === "pdf" ? "CVBoost-report.pdf" : "CVBoost-report.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(humanizeError(e?.message));
    } finally {
      setLoadingExport(null);
    }
  }

  // --- CHECKOUT (se usi i pulsanti upgrade nelle sezioni marketing) ---
  async function checkout(tier: Plan) {
    try {
      const res = await fetch("/api/checkout/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          successUrl:
            typeof window !== "undefined"
              ? window.location.origin + "/?checkout=success"
              : undefined,
          cancelUrl: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data?.url) throw new Error("Checkout non disponibile.");
      window.location.href = data.url as string;
    } catch (e: any) {
      setError(humanizeError(e?.message));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* HEADER */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-extrabold text-xl">CVBoost<span className="text-emerald-600">.ai</span></div>
            <PlanPill plan={plan} />
          </div>

          {/* QUI il cast per evitare l’errore del deploy */}
          <HeaderAuth
            onAuthChange={(payload: { me?: { plan?: unknown } }) => {
              const p = (payload?.me?.plan ?? "free") as Plan;
              setPlan(p);
              setRemaining(null);
              setRefreshKey((k) => k + 1);
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-4 pb-4">
          <UsageCounter refreshKey={refreshKey} overrideRemaining={remaining} />
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Ottimizza il tuo <span className="text-emerald-600">CV</span> per gli ATS in 60 secondi
        </h1>
        <p className="text-gray-600 mb-6">
          Incolla a sinistra il tuo CV in testo e a destra la Job Description. Otterrai punteggio,
          keyword mancanti, CV riscritto e cover letter.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-4 border">
            <label className="block text-sm font-semibold mb-2">CV (testo)</label>
            <textarea
              className="w-full h-56 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Incolla qui il tuo CV in testo…"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />
            <div className="text-xs text-gray-500 mt-2">
              Suggerimento: includi numeri (%) / € / tempi per aumentare il punteggio.
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 border">
            <label className="block text-sm font-semibold mb-2">Job Description</label>
            <textarea
              className="w-full h-56 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Incolla qui la descrizione del ruolo…"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
            <div className="text-xs text-gray-500 mt-2">
              Verrà confrontata con il CV per identificare gap e suggerimenti.
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={analyze}
            disabled={loading}
            className="px-5 py-3 rounded-lg text-white font-semibold shadow bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Analisi in corso…" : "Analizza"}
          </button>

          {plan !== "business" && plan !== "business_plus" && (
            <span className="text-sm text-gray-500">
              Gratis 3 Analisi • Pro: 50/mese • Business: illimitate
            </span>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {result && (
          <section className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow p-4 border">
              <div className="text-sm text-gray-500">Punteggio Match</div>
              <div className="text-4xl font-extrabold text-emerald-600">{result.score}</div>
              <div className="text-xs text-gray-500 mt-1">su 100</div>

              <div className="mt-4">
                <div className="text-sm font-semibold mb-1">Keyword mancanti</div>
                <ul className="list-disc pl-5 text-sm text-gray-700">
                  {result.missingKeywords?.length
                    ? result.missingKeywords.map((k, i) => <li key={i}>{k}</li>)
                    : <li>Nessuna keyword critica mancante 🎯</li>}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-4 border md:col-span-2">
              <div className="text-sm font-semibold mb-2">Suggerimenti</div>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {result.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => exportFile("pdf")}
                  disabled={loadingExport === "pdf"}
                  className="px-4 py-2 rounded-lg border shadow-sm hover:shadow disabled:opacity-60"
                >
                  {loadingExport === "pdf" ? "Esporto PDF…" : "Esporta PDF"}
                </button>
                <button
                  onClick={() => exportFile("docx")}
                  disabled={loadingExport === "docx"}
                  className="px-4 py-2 rounded-lg border shadow-sm hover:shadow disabled:opacity-60"
                >
                  {loadingExport === "docx" ? "Esporto DOCX…" : "Esporta DOCX"}
                </button>
              </div>

              <div className="mt-4">
                <div className="text-sm font-semibold mb-1">Sezione CV riscritta</div>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-lg border">
{result.improvedResume}
                </pre>
              </div>

              <div className="mt-4">
                <div className="text-sm font-semibold mb-1">Cover letter generata</div>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-lg border">
{result.coverLetter}
                </pre>
              </div>
            </div>
          </section>
        )}

        {/* Sezioni marketing/upgrade (se le usi) */}
        <LandingPitch
          plan={plan}
          onUpgrade={(tier) => {
            if (tier === "pro") return checkout("pro");
            if (tier === "business") return checkout("business");
          }}
        />
        <ValueSection
          plan={plan}
          onUpgrade={(tier) => {
            if (tier === "pro") return checkout("pro");
            if (tier === "business") return checkout("business");
          }}
        />
      </main>
    </div>
  );
}
