'use client';

import { motion } from 'framer-motion';

type Plan = 'free'|'pro'|'business'|'business_plus'|null;

export default function PlanPill({ plan }: { plan: Plan }) {
  const label =
    plan === 'business_plus' ? 'BUSINESS+' :
    plan === 'business' ? 'BUSINESS' :
    plan === 'pro' ? 'PRO' : 'FREE';

  const gradient =
    plan === 'business' ? 'from-emerald-500 to-teal-600' :
    plan === 'pro' ? 'from-indigo-500 to-violet-600' :
    'from-gray-400 to-gray-500';

  return (
    <motion.span
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-xs font-bold
                  bg-gradient-to-r ${gradient} shadow`}
      style={{ backgroundSize: '200% 200%' }}
    >
      <span aria-hidden>⚡</span>
      {label}
    </motion.span>
  );
}
