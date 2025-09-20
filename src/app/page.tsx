'use client';

import React, { useEffect, useState } from 'react';

import HeaderAuth from '@/components/HeaderAuth';
import UsageCounter from '@/components/UsageCounter';
import PlanPill from '@/components/PlanPill';
import LandingPitch from '@/components/LandingPitch';
import ValueSection from '@/components/ValueSection';
import RoleSwitch, { type Mode } from '@/components/RoleSwitch';

type AnalyzeResult = {
  score: number;
  missingKeywords: string[];
  suggestions: string[];
  improvedResume: string;
  coverLetter: string;
};

type UiPlan = 'free' | 'pro' | 'business' | 'business_plus';
const BUSINESS_PLUS_SOLD_OUT = true;

// Normalizza qualsiasi valore “strano” del piano
function toUiPlan(plan: unknown): UiPlan {
  return plan === 'pro' || plan === 'business' || plan === 'business_plus' || plan === 'free'
    ? plan
    : 'free';
}

function normalizeText(t: string) {
  return (t || '').replace(/\r\n/g, '\n').trim();
}

function sampleTextCandidate() {
  return `ANDREA VERDI
Full-Stack Developer | Milano
Email: andrea.verdi@mail.com | GitHub: github.com/andreaverdi | LinkedIn: linkedin.com/in/andreaverdi

ESPERIENZA
Senior Full-Stack Dev – FinTech Spa (2021–oggi)
- Next.js 14, Node.js, PostgreSQL (Neon), Prisma, Redis
- Stripe billing, webhooks, ruoli e permessi granulari
- Test end-to-end (Playwright), CI/CD Vercel
- Riduzione tempi build del 35%, costi infra -28%

Full-Stack Dev – Logistica SRL (2018–2021)
- React/Node, ottimizzazione picking, reportistica real-time
- Migrazione monolite → microservizi

COMPETENZE
- Frontend: Next.js/React, TypeScript, Tailwind
- Backend: Node.js, Prisma, PostgreSQL, Redis
- Cloud/DevOps: Vercel, Docker, GitHub Actions
- Pagamenti: Stripe (Checkout, Portal, Webhook)

FORMAZIONE
- Laurea in Informatica – Politecnico di Milano`;
}

function sampleTextJD() {
  return `Senior Full-Stack Developer (FinTech) – Milano (Ibrido)
Responsabilità:
- Next.js 14 (App Router), TypeScript, Tailwind
- Stripe (checkout, portal, webhook)
- PostgreSQL (Neon) + Prisma; caching Redis
- CI/CD con Vercel, test E2E

Requisiti:
- 4+ anni in Next.js/React e Node
- Esperienza reale con Stripe e webhook
- Conoscenza di Prisma e PostgreSQL`;
}

function prettyError(msg: string) {
  if (/50 analisi mensili del piano pro/i.test(msg)) {
    return 'Hai esaurito le 50 analisi mensili del piano Pro. Passa a Business per analisi illimitate.';
  }
  return msg;
}

export default function Page() {
  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
  const [mode, setMode] = useState<Mode>('candidate');

  const [loading, setLoading] = useState(false);
  const [loadingExport, setLoadingExport] = useState<null | 'pdf' | 'docx'>(null);
  const [loadingCheckout, setLoadingCheckout] = useState<null | UiPlan>(null);

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [remaining, setRemaining] = useState<number | 'infinite' | null>(null);
  const [plan, setPlan] = useState<UiPlan | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const theme = mode === 'candidate'
    ? { accent: 'text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700', ring: 'focus:ring-emerald-500' }
    : { accent: 'text-indigo-600',  btn: 'bg-indigo-600 hover:bg-indigo-700',  ring: 'focus:ring-indigo-500' };

  // Prefill demo
  useEffect(() => {
    setResume(sampleTextCandidate());
    setJd(sampleTextJD());
  }, []);

  // Carica piano utente (safe)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/auth/me', { cache: 'no-store' });
        const j = await r.json();
        setPlan(toUiPlan(j?.plan));
      } catch {
        setPlan('free');
      }
    })();
  }, []);

  async function analyze() {
    setError(null);
    setResult(null);
    if (!resume || !jd) { setError('Inserisci sia CV che Job Description.'); return; }
    setLoading(true);
    try {
      const body =
        mode === 'candidate'
          ? { resume, jobDescription: jd, locale: 'it', mode }
          : { resume: jd, jobDescription: resume, locale: 'it', mode };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(prettyError(data?.error || 'Errore analisi'));

      setResult(data as AnalyzeResult);
      setRemaining(data?.remaining ?? null);
      if (data?.plan) setPlan(toUiPlan(data.plan));
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      setError(prettyError(e.message || 'Errore analisi'));
    } finally {
      setLoading(false);
    }
  }

  async function exportFile(kind: 'pdf' | 'docx') {
    if (!result) { setError('Esegui prima una analisi.'); return; }
    setLoadingExport(kind);
    try {
      const res = await fetch(`/api/export/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeImproved: result.improvedResume,
          coverLetter: result.coverLetter,
          score: result.score,
          missingKeywords: result.missingKeywords,
          suggestions: result.suggestions,
          locale: 'it',
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(prettyError(d?.error || 'Export fallito'));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = kind === 'pdf' ? 'CVBoost-report.pdf' : 'CVBoost-report.docx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(prettyError(e.message || 'Errore export'));
    } finally {
      setLoadingExport(null);
    }
  }

  async function checkout(tier: UiPlan) {
    if (BUSINESS_PLUS_SOLD_OUT && tier === 'business_plus') {
      setError('Business+ al momento non disponibile.');
      return;
    }
    setLoadingCheckout(tier);
    try {
      const res = await fetch('/api/checkout/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceTier: tier }),
      });
      const data = await res.json();
      if (!data?.url) throw new Error('Checkout non disponibile');
      window.location.href = data.url as string;
    } catch (e: any) {
      setError(prettyError(e.message || 'Errore checkout'));
    } finally {
      setLoadingCheckout(null);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="font-extrabold text-xl">
              CVBoost<span className={theme.accent}>.ai</span>
            </div>
            <PlanPill plan={plan} />
          </div>
          <HeaderAuth onAuthChange={({ me }) => {
            setPlan(toUiPlan(me?.plan));
            setRemaining(null);
            setRefreshKey((k) => k + 1);
          }} />
        </div>

        <div className="max-w-5xl mx-auto px-4 pb-4">
          <UsageCounter refreshKey={refreshKey} overrideRemaining={remaining} />
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Titolo + switch */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Ottimizza il tuo <span className={theme.accent}>CV</span> contro la <span className={theme.accent}>Job Description</span>
          </h1>
          <RoleSwitch mode={mode} onChange={setMode} />
        </div>

        {/* INPUT */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold opacity-90">
                {mode === 'candidate' ? 'Il tuo CV (incolla testo)' : 'Job Description (incolla testo)'}
              </label>
              <button
                className={`text-xs underline opacity-80 hover:opacity-100 ${theme.accent}`}
                onClick={() => setResume(sampleTextCandidate())}
              >
                Carica esempio CV
              </button>
            </div>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              rows={16}
              className={`w-full rounded-xl bg-neutral-900 border border-white/10 p-3 outline-none focus:ring-2 ${theme.ring}`}
              placeholder="Incolla qui il tuo CV in testo"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold opacity-90">
                {mode === 'candidate' ? 'Job Description (incolla testo)' : 'Il tuo CV (incolla testo)'}
              </label>
              <button
                className={`text-xs underline opacity-80 hover:opacity-100 ${theme.accent}`}
                onClick={() => setJd(sampleTextJD())}
              >
                Carica esempio JD
              </button>
            </div>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={16}
              className={`w-full rounded-xl bg-neutral-900 border border-white/10 p-3 outline-none focus:ring-2 ${theme.ring}`}
              placeholder="Incolla qui la Job Description in testo"
            />
          </div>
        </div>

        {/* AZIONI */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={analyze}
            disabled={loading}
            className={`px-4 py-2 rounded-xl font-bold ${theme.btn} disabled:opacity-60`}
          >
            {loading ? 'Analisi in corso…' : 'Analizza'}
          </button>

          <button
            onClick={() => exportFile('pdf')}
            disabled={!result || !!loadingExport}
            className="px-3 py-2 rounded-xl font-bold bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60"
          >
            {loadingExport === 'pdf' ? 'Esporto PDF…' : 'Esporta PDF'}
          </button>

          <button
            onClick={() => exportFile('docx')}
            disabled={!result || !!loadingExport}
            className="px-3 py-2 rounded-xl font-bold bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60"
          >
            {loadingExport === 'docx' ? 'Esporto DOCX…' : 'Esporta DOCX'}
          </button>
        </div>

        {/* ERRORI */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-900/30 border border-red-500/40 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* RISULTATI */}
        {result && (
          <section className="mt-8 grid gap-6">
            <div className="rounded-2xl border border-white/10 p-4 bg-neutral-900">
              <div className="text-sm opacity-80 font-semibold mb-1">Compatibilità</div>
              <div className="text-4xl font-extrabold">{result.score}/100</div>
            </div>

            <div className="rounded-2xl border border-white/10 p-4 bg-neutral-900">
              <div className="text-sm opacity-80 font-semibold mb-2">Keywords mancanti</div>
              {result.missingKeywords.length ? (
                <ul className="flex flex-wrap gap-2">
                  {result.missingKeywords.map((kw, i) => (
                    <li key={i} className="px-2 py-1 rounded-lg bg-neutral-800 border border-white/10 text-xs">{kw}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm opacity-80">Nessuna keyword critica mancante. Ottimo!</div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 p-4 bg-neutral-900">
              <div className="text-sm opacity-80 font-semibold mb-2">Suggerimenti</div>
              <ul className="list-disc ml-5 text-sm space-y-1">
                {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 p-4 bg-neutral-900">
              <div className="text-sm opacity-80 font-semibold mb-2">CV riscritto (mirato alla JD)</div>
              <pre className="whitespace-pre-wrap text-sm">{result.improvedResume}</pre>
            </div>

            <div className="rounded-2xl border border-white/10 p-4 bg-neutral-900">
              <div className="text-sm opacity-80 font-semibold mb-2">Cover letter generata</div>
              <pre className="whitespace-pre-wrap text-sm">{result.coverLetter}</pre>
            </div>
          </section>
        )}

        {/* CTA Piani */}
        <LandingPitch
          plan={plan}
          onUpgrade={(tier) => {
            if (tier === 'pro') return checkout('pro');
            if (tier === 'business') return checkout('business');
          }}
        />

        <ValueSection
          plan={plan}
          disabledPlus={BUSINESS_PLUS_SOLD_OUT}
          loading={loadingCheckout}
          onBuy={(tier) => checkout(tier as UiPlan)}
          onUpgrade={(tier) => {
            if (tier === 'pro') return checkout('pro');
            if (tier === 'business') return checkout('business');
          }}
        />
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 mt-12 py-6 text-center text-xs opacity-70">
        © {new Date().getFullYear()} CVBoost.ai — Tutti i diritti riservati
      </footer>
    </div>
  );
}
