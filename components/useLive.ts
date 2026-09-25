"use client";
import { useEffect, useState } from "react";
import type { Live } from "@/lib/live";

// Polls live scores every 20s while the tab is visible.
export function useLive(initial?: Record<string, Live>) {
  const [live, setLive] = useState<Record<string, Live>>(initial || {});
  useEffect(() => {
    const load = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch("/api/live", { cache: "no-store" });
        if (r.ok) setLive(await r.json());
      } catch {}
    };
    const t = setInterval(load, 20000);
    const vis = () => { if (!document.hidden) load(); };
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, []);
  return live;
}
