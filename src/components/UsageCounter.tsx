'use client';

import { useEffect, useMemo, useState } from 'react';

type Summary = {
  plan: 'free'|'pro'|'business'|'business_plus';
  scope: 'daily'|'monthly'|'unlimited';
  limit: number|null;
  used: number|null;                // fallback server
  remaining: number|'infinite';
  resetAt: number|null;             // epoch ms
};

function fmtDhM(msLeft: number) {
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const minMs = 60 * 1000;
  const d = Math.floor(msLeft / dayMs);
  const h = Math.floor((msLeft % dayMs) / hourMs);
  const m = Math.floor((msLeft % hourMs) / minMs);
  return `${d} giorni, ${h} ore, ${m} minuti`;
}

export default function UsageCounter({
  refreshKey = 0,
  overrideRemaining,
  onResolved
}: {
  refreshKey?: number;
  overrideRemaining?: number|'infinite'|null; // se la pagina conosce già il remaining aggiornato
  onResolved?: (s: Summary) => void;
}) {
  const [data, setData] = useState<Summary | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  // tick per il countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    const r = await fetch('/api/usage/summary', { cache: 'no-store' });
    const j: Summary = await r.json();
    setData(j);
    onResolved?.(j);
  }
  useEffect(() => { load(); }, [refreshKey]);

  // remaining effettivo (priorità all'override del client)
  const effectiveRemaining = useMemo(() => {
    if (overrideRemaining != null) return overrideRemaining;
    return data?.remaining ?? null;
  }, [data, overrideRemaining]);

  // used effettivo = limit - remaining (se possibile), altrimenti fallback server
  const effectiveUsed = useMemo(() => {
    if (!data || data.scope === 'unlimited') return null;
    if (typeof data.limit === 'number' && typeof effectiveRemaining === 'number') {
      return Math.max(0, data.limit - effectiveRemaining);
    }
    return typeof data.used === 'number' ? data.used : 0;
  }, [data, effectiveRemaining]);

  // percentuale RESTANTE (quello che vuoi vedere a 100% quando 50/50)
  const pctRemaining = useMemo(() => {
    if (!data) return 0;
    if (data.scope === 'unlimited') return 100;
    if (typeof data.limit === 'number' && typeof effectiveRemaining === 'number' && data.limit > 0) {
      return Math.min(100, Math.round((effectiveRemaining / data.limit) * 100));
    }
    return 0;
  }, [data, effectiveRemaining]);

  const resetText = useMemo(() => {
    if (!data?.resetAt) return null;
    const ms = Math.max(0, data.resetAt - now);
    return fmtDhM(ms);
  }, [data, now]);

  if (!data) {
    return <div className="rounded-2xl border bg-white shadow p-4 animate-pulse h-[96px] w-full" />;
  }

  const badgeText =
    data.scope === 'unlimited' ? 'Illimitate'
    : data.scope === 'monthly' ? 'Mensili'
    : 'Giornaliere';

  return (
    <div className="w-full rounded-2xl border bg-white shadow p-4 flex items-center gap-4">
      {/* SINISTRA → EFFETTUATE (numero grande) */}
      <div className="flex-1 flex items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-gray-200" />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              // l'arco rappresenta % RESTANTE (100% quando X/X)
              background: data.scope === 'unlimited'
                ? 'conic-gradient(#4f46e5 360deg, #e5e7eb 0deg)'
                : `conic-gradient(#4f46e5 ${pctRemaining * 3.6}deg, #e5e7eb 0deg)`
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center font-extrabold text-xl">
            {data.scope === 'unlimited'
              ? '∞'
              : typeof effectiveUsed === 'number'
                ? effectiveUsed
                : '–'}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">
            {data.scope === 'unlimited' ? 'Analisi illimitate' : 'Analisi effettuate'}
          </div>
          <div className="text-2xl font-bold">
            {data.scope === 'unlimited' ? 'Illimitate' : (
              <>
                {typeof effectiveUsed === 'number' ? effectiveUsed : '—'}
                {typeof data.limit === 'number' ? (
                  <span className="text-gray-400 text-base"> / {data.limit}</span>
                ) : null}
              </>
            )}
          </div>
          <div className="mt-1">
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {badgeText} • piano {data.plan}
            </span>
          </div>
        </div>
      </div>

      {/* DESTRA → RESTANTI + barra e dettagli (mostra anche % restanti) */}
      {data.scope !== 'unlimited' && (
        <div className="w-64">
          <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600" style={{ width: `${pctRemaining}%` }} />
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Restanti {typeof effectiveRemaining === 'number' ? effectiveRemaining : 0}
            {typeof data.limit === 'number' ? ` / ${data.limit}` : ''} ({pctRemaining}%)
          </div>

          {resetText && data.scope === 'daily' && (
            <div className="text-xs text-gray-500 mt-1">
              Reset alle 00:00 (Europe/Rome) • manca {resetText}
            </div>
          )}
          {resetText && data.scope === 'monthly' && (
            <div className="text-xs text-gray-500 mt-1">
              Reset il 1° del mese alle 00:00 (Europe/Rome) • manca {resetText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
