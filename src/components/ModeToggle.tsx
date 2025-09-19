'use client';

import { motion } from 'framer-motion';

export type Mode = 'candidate' | 'recruiter';

export default function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <div className="inline-flex relative overflow-hidden bg-white border rounded-2xl shadow-sm p-1 select-none">
      <motion.div
        className="absolute top-1 bottom-1 rounded-xl bg-indigo-50"
        initial={false}
        animate={{ x: mode === 'candidate' ? 2 : 102, width: 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      />
      <button
        type="button"
        onClick={() => onChange('candidate')}
        className={`relative z-0 px-4 py-2 rounded-xl text-sm font-semibold ${
          mode === 'candidate' ? 'text-indigo-700' : 'text-gray-600'
        }`}
        aria-pressed={mode === 'candidate'}
      >
        👤 Candidato
      </button>
      <button
        type="button"
        onClick={() => onChange('recruiter')}
        className={`relative z-0 px-4 py-2 rounded-xl text-sm font-semibold ${
          mode === 'recruiter' ? 'text-indigo-700' : 'text-gray-600'
        }`}
        aria-pressed={mode === 'recruiter'}
      >
        🏢 Recruiter
      </button>
    </div>
  );
}
