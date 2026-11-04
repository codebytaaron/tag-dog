"use client";
import { useEffect, useState } from "react";
import type { Live } from "@/lib/live";
import { useLive } from "./useLive";

function countdown(ms: number) {
  if (ms <= 0) return "any minute";
  const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60;
  return d ? `${d}d ${h}h ${m}m` : h ? `${h}h ${m}m` : `${m}m`;
}

export default function LiveBar({ id, date, away, home, initial }: { id: string; date: string; away: string; home: string; initial: Live | null }) {
  const map = useLive(initial ? { [id]: initial } : undefined);
  const lv = map[id] || initial;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

  if (!lv || lv.state === "pre") {
    return <div className="lbar pre mono"><span className="dotwait" /> KICKOFF IN <b>{now ? countdown(Date.parse(date) - now) : "…"}</b></div>;
  }
  const live = lv.state === "in";
  const wp = lv.homeWP != null ? Math.round(lv.homeWP * 100) : null;
  return (
    <div className={`lbar ${live ? "on" : "fin"}`}>
      <div className="lstat mono">{live ? <><span className="dotrec" /> LIVE</> : "FINAL"} <span className="muted">{lv.detail}</span></div>
      <div className="lscore">
        <span className={lv.away! > lv.home! ? "w" : ""}>{away} <b>{lv.away}</b></span>
        <i>–</i>
        <span className={lv.home! > lv.away! ? "w" : ""}><b>{lv.home}</b> {home}</span>
      </div>
      {live && (lv.down || lv.lastPlay) && (
        <div className="lplay">
          {lv.down && <span className={`mono ${lv.redZone ? "c-fade" : ""}`}>{lv.down}{lv.redZone ? " · RED ZONE" : ""}</span>}
          {lv.lastPlay && <p>{lv.lastPlay}</p>}
        </div>
      )}
      {live && wp != null && (
        <div className="lwp mono"><span>{away} {100 - wp}%</span><div className="bar"><i style={{ width: `${100 - wp}%` }} /></div><span>{home} {wp}%</span></div>
      )}
    </div>
  );
}
