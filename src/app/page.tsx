// src/app/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

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

// Normalizza qualsiasi valore “plan” in un UiPlan valido (fallback: 'free')
function toUiPlan(input: unknown): UiPlan {
  switch (input) {
    case 'free':
    case 'pro':
    case 'business':
    case 'business_plus':
      return input;
    default:
      return 'free';
  }
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
    useState<null | 'pro' | 'business' | 'business_plus'>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [remaining, setRemaining] = useState<number | 'infinite' | null>(null);
  const [plan, setPlan] = useState<UiPlan | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // modalità (verde/viola)
  const [mode, setMode] = useState<Mode>('candidate');

  // Tema cromatico per candidate/recruiter
  const theme =
    mode === 'candidate'
      ? { accent: 'text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700', ring: 'focus:ring-emerald-500' }
      : { accent: 'text-indigo-600', btn: 'bg-indigo-600 hover:bg-indigo-700', ring: 'focus:ring-indigo-500' };

  // Valore sempre non-null per i componenti UI
  const planForUI: UiPlan = plan ?? 'free';

  // carica il piano all’avvio
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
    if (!resume || !jd) {
      setError('Inserisci entrambi i campi.');
      return;
    }
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
      setPlan(toUiPlan(data?.plan));
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      setError(prettyError(e.message || 'Errore analisi'));
      setRefreshKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  async function exportFile(kind: 'pdf' | 'docx') {
    if (!result) {
      setError('Esegui prima una analisi.');
      return;
    }
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
        throw new Error(prettyError(d?.error || 'Export failed'));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = kind === 'pdf' ? 'CVBoost-report.pdf' : 'CVBoost-report.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(prettyError(e.message || 'Errore export'));
    } finally {
      setLoadingExport(null);
    }
  }

  async function checkout(tier: 'pro' | 'business' | 'business_plus') {
    if (BUSINESS_PLUS_SOLD_OUT && tier === 'business_plus') {
      setError('Business+ è attualmente esaurito. Torna presto!');
      return;
    }
    setLoadingCheckout(tier);
    try {
      const res = await fetch('/api/checkout/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          successUrl: typeof window !== 'undefined' ? window.location.origin + '/?checkout=success' : undefined,
          cancelUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* HEADER */}
      <header className="relative bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-extrabold text-xl">
              CVBoost<span className={theme.accent}>.ai</span>
            </div>
            <PlanPill plan={planForUI} />
          </div>
          <HeaderAuth
            onAuthChange={({ me }) => {
              setPlan(toUiPlan(me?.plan));
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
        {/* Titolo + switch */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold"
          >
            Ottimizza il tuo <span className={theme.accent}>CV</span> per gli ATS in 60 secondi
          </motion.h1>

          <div className="flex justify-center md:justify-end">
            <RoleSwitch mode={mode} onChange={setMode} />
          </div>
        </div>

        <p className="text-gray-600 mb-8 max-w-3xl">
          {mode === 'candidate' ? (
            <>
              Se stai <b>cercando lavoro</b>, incolla il tuo CV a sinistra e la Job Description a destra. Otterrai
              <span className="font-semibold"> punteggio</span>,<span className="font-semibold"> keyword mancanti</span>,
              <span className="font-semibold"> CV riscritto</span> e cover letter.
            </>
          ) : (
            <>
              Se sei un <b>recruiter</b>, incolla l’<b>annuncio/descrizione del ruolo</b> a sinistra e, a destra, un
              <b> CV di riferimento</b> (opzionale) o i requisiti chiave. Lo screening ATS confronterà i due testi.
            </>
          )}
        </p>

        {/* Form */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow p-4 border">
            <label className="block text-sm font-semibold mb-2">
              {mode === 'candidate' ? 'CV (testo) — per chi cerca lavoro' : 'Annuncio / Descrizione Ruolo — per recruiter'}
            </label>
            <textarea
              className={`w-full h-56 p-3 border rounded-xl focus:outline-none focus:ring-2 ${theme.ring}`}
              placeholder={mode === 'candidate' ? 'Incolla qui il tuo CV in testo…' : 'Incolla qui il testo dell’annuncio/ruolo…'}
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />
            <div className="text-xs text-gray-500 mt-2">
              {mode === 'candidate'
                ? 'Suggerimento: includi risultati numerici (%, €, tempo) per aumentare il punteggio.'
                : 'Suggerimento: specifica seniority, stack tecnologico, soft skills e must-have.'}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 border">
            <label className="block text-sm font-semibold mb-2">
              {mode === 'candidate' ? 'Job Description' : 'CV di riferimento / Requisiti chiave'}
            </label>
            <textarea
              className={`w-full h-56 p-3 border rounded-xl focus:outline-none focus:ring-2 ${theme.ring}`}
              placeholder={mode === 'candidate' ? 'Incolla la JD del ruolo…' : 'Incolla un CV di riferimento o elenca i requisiti chiave…'}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
            <div className="text-xs text-gray-500 mt-2">
              {mode === 'candidate'
                ? 'La JD viene confrontata con il tuo CV per identificare gap e suggerimenti.'
                : 'Se non hai un CV di riferimento, scrivi le competenze “ideali” per il ruolo.'}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={analyze}
            disabled={loading}
            className={`px-5 py-3 rounded-xl text-white font-semibold shadow hover:shadow-md disabled:opacity-60 ${theme.btn}`}
          >
            {loading ? 'Analisi in corso…' : mode === 'candidate' ? 'Analizza CV' : 'Analizza annuncio'}
          </button>

          {planForUI !== 'business' && planForUI !== 'business_plus' && (
            <span className="text-sm text-gray-500">
              Gratis 3 Analisi • Passa a Pro: 50 Analisi Mensili • Passa a Business: Analisi Illimitate
            </span>
          )}
        </div>

        {error && <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl">{error}</div>}

        {/* Risultati */}
        {result && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow p-4 border">
              <div className="text-sm text-gray-500">Punteggio Match</div>
              <div className={`text-4xl font-extrabold ${theme.accent}`}>{result.score}</div>
              <div className="text-xs text-gray-500 mt-1">su 100</div>
              <div className="mt-4">
                <div className="text-sm font-semibold mb-1">Keyword mancanti</div>
                <ul className="list-disc pl-5 text-sm text-gray-700">
                  {result.missingKeywords?.length ? result.missingKeywords.map((k, i) => <li key={i}>{k}</li>) : <li>Nessuna keyword critica mancante 🎯</li>}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-4 border md:col-span-2">
              <div className="text-sm font-semibold mb-2">Suggerimenti</div>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">{result.suggestions?.map((s, i) => <li key={i}>{s}</li>)}</ul>

              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => exportFile('pdf')} disabled={loadingExport === 'pdf'} className="px-4 py-2 rounded-lg border shadow-sm hover:shadow disabled:opacity-60">
                  {loadingExport === 'pdf' ? 'Esporto PDF…' : 'Esporta PDF'}
                </button>
                <button onClick={() => exportFile('docx')} disabled={loadingExport === 'docx'} className="px-4 py-2 rounded-lg border shadow-sm hover:shadow disabled:opacity-60">
                  {loadingExport === 'docx' ? 'Esporto DOCX…' : 'Esporta DOCX'}
                </button>
              </div>

              <div className="mt-4">
                <div className="text-sm font-semibold mb-1">Sezione CV riscritta</div>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-xl border">{result.improvedResume}</pre>
              </div>

              <div className="mt-4">
                <div className="text-sm font-semibold mb-1">Cover letter generata</div>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-xl border">{result.coverLetter}</pre>
              </div>
            </div>
          </motion.section>
        )}

        {/* Sezioni marketing/valore */}
        <LandingPitch
          plan={planForUI}
          onUpgrade={(tier) => {
            if (tier === 'pro') return checkout('pro');
            if (tier === 'business') return checkout('business');
          }}
        />

        <ValueSection
          plan={planForUI}
          onUpgrade={(tier) => {
            if (tier === 'pro') return checkout('pro');
            if (tier === 'business') return checkout('business');
          }}
        />
      </main>
    </div>
  );
}
