import { useEffect, useState, useCallback } from "react";

const KEY = "nba-card-sniper-watchlist";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function useWatchlist() {
  const [ids, setIds] = useState<string[]>(() => read());

  useEffect(() => {
    const onStorage = () => setIds(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isWatched = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, toggle, isWatched };
}