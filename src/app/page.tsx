'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import HeaderAuth from '@/components/HeaderAuth';
import UsageCounter from '@/components/UsageCounter';
import PlanPill from '@/components/PlanPill';
import LandingPitch from '@/components/LandingPitch';
import ValueSection from '@/components/ValueSection';

// 👇 nuovi componenti estetici
import RoleSwitch, { type Mode } from '@/components/RoleSwitch';
import MouseGlow from '@/components/MouseGlow';

type AnalyzeResult = {
  score: number;
  missingKeywords: string[];
  suggestions: string[];
  improvedResume: string;
  coverLetter: string;
};

// --- TIPI & NORMALIZZAZIONE PIANO --------------------
type UiPlan = 'free' | 'pro' | 'business' | 'business_plus';

function toUiPlan(plan: unknown): UiPlan {
  return plan === 'pro' || plan === 'business' || plan === 'business_plus' || plan === 'free'
    ? plan
    : 'free';
}
// -----------------------------------------------------

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
- Frontend: Next.js/React, TypeScript, Tailwind, Framer Motion
- Backend: Node.js, Prisma, PostgreSQL, Redis
- Cloud/DevOps: Vercel, Docker, GitHub Actions
- Pagamenti: Stripe (Checkout, Portal, Webhook)
- Analytics/Monitoraggio: PostHog, Sentry

FORMAZIONE
- Laurea in Informatica – Politecnico di Milano
`;
}

function sampleTextJD() {
  return `Senior Full-Stack Developer (FinTech) – Milano (Ibrido)
Responsabilità:
- Sviluppo prodotto con Next.js 14 (App Router), TypeScript, Tailwind
- Integrazione Stripe (checkout, portal, webhook)
- DB: PostgreSQL (Neon) + Prisma; caching Redis
- CI/CD con Vercel, test E2E

Requisiti:
- 4+ anni in Next.js/React e Node
- Esperienza reale con Stripe e webhook
- Conoscenza di Prisma e PostgreSQL
- Performance, sicurezza, best practice
`;
}

const BUSINESS_PLUS_SOLD_OUT = true;

function prettyError(msg: string) {
  if (/50 analisi mensili del piano pro/i.test(msg)) {
    return 'Hai esaurito le 50 analisi mensili del piano Pro. Passa a Business per analisi illimitate.';
  }
  return msg;
}

export default function Page() {
  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingExport, setLoadingExport] = useState<null | 'pdf' | 'docx'>(null);
  const [loadingCheckout, setLoadingCheckout] =
    useState<null | UiPlan>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [remaining, setRemaining] = useState<number | 'infinite' | null>(null);
  const [plan, setPlan] = useState<UiPlan | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Nuovo: modalità d’uso (verde/viola)
  const [mode, setMode] = useState<Mode>('candidate');

  // Tema cromatico per candidate/recruiter
  const theme = mode === 'candidate'
    ? { accent: 'text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700', ring: 'focus:ring-emerald-500' }
    : { accent: 'text-indigo-600',  btn: 'bg-indigo-600 hover:bg-indigo-700',  ring: 'focus:ring-indigo-500' };

  useEffect(() => {
    // prefill demo
    setResume(sampleTextCandidate());
    setJd(sampleTextJD());
  }, []);

  async function exportDoc(kind: 'pdf' | 'docx') {
    try {
      setLoadingExport(kind);
      setError(null);

      const res = await fetch(`/api/export/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: normalizeText(resume),
          jobDescription: normalizeText(jd),
          result,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Errore export ${kind.toUpperCase()}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cvboost-${kind}.${kind}`;
      a.click();
    } catch (e: any) {
      setError(prettyError(e.message || 'Errore export'));
    } finally {
      setLoadingExport(null);
    }
  }

  async function analyze() {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Mapping in base alla modalità:
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
      setRemaining((data?.remaining ?? null) as any); // server restituisce numero o 'infinite'
    } catch (e: any) {
      setError(prettyError(e.message || 'Errore analisi'));
    } finally {
      setLoading(false);
    }
  }

  async function buyPlan(tier: UiPlan) {
    try {
      setLoadingCheckout(tier);
      setError(null);
      const r = await fetch('/api/checkout/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceTier: tier }),
      });
      const j = await r.json();
      if (!r.ok || !j?.url) throw new Error(j?.error || 'Errore checkout');
      window.location.href = j.url as string;
    } catch (e: any) {
      setError(e.message || 'Errore checkout');
      setLoadingCheckout(null);
    }
  }

  return (
    <MouseGlow mode={mode}>
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
              // 🔒 Normalizza qualsiasi valore non riconosciuto a 'free'
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
          {/* Titolo + switch a pillola */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Ottimizza il tuo <span className={theme.accent}>CV</span> contro la <span className={theme.accent}>Job Description</span>
            </h1>

            <RoleSwitch mode={mode} onChange={setMode} />
          </div>

          <LandingPitch themeAccent={theme.accent} />

          {/* Input area */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {/* Colonna 1 */}
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

            {/* Colonna 2 */}
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

          {/* Azioni */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={analyze}
              disabled={loading}
              className={`px-4 py-2 rounded-xl font-bold ${theme.btn} disabled:opacity-60`}
            >
              {loading ? 'Analisi in corso…' : 'Analizza'}
            </button>

            <button
              onClick={() => exportDoc('pdf')}
              disabled={!result || !!loadingExport}
              className="px-3 py-2 rounded-xl font-bold bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60"
            >
              {loadingExport === 'pdf' ? 'Esporto PDF…' : 'Esporta PDF'}
            </button>

            <button
              onClick={() => exportDoc('docx')}
              disabled={!result || !!loadingExport}
              className="px-3 py-2 rounded-xl font-bold bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60"
            >
              {loadingExport === 'docx' ? 'Esporto DOCX…' : 'Esporta DOCX'}
            </button>
          </div>

          {/* Errori */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-900/30 border border-red-500/40 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Risultato */}
          {result && (
            <section className="mt-8 grid gap-6">
              {/* SCORE */}
              <div className="rounded-2xl border border-white/10 p-4 bg-neutral-900">
                <div className="text-sm opacity-80 font-semibold mb-1">Compatibilità</div>
                <div className="text-4xl font-extrabold">{result.score}/100</div>
              </div>

              {/* KEYWORDS */}
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

              {/* SUGGERIMENTI */}
              <div className="rounded-2xl border border-white/10 p-4 bg-neutral-900">
                <div className="text-sm opacity-80 font-semibold mb-2">Suggerimenti</div>
                <ul className="list-disc ml-5 text-sm space-y-1">
                  {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              {/* CV RISCRITTO */}
              <div className="rounded-2xl border border-white/10 p-4 bg-neutral-900">
                <div className="text-sm opacity-80 font-semibold mb-2">CV riscritto (mirato alla JD)</div>
                <pre className="whitespace-pre-wrap text-sm">{result.improvedResume}</pre>
              </div>

              {/* COVER LETTER */}
              <div className="rounded-2xl border border-white/10 p-4 bg-neutral-900">
                <div className="text-sm opacity-80 font-semibold mb-2">Cover letter generata</div>
                <pre className="whitespace-pre-wrap text-sm">{result.coverLetter}</pre>
              </div>
            </section>
          )}

          {/* Piani / CTA */}
          <ValueSection
            disabledPlus={BUSINESS_PLUS_SOLD_OUT}
            loading={loadingCheckout}
            onBuy={buyPlan}
          />
        </main>

        {/* FOOTER */}
        <footer className="border-t border-white/10 mt-12 py-6 text-center text-xs opacity-70">
          © {new Date().getFullYear()} CVBoost.ai — Tutti i diritti riservati
        </footer>
      </div>
    </MouseGlow>
  );
}
'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import HeaderAuth from '@/components/HeaderAuth';
import UsageCounter from '@/components/UsageCounter';
import PlanPill from '@/components/PlanPill';
import LandingPitch from '@/components/LandingPitch';
import ValueSection from '@/components/ValueSection';

// 👇 nuovi componenti estetici
import RoleSwitch, { type Mode } from '@/components/RoleSwitch';
import MouseGlow from '@/components/MouseGlow';

type AnalyzeResult = {
  score: number;
  missingKeywords: string[];
  suggestions: string[];
  improvedResume: string;
  coverLetter: string;
};

// --- TIPI & NORMALIZZAZIONE PIANO --------------------
type UiPlan = 'free' | 'pro' | 'business' | 'business_plus';

function toUiPlan(plan: unknown): UiPlan {
  return plan === 'pro' || plan === 'business' || plan === 'business_plus' || plan === 'free'
    ? plan
    : 'free';
}
// -----------------------------------------------------

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
- Frontend: Next.js/React, TypeScript, Tailwind, Framer Motion
- Backend: Node.js, Prisma, PostgreSQL, Redis
- Cloud/DevOps: Vercel, Docker, GitHub Actions
- Pagamenti: Stripe (Checkout, Portal, Webhook)
- Analytics/Monitoraggio: PostHog, Sentry

FORMAZIONE
- Laurea in Informatica – Politecnico di Milano
`;
}

function sampleTextJD() {
  return `Senior Full-Stack Developer (FinTech) – Milano (Ibrido)
Responsabilità:
- Sviluppo prodotto con Next.js 14 (App Router), TypeScript, Tailwind
- Integrazione Stripe (checkout, portal, webhook)
- DB: PostgreSQL (Neon) + Prisma; caching Redis
- CI/CD con Vercel, test E2E

Requisiti:
- 4+ anni in Next.js/React e Node
- Esperienza reale con Stripe e webhook
- Conoscenza di Prisma e PostgreSQL
- Performance, sicurezza, best practice
`;
}

const BUSINESS_PLUS_SOLD_OUT = true;

function prettyError(msg: string) {
  if (/50 analisi mensili del piano pro/i.test(msg)) {
    return 'Hai esaurito le 50 analisi mensili del piano Pro. Passa a Business per analisi illimitate.';
  }
  return msg;
}

export default function Page() {
  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingExport, setLoadingExport] = useState<null | 'pdf' | 'docx'>(null);
  const [loadingCheckout, setLoadingCheckout] =
    useState<null | UiPlan>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [remaining, setRemaining] = useState<number | 'infinite' | null>(null);
  const [plan, setPlan] = useState<UiPlan | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Nuovo: modalità d’uso (verde/viola)
  const [mode, setMode] = useState<Mode>('candidate');

  // Tema cromatico per candidate/recruiter
  const theme = mode === 'candidate'
    ? { accent: 'text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700', ring: 'focus:ring-emerald-500' }
    : { accent: 'text-indigo-600',  btn: 'bg-indigo-600 hover:bg-indigo-700',  ring: 'focus:ring-indigo-500' };

  useEffect(() => {
    // prefill demo
    setResume(sampleTextCandidate());
    setJd(sampleTextJD());
  }, []);

  async function exportDoc(kind: 'pdf' | 'docx') {
    try {
      setLoadingExport(kind);
      setError(null);

      const res = await fetch(`/api/export/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: normalizeText(resume),
          jobDescription: normalizeText(jd),
          result,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Errore export ${kind.toUpperCase()}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cvboost-${kind}.${kind}`;
      a.click();
    } catch (e: any) {
      setError(prettyError(e.message || 'Errore export'));
    } finally {
      setLoadingExport(null);
    }
  }

  async function analyze() {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Mapping in base alla modalità:
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
      setRemaining((data?.remaining ?? null) as any); // server restituisce numero o 'infinite'
    } catch (e: any) {
      setError(prettyError(e.message || 'Errore analisi'));
    } finally {
      setLoading(false);
    }
  }

  async function buyPlan(tier: UiPlan) {
    try {
      setLoadingCheckout(tier);
      setError(null);
      const r = await fetch('/api/checkout/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceTier: tier }),
      });
      const j = await r.json();
      if (!r.ok || !j?.url) throw new Error(j?.error || 'Errore checkout');
      window.location.href = j.url as string;
    } catch (e: any) {
      setError(e.message || 'Errore checkout');
      setLoadingCheckout(null);
    }
  }

  return (
    <MouseGlow mode={mode}>
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
              // 🔒 Normalizza qualsiasi valore non riconosciuto a 'free'
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
          {/* Titolo + switch a pillola */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Ottimizza il tuo <span className={theme.accent}>CV</span> contro la <span className={theme.accent}>Job Description</span>
            </h1>

            <RoleSwitch mode={mode} onChange={setMode} />
          </div>

          <LandingPitch themeAccent={theme.accent} />

          {/* Input area */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {/* Colonna 1 */}
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

            {/* Colonna 2 */}
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

          {/* Azioni */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={analyze}
              disabled={loading}
              className={`px-4 py-2 rounded-xl font-bold ${theme.btn} disabled:opacity-60`}
            >
              {loading ? 'Analisi in corso…' : 'Analizza'}
            </button>

            <button
              onClick={() => exportDoc('pdf')}
              disabled={!result || !!loadingExport}
              className="px-3 py-2 rounded-xl font-bold bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60"
            >
              {loadingExport === 'pdf' ? 'Esporto PDF…' : 'Esporta PDF'}
            </button>

            <button
              onClick={() => exportDoc('docx')}
              disabled={!result || !!loadingExport}
              className="px-3 py-2 rounded-xl font-bold bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60"
            >
              {loadingExport === 'docx' ? 'Esporto DOCX…' : 'Esporta DOCX'}
            </button>
          </div>

          {/* Errori */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-900/30 border border-red-500/40 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Risultato */}
          {result && (
            <section className="mt-8 grid gap-6">
              {/* SCORE */}
              <div className="rounded-2xl border border-white/10 p-4 bg-neutral-900">
                <div className="text-sm opacity-80 font-semibold mb-1">Compatibilità</div>
                <div className="text-4xl font-extrabold">{result.score}/100</div>
              </div>

              {/* KEYWORDS */}
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

              {/* SUGGERIMENTI */}
              <div className="rounded-2xl border border-white/10 p-4 bg-neutral-900">
                <div className="text-sm opacity-80 font-semibold mb-2">Suggerimenti</div>
                <ul className="list-disc ml-5 text-sm space-y-1">
                  {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              {/* CV RISCRITTO */}
              <div className="rounded-2xl border border-white/10 p-4 bg-neutral-900">
                <div className="text-sm opacity-80 font-semibold mb-2">CV riscritto (mirato alla JD)</div>
                <pre className="whitespace-pre-wrap text-sm">{result.improvedResume}</pre>
              </div>

              {/* COVER LETTER */}
              <div className="rounded-2xl border border-white/10 p-4 bg-neutral-900">
                <div className="text-sm opacity-80 font-semibold mb-2">Cover letter generata</div>
                <pre className="whitespace-pre-wrap text-sm">{result.coverLetter}</pre>
              </div>
            </section>
          )}

          {/* Piani / CTA */}
          <ValueSection
            disabledPlus={BUSINESS_PLUS_SOLD_OUT}
            loading={loadingCheckout}
            onBuy={buyPlan}
          />
        </main>

        {/* FOOTER */}
        <footer className="border-t border-white/10 mt-12 py-6 text-center text-xs opacity-70">
          © {new Date().getFullYear()} CVBoost.ai — Tutti i diritti riservati
        </footer>
      </div>
    </MouseGlow>
  );
}
