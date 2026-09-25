"use client";
import { useEffect, useState } from "react";

const WORDS = ["Fade alerts", "Line-move alerts", "Season tracker", "Every AI breakdown", "Custom red flags", "Sharp-money signals", "Early lines", "Members chat", "Team watchlists", "Weekly fade card", "No ads", "Priority AI"];
type Slot = { cur: number; prev: number | null; k: number };

export default function FeatureLine() {
  const [slots, setSlots] = useState<Slot[]>([0, 1, 2].map((i) => ({ cur: i, prev: null, k: i })));
  useEffect(() => {
    let n = 3, s = 0;
    const t = setInterval(() => {
      const i = [1, 0, 2][s % 3];
      setSlots((p) => p.map((x, j) => (j === i ? { cur: n % WORDS.length, prev: x.cur, k: n } : x)));
      n++; s++;
    }, 1300);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="fline" aria-label="Dog Zone features">
      <div className="frule" />
      {slots.map((x, i) => (
        <div key={i} className={`fslot s${i}`}>
          {x.prev !== null && <span key={`o${x.k}`} className="fword out">{WORDS[x.prev]}</span>}
          <span key={`i${x.k}`} className="fword in">{WORDS[x.cur]}</span>
        </div>
      ))}
    </div>
  );
}
