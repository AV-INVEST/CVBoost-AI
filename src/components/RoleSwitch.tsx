// src/components/RoleSwitch.tsx
'use client';

import { Briefcase, UserRound } from 'lucide-react';
import { useMemo } from 'react';

export type Mode = 'candidate' | 'recruiter';

export default function RoleSwitch({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const idx = mode === 'candidate' ? 0 : 1;
  const indicatorStyle = useMemo(
    () => ({
      transform: `translateX(${idx * 100}%)`,
    }),
    [idx]
  );

  return (
    <div className="relative w-[260px] h-11 rounded-2xl border bg-white shadow-sm overflow-hidden">
      {/* Indicatore animato */}
      <div
        className={`absolute inset-y-0 left-0 w-1/2 rounded-2xl transition-transform duration-300 ease-out ${
          mode === 'candidate'
            ? 'bg-emerald-50 border border-emerald-100'
            : 'bg-indigo-50 border border-indigo-100'
        }`}
        style={indicatorStyle}
      />
      <div className="absolute inset-0 grid grid-cols-2">
        <button
          type="button"
          onClick={() => onChange('candidate')}
          className={`relative z-10 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
            mode === 'candidate' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserRound className="w-4 h-4" />
          Candidato
        </button>
        <button
          type="button"
          onClick={() => onChange('recruiter')}
          className={`relative z-10 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
            mode === 'recruiter' ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Recruiter
        </button>
      </div>
    </div>
  );
}
