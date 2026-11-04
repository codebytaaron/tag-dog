"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Fly = { id: string; away: { abbr: string; logo: string; color: string }; home: { abbr: string; logo: string; color: string }; line: string; score: number; tier: string; up: number };
const WORDS = ["worth fading.", "looking ahead.", "on upset alert.", "sleepwalking.", "in a sandwich.", "priced too high."];

export default function Hero({ games, count, week }: { games: Fly[]; count: number; week: number | null }) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const root = useRef<HTMLDivElement>(null);
  const tc = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setPhase("out");
      setTimeout(() => { setI((x) => (x + 1) % WORDS.length); setPhase("in"); }, 420);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = root.current;
    const move = (e: PointerEvent) => {
      el?.style.setProperty("--mx", (e.clientX / innerWidth - 0.5).toFixed(3));
      el?.style.setProperty("--my", (e.clientY / innerHeight - 0.5).toFixed(3));
    };
    addEventListener("pointermove", move);
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const s = (performance.now() - t0) / 1000;
      const p = (n: number) => String(Math.floor(n)).padStart(2, "0");
      if (tc.current) tc.current.textContent = `${p(s / 3600)}:${p((s / 60) % 60)}:${p(s % 60)}:${p((s * 24) % 24)}`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
  }, []);

  const lanes = 6;
  return (
    <section className="hero" ref={root}>
      <div className="sky" aria-hidden>
        {games.map((g, k) => {
          const lane = k % lanes;
          const depth = lane % 3; // 0 far, 1 mid, 2 near
          const dur = [58, 44, 32][depth] + (k % 4) * 3;
          return (
            <div key={g.id + k} className={`lane d${depth} ${lane % 2 ? "rev" : ""}`}
              style={{ top: `${6 + lane * 15}%`, animationDuration: `${dur}s`, animationDelay: `${-((k * 7.3) % dur)}s` }}>
              <div className="fly">
                <img src={g.away.logo} alt="" /><b>{g.away.abbr}</b><i>at</i><b>{g.home.abbr}</b><img src={g.home.logo} alt="" />
                <span className="fl">{g.up}% upset chance</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="vignette" aria-hidden />
      <div className="wrap herocopy">
        <div className="rec mono">WEEK {week ?? "–"} · {count} FBS GAMES</div>
        <h1>
          <span className="l1">Find the favorites</span>
          <span className={`rot ${phase}`} key={i}>
            {WORDS[i].split("").map((ch, k) => <span key={k} className="ch" style={{ animationDelay: `${k * 26}ms` }}>{ch === " " ? " " : ch}</span>)}
          </span>
        </h1>
        <p className="lede">See which college football favorites are most likely to lose this week, and follow every game with live scores, highlights and rankings.</p>
        <div className="ctas">
          <Link href="/board" className="btn primary">Open the Fade Board <span>→</span></Link>
          <Link href="/about" className="btn ghost">How it works</Link>
        </div>
      </div>
      <div className="scrollcue mono" aria-hidden>SCROLL ↓</div>
    </section>
  );
}
