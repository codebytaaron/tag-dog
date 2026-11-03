"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Reel } from "@/lib/reels";
import SaveButton, { useFollow, useProfile } from "./SaveButton";

type F = "foryou" | "top25" | "upsets" | "close" | "all";
const FILTERS: [F, string][] = [["foryou", "For you"], ["top25", "Top 25"], ["upsets", "Upsets"], ["close", "Close games"], ["all", "All"]];
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

export default function Reels({ reels }: { reels: Reel[] }) {
  const feed = useRef<HTMLDivElement>(null);
  const [f, setF] = useState<F>("foryou");
  const [idx, setIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [prog, setProg] = useState(0);
  const { ids } = useFollow();
  const { profile } = useProfile();

  useEffect(() => { try { setMuted(localStorage.getItem("tapedog.reelsound") !== "on"); } catch {} }, []);

  const list = useMemo(() => {
    const mine = new Set([...ids, profile?.teamId].filter(Boolean) as string[]);
    const has = (r: Reel, t: string) => r.tags.includes(t);
    if (f === "top25") return reels.filter((r) => r.home.rank || r.away.rank);
    if (f === "upsets") return reels.filter((r) => has(r, "Upset"));
    if (f === "close") return reels.filter((r) => has(r, "One-score game") || has(r, "Overtime"));
    if (f === "foryou" && mine.size) {
      const yours = reels.filter((r) => mine.has(r.home.id) || mine.has(r.away.id));
      return [...yours, ...reels.filter((r) => !yours.includes(r))];
    }
    return reels;
  }, [reels, f, ids, profile]);

  const count = (k: F) => k === "top25" ? reels.filter((r) => r.home.rank || r.away.rank).length
    : k === "upsets" ? reels.filter((r) => r.tags.includes("Upset")).length
    : k === "close" ? reels.filter((r) => r.tags.includes("One-score game") || r.tags.includes("Overtime")).length : reels.length;

  // Play the clip on screen, pause the rest, warm up the next one.
  useEffect(() => {
    const root = feed.current;
    if (!root) return;
    root.scrollTo({ top: 0 });
    setIdx(0);
    const vids = [...root.querySelectorAll("video")];
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting && e.intersectionRatio > 0.6) {
          const i = Number(v.dataset.i);
          setIdx(i); setProg(0); setPaused(false);
          v.currentTime = 0; v.preload = "auto"; v.play().catch(() => setPaused(true));
          if (vids[i + 1]) vids[i + 1].preload = "auto";
        } else v.pause();
      }
    }, { root, threshold: [0, 0.6] });
    vids.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [list]);

  useEffect(() => { feed.current?.querySelectorAll("video").forEach((v) => { (v as HTMLVideoElement).muted = muted; }); }, [muted]);

  const go = (i: number) => {
    const el = feed.current?.querySelectorAll<HTMLElement>(".rl-slide")[i];
    if (el) feed.current!.scrollTo({ top: el.offsetTop, behavior: "smooth" });
  };
  const current = () => feed.current?.querySelectorAll("video")[idx] as HTMLVideoElement | undefined;
  const togglePlay = () => { const v = current(); if (!v) return; if (v.paused) { v.play(); setPaused(false); } else { v.pause(); setPaused(true); } };
  const toggleSound = () => { const m = !muted; setMuted(m); try { localStorage.setItem("tapedog.reelsound", m ? "off" : "on"); } catch {} };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input,textarea")) return;
      if (e.key === "ArrowDown") { e.preventDefault(); go(Math.min(idx + 1, list.length - 1)); }
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
          {FILTERS.map(([k, l]) => (
            <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)} disabled={k !== "foryou" && k !== "all" && count(k) === 0}>
              {l}{k !== "foryou" && <span>{count(k)}</span>}
            </button>
          ))}
        </div>
        <span className="rl-count">{list.length ? `${idx + 1} of ${list.length}` : ""}</span>
      </div>

      <div className="rl-feed" ref={feed}>
        {list.length === 0 && <div className="rl-empty">No clips here yet. Highlights appear as games go final.</div>}
        {list.map((r, i) => (
          <section key={r.key} className="rl-slide" style={{ ["--thumb" as any]: `url(${r.thumb})` }}>
            <div className="rl-ambient" aria-hidden />
            <div className="rl-inner">
              <div className="rl-video">
                <video data-i={i} src={r.mp4} poster={r.thumb} muted={muted} playsInline preload={i < 2 ? "auto" : "none"}
                  onClick={togglePlay}
                  onTimeUpdate={(e) => { if (i === idx) { const v = e.currentTarget; setProg(v.duration ? v.currentTime / v.duration : 0); } }}
                  onEnded={() => (i < list.length - 1 ? go(i + 1) : null)} />
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
                  <button className="rl-btn" onClick={toggleSound}>{muted ? "Sound off" : "Sound on"}</button>
                  <SaveButton id={r.gameId} />
                  {r.url && <a className="rl-src" href={r.url} target="_blank" rel="noopener noreferrer">Video: ESPN ↗</a>}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
