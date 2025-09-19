// src/components/LandingPitch.tsx
'use client';

import { CheckCircle2, Lock, Sparkles } from "lucide-react";

type Plan = "free" | "pro" | "business" | "business_plus" | "unknown";

export default function LandingPitch({
  plan,
  onUpgrade,
}: {
  plan: Plan;
  onUpgrade?: (tier: "pro" | "business") => void;
}) {
  const proActive = plan === "pro" || plan === "business" || plan === "business_plus";
  const businessActive = plan === "business" || plan === "business_plus";

  const ProCTA = () => (
    <button
      disabled={proActive}
      onClick={() => !proActive && onUpgrade?.("pro")}
      className={`px-4 py-2 rounded-xl shadow transition ${
        proActive
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
          : "bg-emerald-600 text-white hover:shadow-md"
      }`}
    >
      {proActive ? "Pro attivo" : "Passa a Pro (€9/m)"}
    </button>
  );

  const BusinessCTA = () => (
    <button
      disabled={businessActive}
      onClick={() => !businessActive && onUpgrade?.("business")}
      className={`px-4 py-2 rounded-xl shadow transition ${
        businessActive
          ? "bg-indigo-50 text-indigo-700 border border-indigo-200 cursor-default"
          : "bg-indigo-600 text-white hover:shadow-md"
      }`}
    >
      {businessActive ? "Business attivo" : "Passa a Business (€49/m)"}
    </button>
  );

  return (
    <section className="mt-10 grid md:grid-cols-2 gap-6">
      {/* Candidati / Pro */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold">Candidati — Ottimizza il CV</h3>
        </div>
        <ul className="text-sm text-slate-700 space-y-1 mb-4">
          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Punteggio di match con la Job Description</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Keyword mancanti e suggerimenti mirati</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> CV riscritto e cover letter</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Export PDF/DOCX in 1 click</li>
        </ul>

        <div className="flex items-center gap-3">
          <ProCTA />
          {businessActive && (
            <span className="text-xs text-slate-500">Con Business <b>Pro è incluso</b>.</span>
          )}
        </div>
      </div>

      {/* Aziende / Business */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold">Aziende — Screening più veloce</h3>
        </div>
        <ul className="text-sm text-slate-700 space-y-1 mb-4">
          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Match percentuale CV ↔ JD</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Filtri competenze e must-have</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Consigli rapidi per l’allineamento</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Analisi illimitate</li>
        </ul>

        <div className="flex items-center gap-3">
          <BusinessCTA />
          {!businessActive && proActive && (
            <span className="text-xs text-slate-500">Hai Pro: <b>puoi fare upgrade</b> a Business.</span>
          )}
        </div>
      </div>
    </section>
  );
}
