// src/components/ValueSection.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, Shield, Wand2, Zap, Filter, Target, MousePointerClick, CheckCircle2 } from 'lucide-react';

// ---- Tipi
type Plan = 'free' | 'pro' | 'business' | 'business_plus' | 'unknown';

// ---- Helpers demo/tokenizer
function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-zà-ù0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((t) => t && !stop.has(t));
}
const stop = new Set(
  'a ad al alla alle agli con col come da dal dalla delle degli di del della delle degli e ed per tra fra il la le lo gli i in su sul sulla nelle negli uno una un che o oppure però quindi poi ma se sebbene non piu più meno molto poco sono sei era erano essere avere fare fatto abbiamo avete hanno questo questa quello quella questi queste'
    .split(/\s+/)
);

export default function ValueSection({
  plan,
  onUpgrade,
}: {
  plan: Plan;
  onUpgrade?: (tier: 'pro' | 'business') => void;
}) {
  // Stato spotlight
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [spot, setSpot] = useState({ x: 50, y: 50 });
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      setSpot({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  // Demo candidato
  const [cv, setCv] = useState('Esperienza: React, TypeScript, Node, PostgreSQL. Gestione progetti Agile.');
  const [jd, setJd] = useState('Sviluppatore React con TypeScript, esperienza in API Node e database SQL. Agile.');
  const { score, missing } = useMemo(() => {
    const a = new Set(tokenize(cv));
    const b = tokenize(jd);
    if (b.length === 0) return { score: 0, missing: [] as string[] };
    let hit = 0;
    const miss: string[] = [];
    const uniqB = new Set(b);
    for (const t of uniqB) (a.has(t) ? hit++ : miss.push(t));
    const s = Math.round((hit / uniqB.size) * 100);
    return { score: isFinite(s) ? s : 0, missing: miss.slice(0, 8) };
  }, [cv, jd]);

  // Demo recruiter (batch semplice)
  const [cands, setCands] = useState(
    'Marta — React, Next.js, UI/UX, TypeScript\nLuca — Java, Spring, SQL\nGiulia — React, Node, TypeScript, SQL, Docker'
  );
  const top = useMemo(() => {
    const jdTokens = new Set(tokenize(jd));
    return cands
      .split(/\n+/)
      .map((row) => {
        const [name, skillsRaw] = row.split('—').map((s) => (s || '').trim());
        const skills = tokenize(skillsRaw || '');
        let m = 0;
        for (const s of new Set(skills)) if (jdTokens.has(s)) m++;
        const sc = jdTokens.size ? Math.round((m / jdTokens.size) * 100) : 0;
        return { name: name || 'Candidato', score: sc };
      })
      .filter((x) => x.name)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [cands, jd]);

  // Stato piano
  const proActive = plan === 'pro' || plan === 'business' || plan === 'business_plus';
  const businessActive = plan === 'business' || plan === 'business_plus';
  const isFree = !proActive && !businessActive;

  return (
    <section ref={sectionRef} className="relative overflow-hidden rounded-3xl border bg-gradient-to-b from-white to-slate-50/60 shadow-sm mt-16">
      {/* Spotlight che segue il mouse */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{ background: `radial-gradient(600px circle at ${spot.x}% ${spot.y}%, rgba(99,102,241,0.15), transparent 40%)` }}
      />

      <div className="relative px-6 py-12 md:px-10 lg:px-16">
        {/* Header testo */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            <Shield className="w-4 h-4" /> Affinità CV ↔ Job & Screening veloce
          </p>
          <h2 className="text-2xl md:text-4xl font-bold mt-3 leading-tight">
            Mostra il <span className="text-indigo-600">valore</span> prima di inviare:
            verifica l'affinità, colma i gap e accelera lo screening.
          </h2>
          <p className="text-slate-600 mt-3">
            Mini-demo per capire come CVBoost.ai ragiona: punteggi 1–100, keyword mancanti e shortlist automatica.
          </p>
        </div>

        {/* Doppia colonna */}
        <div className="grid lg:grid-cols-2 gap-8 mt-10">
          {/* Candidato */}
          <div className="rounded-2xl border bg-white p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold">Candidato — Controlla l'affinità prima di candidarti</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <textarea className="w-full h-36 rounded-xl border p-3 text-sm" value={cv} onChange={(e) => setCv(e.target.value)} placeholder="Incolla qui il tuo CV (testo)…" />
              <textarea className="w-full h-36 rounded-xl border p-3 text-sm" value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Incolla qui l'offerta di lavoro…" />
            </div>

            <div className="flex items-center gap-6 mt-5">
              {/* Indicatore circolare */}
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#10b981 ${score * 3.6}deg, #e5e7eb 0deg)` }} />
                <div className="absolute inset-2 rounded-full bg-white grid place-items-center">
                  <span className="font-semibold text-lg">{score}</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600">Affinità stimata CV ↔ JD</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {missing.length === 0 ? (
                    <span className="text-emerald-700 text-sm inline-flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Ottimo allineamento
                    </span>
                  ) : (
                    missing.map((m) => (
                      <span key={m} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full">
                        manca: {m}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* CTA dinamica candidato */}
            <div className="mt-5 flex items-center gap-3">
              {proActive ? (
                <span className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Pro attivo
                </span>
              ) : (
                <button
                  onClick={() => onUpgrade?.('pro')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white shadow hover:shadow-md transition"
                >
                  Passa a Pro
                </button>
              )}
              {businessActive && <p className="text-xs text-slate-500">Con Business <b>Pro è incluso</b>.</p>}
            </div>
          </div>

          {/* Recruiter */}
          <div className="rounded-2xl border bg-white p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold">Aziende — Shortlist in pochi secondi</h3>
            </div>

            <div className="grid gap-4">
              <textarea className="w-full h-24 rounded-xl border p-3 text-sm" value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Incolla la Job Description…" />
              <textarea
                className="w-full h-24 rounded-xl border p-3 text-sm"
                value={cands}
                onChange={(e) => setCands(e.target.value)}
                placeholder={'Incolla candidati (uno per riga)\nEs:\nMarta — React, Next.js, UI/UX\nLuca — Java, Spring, SQL'}
              />

              <div className="mt-1">
                {top.map((c) => (
                  <div key={c.name} className="mb-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-slate-500">{c.score}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${c.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA dinamica recruiter */}
              <div className="mt-3 flex items-center gap-3">
                {businessActive ? (
                  <span className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Business attivo
                  </span>
                ) : (
                  <button
                    onClick={() => onUpgrade?.('business')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white shadow hover:shadow-md transition"
                  >
                    Passa a Business
                  </button>
                )}
                {!businessActive && proActive && (
                  <p className="text-xs text-slate-500">Hai Pro: <b>puoi fare upgrade</b> a Business.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* USP */}
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-white p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-medium">Accesso sicuro, senza password</p>
              <p className="text-sm text-slate-600">Link monouso, scadenza rapida e niente password da ricordare.</p>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium">Punteggi immediati</p>
              <p className="text-sm text-slate-600">Valutazioni 1–100 e keyword mancanti per azioni concrete.</p>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 flex items-start gap-3">
            <Wand2 className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="font-medium">Export e automazioni</p>
              <p className="text-sm text-slate-600">PDF/DOCX in 1 click e batch scoring per team HR.</p>
            </div>
          </div>
        </div>

        {/* CTA finale dinamica */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isFree ? (
            <>
              <a href="#pricing" className="px-5 py-3 rounded-2xl bg-black text-white shadow hover:shadow-lg transition flex items-center gap-2">
                <MousePointerClick className="w-4 h-4" /> Provalo gratis: 3 analisi
              </a>
              <span className="text-slate-500 text-sm">Nessuna carta richiesta • Disdici quando vuoi</span>
            </>
          ) : businessActive ? (
            <span className="px-4 py-2 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              Hai <b>Business</b> attivo • Analisi illimitate
            </span>
          ) : (
            // pro attivo ma non business
            <>
              <button
                onClick={() => onUpgrade?.('business')}
                className="px-5 py-3 rounded-2xl bg-indigo-600 text-white shadow hover:shadow-lg transition"
              >
                Sblocca la shortlist con Business
              </button>
              <span className="text-slate-500 text-sm">Hai Pro attivo • Upgrade rapido</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
