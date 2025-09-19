"use client";

import { useState } from "react";

export default function PrivacyControls() {
  const [busy, setBusy] = useState<null | "export" | "delete">(null);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    try {
      setError(null);
      setBusy("export");
      const res = await fetch("/api/account/export", { method: "GET" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cvboostai-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || "Errore durante l’esportazione");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    try {
      setError(null);
      setBusy("delete");
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok && res.status !== 204) throw new Error("Delete failed");
      // opzionale: signOut() se usi NextAuth
      window.location.href = "/goodbye"; // oppure homepage
    } catch (e: any) {
      setError(e.message || "Errore durante l’eliminazione");
    } finally {
      setBusy(null);
      setConfirm(false);
    }
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold mb-4">Privacy & Dati</h2>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExport}
          disabled={busy === "export"}
          className="px-4 py-2 rounded bg-gray-900 text-white disabled:opacity-60"
        >
          {busy === "export" ? "Preparazione…" : "Esporta i miei dati"}
        </button>

        <button
          onClick={() => setConfirm(true)}
          disabled={busy === "delete"}
          className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-60"
        >
          Elimina account
        </button>
      </div>

      {error && <p className="text-red-600 mt-3">{error}</p>}

      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Conferma eliminazione</h3>
            <p className="text-sm text-gray-600 mb-4">
              Questa operazione è irreversibile. Saranno rimossi account e contenuti associati.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirm(false)}
                className="px-4 py-2 rounded border border-gray-300"
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                disabled={busy === "delete"}
                className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-60"
              >
                {busy === "delete" ? "Eliminazione…" : "Conferma elimina"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
