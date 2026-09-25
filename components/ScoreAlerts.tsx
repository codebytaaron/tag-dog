"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Live } from "@/lib/live";

// Watches live scores; when a game with a Top 25 team scores, shakes the page and pops a mini scoreboard.
type Toast = { key: string; id: string; lv: Live; side: "home" | "away"; pts: number };
const label = (p: number) => (p >= 6 ? "TOUCHDOWN" : p === 3 ? "FIELD GOAL" : p === 2 ? "SAFETY" : p === 1 ? "EXTRA POINT" : "SCORE");

export default function ScoreAlerts() {
  const prev = useRef<Record<string, [number, number]>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let first = true;
    const demo = window.location.search.includes("demoscore");
    const fire = (fresh: Toast[]) => {
      setToasts((t) => [...fresh.slice(0, 2), ...t].slice(0, 3));
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const el = document.documentElement;
        el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake");
        setTimeout(() => el.classList.remove("shake"), 700);
      }
      fresh.forEach((f) => setTimeout(() => setToasts((t) => t.filter((x) => x.key !== f.key)), 8000));
    };
    const load = async () => {
      if (document.hidden && !(first && demo)) return;
      try {
        const r = await fetch("/api/live", { cache: "no-store" });
        if (!r.ok) return;
        const m: Record<string, Live> = await r.json();
        const fresh: Toast[] = [];
        for (const [id, lv] of Object.entries(m)) {
          if (lv.state === "pre" || lv.home == null || lv.away == null) continue;
          const p = prev.current[id], cur: [number, number] = [lv.away, lv.home];
          const ranked = !!(lv.teams?.home.rank || lv.teams?.away.rank);
          if (!first && p && ranked && lv.teams) {
            const da = cur[0] - p[0], dh = cur[1] - p[1];
            if (da > 0 || dh > 0) fresh.push({ key: `${id}-${Date.now()}`, id, lv, side: dh > da ? "home" : "away", pts: Math.max(da, dh) });
          }
          prev.current[id] = cur;
        }
        if (first && demo) {
          const any = Object.entries(m).find(([, lv]) => lv.teams && (lv.teams.home.rank || lv.teams.away.rank)) || Object.entries(m).find(([, lv]) => lv.teams);
          if (any) fresh.push({ key: `demo-${Date.now()}`, id: any[0], lv: { ...any[1], home: any[1].home ?? 7, away: any[1].away ?? 0, detail: any[1].detail || "Demo" }, side: "home", pts: 7 });
        }
        first = false;
        if (fresh.length) fire(fresh);
      } catch {}
    };
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  if (!toasts.length) return null;
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => {
        const T = t.lv.teams!;
        return (
          <Link key={t.key} href={`/game/${t.id}`} className="toast" style={{ ["--c" as any]: T[t.side].color }}>
            <div className="tlab mono"><span className="dotrec" /> {label(t.pts)} · {T[t.side].short.toUpperCase()}</div>
            <div className="tsb">
              {(["away", "home"] as const).map((s) => (
                <span key={s} className={t.side === s ? "hot" : ""}>
                  {T[s].logo && <img src={T[s].logo} alt="" />}
                  <em>{T[s].rank ? <sup>{T[s].rank}</sup> : null}{T[s].abbr}</em>
                  <b>{t.lv[s]}</b>
                </span>
              ))}
            </div>
            <div className="mono tdet">{t.lv.detail} · TAP FOR THE GAME</div>
          </Link>
        );
      })}
    </div>
  );
}
