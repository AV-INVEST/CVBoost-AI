// estratto da src/app/impostazioni/privacy/page.tsx
'use client';
import { useState } from 'react';

export default function PrivacyPage() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleDelete() {
    setErr(null);
    if (!confirm("Confermi l'eliminazione definitiva dell'account? L'operazione non è reversibile.")) return;
    setBusy(true);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Errore');
      // Logout client-side & redirect
      window.location.href = '/';
    } catch (e: any) {
      setErr(e?.message || 'Errore eliminazione');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold mb-2">Privacy & Dati</h2>
      <p className="text-slate-600 mb-6">Scarica una copia dei tuoi dati o elimina definitivamente l’account.</p>

      <div className="flex items-center gap-3">
        <a
          href="/api/account/export"
          className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
        >
          Esporta i miei dati
        </a>

        <button
          onClick={handleDelete}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
        >
          {busy ? 'Elimino…' : 'Elimina account'}
        </button>
      </div>

      {err && <p className="mt-4 text-red-600">{err}</p>}
    </div>
  );
}
