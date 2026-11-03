"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Reel } from "@/lib/reels";
import SaveButton from "./SaveButton";

export default function Reels({ reels }: { reels: Reel[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [idx, setIdx] = useState(0);

  // Play the clip that is on screen, pause the rest, and warm up the next one.
  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const vids = [...root.querySelectorAll("video")];
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting && e.intersectionRatio > 0.6) {
          v.preload = "auto"; v.play().catch(() => {});
          setIdx(Number(v.dataset.i));
          const next = vids[Number(v.dataset.i) + 1];
          if (next) next.preload = "auto";
        } else v.pause();
      }
    }, { root, threshold: [0, 0.6, 1] });
    vids.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [reels]);

  useEffect(() => {
    box.current?.querySelectorAll("video").forEach((v) => { (v as HTMLVideoElement).muted = muted; });
  }, [muted]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      box.current?.scrollBy({ top: (e.key === "ArrowDown" ? 1 : -1) * box.current.clientHeight, behavior: "smooth" });
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, []);

  if (!reels.length) return <div className="wrap board"><h1 className="btitle">Reels</h1><p className="muted">Highlights show up here once games go final.</p></div>;

  return (
    <div className="reels" ref={box}>
      <div className="rbar">
        <button className="rmute" onClick={() => setMuted(!muted)} aria-label={muted ? "Unmute" : "Mute"}>{muted ? "Tap for sound" : "Sound on"}</button>
        <span className="rcount mono">{idx + 1} / {reels.length}</span>
      </div>
      {reels.map((r, i) => (
        <section key={r.key} className="reel">
          <video data-i={i} src={r.mp4} poster={r.thumb} muted={muted} loop playsInline preload={i < 2 ? "auto" : "none"}
            onClick={(e) => { const v = e.currentTarget; v.paused ? v.play() : v.pause(); }} />
          <div className="rshade" />
          <div className="rinfo">
            <div className="rscore">
              {(["away", "home"] as const).map((s) => (
                <span key={s} className={r[s].winner ? "w" : ""}>
                  {r[s].logo && <img src={r[s].logo} alt="" />}
                  {r[s].rank ? <sup>{r[s].rank}</sup> : null}{r[s].abbr} <b>{r[s].score}</b>
                </span>
              ))}
              <em className="mono">FINAL</em>
            </div>
            <p>{r.title}</p>
            <Link href={`/game/${r.gameId}`} className="btn primary">Full recap →</Link>
          </div>
          <div className="ractions"><SaveButton id={r.gameId} /></div>
        </section>
      ))}
    </div>
  );
}
