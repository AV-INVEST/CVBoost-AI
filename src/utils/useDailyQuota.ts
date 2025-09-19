// src/utils/useDailyQuota.ts
"use client";
import { useEffect, useState } from "react";

export function useDailyQuota() {
  const [state, setState] = useState<{ used: number; limit: number; resetAt: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/usage/search", { method: "GET", cache: "no-store" });
        const j = await r.json();
        setState(j);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function consume() {
    try {
      const r = await fetch("/api/usage/search", { method: "POST" });
      const j = await r.json();
      if (!r.ok) {
        setState({ used: j.used, limit: j.limit, resetAt: j.resetAt });
        return { ok: false, reason: "limit" as const };
      }
      setState({ used: j.used, limit: j.limit, resetAt: j.resetAt });
      return { ok: true as const };
    } catch {
      return { ok: false as const, reason: "network" as const };
    }
  }

  return { loading, state, consume };
}
