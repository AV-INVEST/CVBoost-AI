// src/components/HeaderAuth.tsx
'use client';

import { useEffect, useState } from 'react';

type Plan = 'free' | 'pro' | 'business' | 'business_plus' | 'unknown';
type Me = { uid: string | null; plan: Plan };
type AuthMode = 'login' | 'signup';

export default function HeaderAuth({
  onAuthChange,
}: {
  onAuthChange?: (payload: { status: 'logged-in' | 'logged-out'; me: Me }) => void;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'logged-in' | 'error'>('idle');
  const [me, setMe] = useState<Me>({ uid: null, plan: 'free' });

  // Stato per modali passwordless
  const [mode, setMode] = useState<AuthMode>('login');
  const [showModal, setShowModal] = useState(false);
  const [modalEmail, setModalEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [devLink, setDevLink] = useState<string | null>(null);       // fallback console
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // anteprima Ethereal

  async function loadMe() {
    setStatus('checking');
    try {
      const r = await fetch('/api/auth/me', { cache: 'no-store' });
      const j = await r.json();
      const next: Me = { uid: j.uid ?? null, plan: (j.plan ?? 'free') as Plan };
      setMe(next);
      setStatus(next.uid ? 'logged-in' : 'idle');
      onAuthChange?.({ status: next.uid ? 'logged-in' : 'logged-out', me: next });
    } catch {
      setStatus('error');
    }
  }
  useEffect(() => { loadMe(); /* eslint-disable-next-line */ }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    await loadMe();
  }

  // Apri modale con copy diverso
  function openModal(asMode: AuthMode, prefill?: string) {
    setMode(asMode);
    setShowModal(true);
    setMsg('');
    setErr('');
    setDevLink(null);
    setPreviewUrl(null);
    setModalEmail((prefill ?? email ?? '').trim());
  }
  function closeModal() {
    setShowModal(false);
    setBusy(false);
    setMsg('');
    setErr('');
    setDevLink(null);
    setPreviewUrl(null);
  }

  async function sendMagicLink() {
    if (!modalEmail) { setErr('Inserisci una email valida'); return; }
    setBusy(true); setMsg(''); setErr(''); setDevLink(null); setPreviewUrl(null);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: modalEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Errore invio');
      if (data.devLink) setDevLink(data.devLink as string);
      if (data.preview) setPreviewUrl(data.preview as string);
      setMsg(data.message || 'Email inviata! Controlla la casella.');
    } catch (e: any) {
      setErr(e.message || 'Errore');
    } finally {
      setBusy(false);
    }
  }

  // Copy dinamico per i due casi
  const isLogin = mode === 'login';
  const title = isLogin ? 'Accedi in modo sicuro' : 'Crea il tuo account (senza password)';
  const subtitle = isLogin
    ? 'Riceverai un link monouso per confermare che la casella è tua. Nessuno può entrare senza accesso alla tua email.'
    : 'Inserisci la tua email: ti invieremo un link di conferma. Per i prossimi accessi riceverai ogni volta un link sicuro.';
  const tips = isLogin
    ? ['Link monouso', 'Scade tra ~30 minuti', 'Nessuna password da ricordare']
    : ['Niente password', 'Conferma in 1 click dal tuo inbox', 'Funziona anche in futuro: riceverai un link ogni volta'];
  const accent = isLogin ? 'emerald' : 'indigo'; // solo per colori Tailwind

  return (
    <div className="flex items-center gap-3">
      {status !== 'logged-in' ? (
        <>
          <input
            className="border rounded px-2 py-1"
            placeholder="tuo@email.it"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') openModal('login', email); }}
          />
          {/* ACCEDI → modale "login" (sicurezza) */}
          <button
            onClick={() => openModal('login', email)}
            className="px-3 py-1 rounded bg-black text-white"
          >
            Accedi
          </button>
          {/* REGISTRATI → modale "signup" (spiegazione flusso) */}
          <button
            onClick={() => openModal('signup', email)}
            className="px-3 py-1 rounded border hover:shadow transition"
          >
            Registrati
          </button>

          {/* MODALE */}
          {showModal && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
              <div className="bg-white rounded-2xl shadow p-5 w-full max-w-sm">
                <div className="flex items-center gap-2 mb-1">
                  {/* Lock/Shield icon */}
                  <svg aria-hidden="true" viewBox="0 0 24 24" className={`w-5 h-5 text-${accent}-600`}>
                    <path fill="currentColor" d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 116 0v3H9z"/>
                  </svg>
                  <h3 className="text-lg font-semibold">{title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">{subtitle}</p>

                <input
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  placeholder="tua@email.it"
                  className={`w-full px-3 py-2 rounded border mb-2 focus:outline-none focus:ring-2 focus:ring-${accent}-500`}
                />

                {/* Mini bullet tips */}
                <ul className="text-xs text-gray-600 mb-3 list-disc pl-5">
                  {tips.map((t) => <li key={t}>{t}</li>)}
                </ul>

                <div className="flex items-center justify-between">
                  <button onClick={closeModal} className="px-3 py-2 rounded border">Annulla</button>
                  <button
                    onClick={sendMagicLink}
                    disabled={busy}
                    className={`px-3 py-2 rounded bg-${accent}-600 text-white disabled:opacity-60`}
                  >
                    {busy ? 'Invio…' : (isLogin ? 'Invia link di accesso' : 'Invia link di conferma')}
                  </button>
                </div>

                {msg && <p className="text-sm text-emerald-700 mt-3">{msg}</p>}
                {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
                {previewUrl && (
                  <p className="text-sm mt-2">
                    Anteprima (Ethereal):{' '}
                    <a className={`text-${accent}-600 underline`} href={previewUrl} target="_blank" rel="noreferrer">
                      apri
                    </a>
                  </p>
                )}
                {!previewUrl && devLink && (
                  <p className="text-sm mt-2">
                    Link DEV:{' '}
                    <a className={`text-${accent}-600 underline`} href={devLink}>apri</a>
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <span>
            Connesso come <b>{me.uid}</b> — piano <b>{me.plan}</b>
          </span>
          <button onClick={logout} className="px-3 py-1 rounded border">Logout</button>
        </>
      )}
    </div>
  );
}
