"use client";
import { useState } from "react";

export default function Brief({ id }: { id: string }) {
  const [st, setSt] = useState<"idle" | "loading" | "done">("idle");
  const [b, setB] = useState<any>(null);
  async function roll() {
    setSt("loading");
    try {
      const r = await fetch(`/api/brief/${id}`);
      setB(await r.json());
    } catch (e: any) { setB({ error: String(e) }); }
    setSt("done");
  }
  return (
    <section className="card film">
      <div className="cardh"><h3>AI breakdown</h3><span className="mono muted">SUMMARY OF THIS GAME'S DATA</span></div>
      {st === "idle" && (
        <button className="btn primary wide" onClick={roll}>Generate AI breakdown</button>
      )}
      {st === "loading" && <div className="strip"><i /><i /><i /><i /><i /><span className="mono">Writing breakdown…</span></div>}
      {st === "done" && b?.error && <p className="errtxt">{b.error}</p>}
      {st === "done" && b && !b.error && (
        <div className="brief">
          <div className={`stamp sm t-${b.verdict}`}>{b.verdict}</div>
          <h4>{b.headline}</h4>
          <div className="upset">
            <span className="mono">UPSET CHANCE</span><b className="mono">{b.upsetChance}%</b>
            <div className="bar"><i style={{ width: `${b.upsetChance}%` }} /></div>
          </div>
          <p>{b.take}</p>
          <ol>{(b.why || []).map((w: string, k: number) => <li key={k}>{w}</li>)}</ol>
          <div className="duo">
            <div><span className="mono">THE DOG'S PATH</span><p>{b.dogCase}</p></div>
            <div><span className="mono">X-FACTOR</span><p>{b.xFactor}</p></div>
          </div>
          {b.crowd && <div className="crowd"><span className="mono">WHAT PEOPLE ARE SAYING</span><p>{b.crowd}</p></div>}
          <blockquote>“{b.coachSpeak}”</blockquote>
          <p className="mono muted small ainote">AI-GENERATED FROM TAPEDOG DATA. IT CAN MAKE MISTAKES.</p>
        </div>
      )}
    </section>
  );
}
