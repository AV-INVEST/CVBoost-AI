// src/components/MouseGlow.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

export default function MouseGlow({
  mode, // 'candidate' | 'recruiter'
  children,
  className = '',
}: {
  mode: 'candidate' | 'recruiter';
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      setPos({
        x: ((e.clientX - r.left) / r.width) * 100,
        y: ((e.clientY - r.top) / r.height) * 100,
      });
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  const color = mode === 'candidate' ? 'rgba(16,185,129,0.16)' : 'rgba(99,102,241,0.16)';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 transition-opacity"
        style={{
          background: `radial-gradient(600px circle at ${pos.x}% ${pos.y}%, ${color}, transparent 40%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
