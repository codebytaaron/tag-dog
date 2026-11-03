"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LiteGame } from "@/lib/data";
import type { Live } from "@/lib/live";
import { fetchLiveDirect } from "@/lib/liveParse";
import { useFollow, useProfile } from "./SaveButton";
import Kickoff from "./Kickoff";

const KEY = "tapedog.tracker";
type Snap = { t: number; m: Record<string, Live> };
const label = (p: number) => (p >= 6 ? "Touchdown" : p === 3 ? "Field goal" : p === 2 ? "Safety" : p === 1 ? "Extra point" : "Score");

// A second-screen scoreboard: pick games, keep this open next to the TV. Updates every 10 seconds with no refresh.
// "Delay" holds scores back so they match a TV broadcast that runs behind live.
export default function Tracker({ games, initial }: { games: LiteGame[]; initial: Record<string, Live> }) {
  const [sel, setSel] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [ready, setReady] = useState(false);
  const [delay, setDelay] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [tick, setTick] = useState(0);
  const [awake, setAwake] = useState(false);
  const [lastOk, setLastOk] = useState(Date.now());
  const [flash, setFlash] = useState<Record<string, { side: "home" | "away"; pts: number; until: number }>>({});
  const snaps = useRef<Snap[]>([{ t: Date.now(), m: initial }]);
  const seen = useRef<Record<string, [number, number]>>({});
  const box = useRef<HTMLDivElement>(null);
  const lock = useRef<any>(null);
  const { ids } = useFollow();
  const { profile } = useProfile();

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s?.sel?.length) setSel(s.sel); else setEditing(true);
      if (s?.delay) setDelay(s.delay);
    } catch { setEditing(true); }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) try { localStorage.setItem(KEY, JSON.stringify({ sel, delay })); } catch {} }, [sel, delay, ready]);

  useEffect(() => {
    const load = async () => {
      try {
        const m = await fetchLiveDirect();
        if (!m) return; // keep showing the last good scores
        setLastOk(Date.now());
        snaps.current.push({ t: Date.now(), m });
        snaps.current = snaps.current.filter((s) => Date.now() - s.t < 6 * 60000);
        setTick((x) => x + 1);
      } catch {}
    };
    // Small random offset so thousands of open trackers do not all ask at the same instant.
    let p: any;
    const start = setTimeout(() => { load(); p = setInterval(load, 10000); }, Math.random() * 3000);
    const c = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearTimeout(start); clearInterval(p); clearInterval(c); };
  }, []);

  const shown = useMemo(() => {
    const target = now - delay * 1000;
    let s = snaps.current[0];
    for (const x of snaps.current) if (x.t <= target) s = x;
    return s;
  }, [now, delay, tick]);
  const live = shown.m;

  useEffect(() => {
    const add: typeof flash = {};
    for (const id of sel) {
      const l = live[id];
      if (!l || l.home == null || l.away == null) continue;
      const p = seen.current[id];
      if (p) {
        const da = l.away - p[0], dh = l.home - p[1];
        if (da > 0 || dh > 0) add[id] = { side: dh > da ? "home" : "away", pts: Math.max(da, dh), until: Date.now() + 12000 };
      }
      seen.current[id] = [l.away, l.home];
    }
    if (Object.keys(add).length) setFlash((f) => ({ ...f, ...add }));
  }, [live, sel]);

  const stateOf = (g: LiteGame) => live[g.id]?.state ?? g.state;
  const rank = (g: LiteGame) => (stateOf(g) === "in" ? 0 : stateOf(g) === "pre" ? 1 : 2);
  const sorted = useMemo(() => [...games].sort((a, b) => rank(a) - rank(b) || Date.parse(a.date) - Date.parse(b.date)), [games, live]); // eslint-disable-line
  const picked = sorted.filter((g) => sel.includes(g.id));
  const mine = new Set([...ids, profile?.teamId].filter(Boolean) as string[]);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const addMany = (list: LiteGame[]) => setSel((s) => [...new Set([...s, ...list.map((g) => g.id)])]);

  const full = () => { const el = box.current; if (!el) return; document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen?.(); };
  const keepAwake = async () => {
    try {
      if (lock.current) { await lock.current.release(); lock.current = null; setAwake(false); return; }
      lock.current = await (navigator as any).wakeLock?.request("screen");
      setAwake(!!lock.current);
    } catch {}
  };
  const ago = Math.max(0, Math.round((now - shown.t) / 1000));

  return (
    <div className="wrap tv" ref={box}>
      <div className="tv-top">
        <div>
          <h1 className="btitle">Score Tracker</h1>
          <p className="muted">Pick your games and keep this open next to the TV. Scores update by themselves.</p>
        </div>
        <div className="tv-ctl">
          {now - lastOk > 45000
            ? <span className="tv-upd bad"><i />Reconnecting… showing last scores</span>
            : <span className="tv-upd"><i />{delay ? `Showing scores from ${delay}s ago` : `Updated ${ago < 3 ? "now" : `${ago}s ago`}`}</span>}
          <label className="sortsel">Delay
            <select value={delay} onChange={(e) => setDelay(Number(e.target.value))}>
              <option value={0}>Off</option><option value={15}>15 sec</option><option value={30}>30 sec</option><option value={60}>1 min</option><option value={120}>2 min</option>
            </select>
          </label>
          <button className="pill" onClick={keepAwake}>{awake ? "Screen stays on" : "Keep screen on"}</button>
          <button className="pill" onClick={full}>Full screen</button>
          <button className="pill on" onClick={() => setEditing(!editing)}>{editing ? "Done" : "Edit games"}</button>
        </div>
      </div>

      {editing && (
        <section className="tv-pick">
          <div className="tv-quick">
            <button className="pill" onClick={() => addMany(sorted.filter((g) => stateOf(g) === "in"))}>All live games</button>
            <button className="pill" onClick={() => addMany(sorted.filter((g) => g.home.rank || g.away.rank))}>Every Top 25 game</button>
            {mine.size > 0 && <button className="pill" onClick={() => addMany(sorted.filter((g) => mine.has(g.home.id) || mine.has(g.away.id)))}>My teams</button>}
            {sel.length > 0 && <button className="pill" onClick={() => setSel([])}>Clear all</button>}
            <span className="muted small">{sel.length} selected</span>
          </div>
          <div className="tv-list">
            {sorted.map((g) => {
              const st = stateOf(g), l = live[g.id];
              return (
                <label key={g.id} className={`tv-opt ${sel.includes(g.id) ? "on" : ""}`}>
                  <input type="checkbox" checked={sel.includes(g.id)} onChange={() => toggle(g.id)} />
                  <span className="tv-optl">{g.away.logo && <img src={g.away.logo} alt="" />}{g.home.logo && <img src={g.home.logo} alt="" />}</span>
                  <span className="tv-optt"><b>{g.away.rank ? `${g.away.rank} ` : ""}{g.away.short} at {g.home.rank ? `${g.home.rank} ` : ""}{g.home.short}</b>
                    <small className="muted">{st === "in" ? `Live · ${l?.detail}` : st === "post" ? `Final ${l?.away ?? ""}-${l?.home ?? ""}` : <Kickoff date={g.date} />}{g.network ? ` · ${g.network}` : ""}</small></span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {!editing && picked.length === 0 && (
        <div className="empty">No games picked yet. <button className="linkbtn" onClick={() => setEditing(true)}>Choose games</button></div>
      )}

      <div className="tv-grid">
        {picked.map((g) => {
          const l = live[g.id], st = stateOf(g), fl = flash[g.id] && flash[g.id].until > now ? flash[g.id] : null;
          const wp = l?.homeWP;
          return (
            <div key={g.id} className={`tv-tile ${st} ${fl ? "flash" : ""}`} style={{ ["--c" as any]: fl ? g[fl.side].color : "transparent" }}>
              <div className="tv-head">
                <span className={st === "in" ? "tv-live" : ""}>{st === "in" ? <><i />{l?.detail}</> : st === "post" ? "Final" : <Kickoff date={g.date} />}</span>
                <span className="muted">{g.network || ""}</span>
                <button className="tv-x" onClick={() => toggle(g.id)} aria-label="Remove game">×</button>
              </div>
              {(["away", "home"] as const).map((s) => {
                const t = g[s], sc = l && st !== "pre" ? l[s] : null, other = l && st !== "pre" ? l[s === "home" ? "away" : "home"] : null;
                return (
                  <Link key={s} href={`/game/${g.id}`} className={`tv-row ${sc != null && other != null && sc > other ? "lead" : ""}`}>
                    {t.logo && <img src={t.logo} alt="" />}
                    <span className="tv-name">{t.rank ? <em>{t.rank}</em> : null}{t.short}{st === "in" && l?.poss === t.id && <i className="tv-poss" title="Has the ball" />}</span>
                    <b className="tv-score">{sc ?? ""}</b>
                  </Link>
                );
              })}
              <div className="tv-foot">
                {fl ? <span className="tv-flashtxt">{label(fl.pts)} · {g[fl.side].short}</span>
                  : st === "in" && l?.down ? <span className={l.redZone ? "c-fade" : ""}>{l.down}{l.redZone ? " · Red zone" : ""}</span>
                  : st === "pre" ? <span className="muted">{g.line}</span> : <span className="muted">{st === "post" ? "Game over" : ""}</span>}
              </div>
              {st === "in" && wp != null && (
                <div className="tv-wp" title="Win probability"><i style={{ width: `${(1 - wp) * 100}%`, background: g.away.color }} /><i style={{ width: `${wp * 100}%`, background: g.home.color }} /></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
