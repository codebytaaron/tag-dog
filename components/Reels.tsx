"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Reel } from "@/lib/reels";
import SaveButton, { useFollow, useProfile } from "./SaveButton";

type F = "foryou" | "top25" | "upsets" | "close";
const FILTERS: [F, string][] = [["foryou", "For you"], ["top25", "Top 25"], ["upsets", "Upsets"], ["close", "Close games"]];
const AFF = "tapedog.reelaff";
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

// Taste model: clips you watch to the end raise their tags and teams; quick skips lower them.
function readAff(): Record<string, number> { try { return JSON.parse(localStorage.getItem(AFF) || "{}"); } catch { return {}; } }
function learn(r: Reel, watched: number, seconds: number) {
  const delta = watched >= 0.7 ? 1 : seconds < 3 ? -0.5 : 0;
  if (!delta) return;
  const a = readAff();
  for (const k of [...r.tags.map((t) => `tag:${t}`), `team:${r.home.id}`, `team:${r.away.id}`]) a[k] = Math.max(-3, Math.min(5, (a[k] || 0) + delta));
  try { localStorage.setItem(AFF, JSON.stringify(a)); } catch {}
}

// Weighted shuffle (new order every visit), boosted by your teams and taste, never the same game twice in a row of three.
function order(clips: Reel[], mine: Set<string>): Reel[] {
  const a = readAff();
  const scored = clips.map((c) => {
    let s = c.score * (0.5 + Math.random());
    for (const t of c.tags) s *= 1 + (a[`tag:${t}`] || 0) * 0.15;
    for (const id of [c.home.id, c.away.id]) { s *= 1 + (a[`team:${id}`] || 0) * 0.2; if (mine.has(id)) s *= 1.8; }
    return { c, s };
  }).sort((x, y) => y.s - x.s).map((x) => x.c);
  const out: Reel[] = [];
  while (scored.length) {
    const i = scored.findIndex((c) => !out.slice(-3).some((o) => o.gameId === c.gameId));
    out.push(scored.splice(i < 0 ? 0 : i, 1)[0]);
  }
  return out;
}

export default function Reels({ initial, nextWeek, first }: { initial: Reel[]; nextWeek: number; first: string | null }) {
  const feed = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Reel[]>([]);
  const [f, setF] = useState<F>("foryou");
  const [idx, setIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [prog, setProg] = useState(0);
  const [copied, setCopied] = useState(false);
  const week = useRef(nextWeek);
  const loading = useRef(false);
  const active = useRef<{ i: number; start: number } | null>(null);
  const { ids } = useFollow();
  const { profile } = useProfile();
  const mineKey = [...ids, profile?.teamId || ""].join(",");

  // Build the feed once on the client (random + personal), with a shared clip first if there is one.
  useEffect(() => {
    const mine = new Set(mineKey.split(",").filter(Boolean));
    let list = order(initial, mine);
    if (first) { const c = list.find((x) => x.key === first); if (c) list = [c, ...list.filter((x) => x !== c)]; }
    setItems(list);
    try { setMuted(localStorage.getItem("tapedog.reelsound") !== "on"); } catch {}
  }, []); // eslint-disable-line

  const view = useMemo(() => {
    if (f === "top25") return items.filter((r) => r.home.rank || r.away.rank);
    if (f === "upsets") return items.filter((r) => r.tags.includes("Upset"));
    if (f === "close") return items.filter((r) => r.tags.includes("One-score game") || r.tags.includes("Overtime"));
    return items;
  }, [items, f]);

  const more = useCallback(async () => {
    if (loading.current || week.current < 1) return;
    loading.current = true;
    try {
      const r = await fetch(`/api/reels?week=${week.current}`);
      const d = await r.json();
      week.current -= 1;
      const mine = new Set(mineKey.split(",").filter(Boolean));
      setItems((cur) => {
        const have = new Set(cur.map((c) => c.key));
        return [...cur, ...order((d.clips || []).filter((c: Reel) => !have.has(c.key)).map((c: Reel) => ({ ...c, score: c.score * 0.5 })), mine)];
      });
    } catch {}
    loading.current = false;
  }, [mineKey]);

  // New filter: back to the top.
  useEffect(() => { feed.current?.scrollTo({ top: 0 }); setIdx(0); }, [f]);

  // Play the clip on screen and pause the rest. Re-observes as more clips load, without moving the scroll.
  useEffect(() => {
    const root = feed.current;
    if (!root) return;
    const vids = [...root.querySelectorAll<HTMLVideoElement>("video")];
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target as HTMLVideoElement;
        const i = Number(v.dataset.i);
        if (e.isIntersecting) {
          if (active.current?.i === i) continue;
          const prev = active.current && vids[active.current.i];
          if (prev && view[active.current!.i]) learn(view[active.current!.i], prev.duration ? prev.currentTime / prev.duration : 0, (Date.now() - active.current!.start) / 1000);
          active.current = { i, start: Date.now() };
          setIdx(i); setProg(0); setPaused(false);
          v.preload = "auto";
          v.play().catch(() => setPaused(true));
          if (vids[i + 1]) vids[i + 1].preload = "auto";
          if (i >= view.length - 4) more();
        } else if (!v.paused) v.pause();
      }
    }, { root, threshold: 0.65 });
    vids.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [view, more]);

  useEffect(() => { feed.current?.querySelectorAll("video").forEach((v) => { (v as HTMLVideoElement).muted = muted; }); }, [muted]);

  const go = (i: number) => {
    const el = feed.current?.querySelectorAll<HTMLElement>(".rl-slide")[i];
    if (el) feed.current!.scrollTo({ top: el.offsetTop, behavior: "smooth" });
  };
  const cur = () => feed.current?.querySelectorAll("video")[idx] as HTMLVideoElement | undefined;
  const togglePlay = () => { const v = cur(); if (!v) return; if (v.paused) { v.play(); setPaused(false); } else { v.pause(); setPaused(true); } };
  const toggleSound = () => { const m = !muted; setMuted(m); try { localStorage.setItem("tapedog.reelsound", m ? "off" : "on"); } catch {} };
  const share = async (r: Reel) => {
    const url = `${location.origin}/reels?clip=${encodeURIComponent(r.key)}`;
    try {
      if (navigator.share) { await navigator.share({ title: r.title, url }); return; }
      await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input,textarea,select")) return;
      if (e.key === "ArrowDown") { e.preventDefault(); go(Math.min(idx + 1, view.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); go(Math.max(idx - 1, 0)); }
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      if (e.key === "m") toggleSound();
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  });

  return (
    <div className="rl">
      <div className="rl-bar">
        <div className="rl-chips">
          {FILTERS.map(([k, l]) => <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{l}</button>)}
        </div>
        <button className="rl-sound" onClick={toggleSound}>{muted ? "Sound off" : "Sound on"}</button>
      </div>

      <div className="rl-feed" ref={feed}>
        {view.length === 0 && <div className="rl-empty">{items.length ? "No clips in this filter yet." : "Loading clips…"}</div>}
        {view.map((r, i) => (
          <section key={r.key} className="rl-slide" style={{ ["--thumb" as any]: `url(${r.thumb})` }}>
            <div className="rl-ambient" aria-hidden />
            <div className="rl-inner">
              <div className="rl-video">
                <video data-i={i} src={r.mp4} poster={r.thumb} muted={muted} playsInline preload={i < 2 ? "auto" : "none"}
                  onClick={togglePlay}
                  onTimeUpdate={(e) => { if (i === idx) { const v = e.currentTarget; setProg(v.duration ? v.currentTime / v.duration : 0); } }}
                  onEnded={() => (i < view.length - 1 ? go(i + 1) : null)} />
                {i === idx && paused && <button className="rl-play" onClick={togglePlay} aria-label="Play"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></button>}
                <div className="rl-prog"><i style={{ width: `${i === idx ? prog * 100 : 0}%` }} /></div>
              </div>
              <div className="rl-meta">
                <div className="rl-tags">
                  {r.tags.map((t) => <span key={t} className={t === "Upset" ? "up" : ""}>{t}</span>)}
                  <span className="plain">Week {r.week} · {mmss(r.duration)}</span>
                </div>
                <h2>{r.title}</h2>
                <div className="rl-score">
                  {(["away", "home"] as const).map((s) => (
                    <Link key={s} href={`/team/${r[s].id}`} className={r[s].winner ? "w" : ""}>
                      {r[s].logo && <img src={r[s].logo} alt="" />}
                      <span>{r[s].rank ? <em>{r[s].rank}</em> : null}{r[s].short}</span>
                      <b>{r[s].score}</b>
                    </Link>
                  ))}
                </div>
                <div className="rl-actions">
                  <Link href={`/game/${r.gameId}`} className="btn primary">Full recap</Link>
                  <button className="rl-btn" onClick={() => share(r)}>{copied && i === idx ? "Link copied" : "Share"}</button>
                  <SaveButton id={r.gameId} />
                  {r.url && <a className="rl-src" href={r.url} target="_blank" rel="noopener noreferrer">Video: ESPN ↗</a>}
                </div>
              </div>
            </div>
          </section>
        ))}
        {view.length > 0 && week.current >= 1 && <div className="rl-more">Loading older weeks…</div>}
      </div>
    </div>
  );
}
