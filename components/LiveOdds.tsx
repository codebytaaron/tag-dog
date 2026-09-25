"use client";
import { useEffect, useRef, useState } from "react";

type Book = { book: string; spreadHome: number | null; total: number | null; mlHome: number | null; mlAway: number | null };
type T = { abbr: string; short: string; color: string };
type Side = "home" | "away";
export type Odds = {
  books: Book[]; openH: number | null; consH: number | null; total: number | null; ml: [number | null, number | null];
  kalshi: { home: number; away: number; volume: number } | null; bets: number; at: string; history?: { t: number; p: number }[];
};

const imp = (m: number | null) => (m == null ? null : m < 0 ? -m / (-m + 100) : 100 / (m + 100));
const fs = (n: number | null) => (n == null ? "–" : n === 0 ? "PK" : (n > 0 ? "+" : "") + n);
const fm = (n: number | null) => (n == null ? "–" : (n > 0 ? "+" : "") + n);

function Spark({ pts, color }: { pts: number[]; color: string }) {
  if (pts.length < 2) return null;
  const W = 600, H = 90;
  const lo = Math.max(0, Math.min(...pts) - 0.04), hi = Math.min(1, Math.max(...pts) + 0.04);
  const y = (p: number) => H - ((p - lo) / (hi - lo || 1)) * H;
  const line = pts.map((p, i) => `${((i / (pts.length - 1)) * W).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="spark">
      <polygon points={`0,${H} ${line} ${W},${H}`} fill={color} opacity=".14" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function LiveOdds({ id, fav, away, home, fpi, fallbackBookFav, initial }: {
  id: string; fav: Side; away: T; home: T; fpi: { home: number; away: number } | null; fallbackBookFav: number | null; initial: Odds;
}) {
  const [o, setO] = useState<Odds>(initial);
  const [ago, setAgo] = useState(0);
  const [pulse, setPulse] = useState(false);
  const firstK = useRef<number | null>(null);

  useEffect(() => {
    const load = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch(`/api/odds/${id}`, { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        if (d.error) return;
        setO(d); setAgo(0); setPulse(true); setTimeout(() => setPulse(false), 900);
      } catch {}
    };
    load();
    const t = setInterval(load, 30000), a = setInterval(() => setAgo((x) => x + 1), 1000);
    return () => { clearInterval(t); clearInterval(a); };
  }, [id]);

  const dogSide: Side = fav === "home" ? "away" : "home";
  const F = fav === "home" ? home : away, D = fav === "home" ? away : home;
  const favML = fav === "home" ? o.ml[0] : o.ml[1], dogML = fav === "home" ? o.ml[1] : o.ml[0];
  const pf = imp(favML), pd = imp(dogML);
  const bookFav = pf != null && pd != null ? pf / (pf + pd) : fallbackBookFav;
  const hist = (o.history || []).map((h) => (fav === "home" ? h.p : 1 - h.p));
  const kFav = o.kalshi ? o.kalshi[fav] : null;
  if (kFav != null && firstK.current == null) firstK.current = hist[0] ?? kFav;
  const move = kFav != null && firstK.current != null ? Math.round((kFav - firstK.current) * 100) : 0;

  const rows = o.books.map((b) => {
    const favSpread = b.spreadHome == null ? null : fav === "home" ? b.spreadHome : -b.spreadHome;
    return { book: b.book, dogSpread: favSpread == null ? null : -favSpread, total: b.total, favML: fav === "home" ? b.mlHome : b.mlAway, dogML: fav === "home" ? b.mlAway : b.mlHome };
  });
  const bestS = Math.max(...rows.map((r) => r.dogSpread ?? -99)), bestM = Math.max(...rows.map((r) => r.dogML ?? -9999));
  const toFav = (h: number | null) => (h == null ? null : fav === "home" ? h : -h);
  const openF = toFav(o.openH), nowF = toFav(o.consH);
  const probs = [
    { l: "Sportsbooks", v: bookFav },
    { l: "Kalshi", v: kFav },
    { l: "ESPN FPI", v: fpi ? fpi[fav] / 100 : null },
  ];

  return (
    <section className="card liveodds">
      <div className="cardh">
        <h3>Live odds</h3>
        <span className={`mono upd ${pulse ? "flash" : ""}`}><i />UPDATED {ago < 5 ? "JUST NOW" : `${ago}S AGO`}</span>
      </div>

      <div className="lotop">
        <div className="kal">
          <div className="kalh mono"><span>KALSHI MARKET</span>{o.kalshi && <span className="muted">${Math.round(o.kalshi.volume).toLocaleString()} TRADED</span>}</div>
          {o.kalshi ? (
            <>
              <div className="kalrow">
                <div><b style={{ color: away.color }}>{Math.round(o.kalshi.away * 100)}%</b><span>{away.short}</span></div>
                <div className="r"><b style={{ color: home.color }}>{Math.round(o.kalshi.home * 100)}%</b><span>{home.short}</span></div>
              </div>
              <div className="kalbar"><i style={{ width: `${o.kalshi.away * 100}%`, background: away.color }} /><i style={{ width: `${o.kalshi.home * 100}%`, background: home.color }} /></div>
              {hist.length > 1 && <Spark pts={hist} color={F.color} />}
              <p className="mono muted small">{F.abbr} WIN CHANCE {hist.length > 1 ? "· LAST 5 DAYS" : ""}{move !== 0 && <span className={move < 0 ? "c-fade" : "c-ok"}> · {move > 0 ? "▲" : "▼"} {Math.abs(move)} PTS</span>}</p>
            </>
          ) : <p className="muted">No prediction market for this game yet.</p>}
        </div>

        <div className="probs2">
          <div className="mono muted small">{F.short.toUpperCase()} TO WIN, BY SOURCE</div>
          {probs.map((p) => (
            <div key={p.l} className="pr">
              <span>{p.l}</span>
              <div className="bar"><i style={{ width: `${(p.v ?? 0) * 100}%`, background: F.color }} /></div>
              <b className="mono">{p.v != null ? `${Math.round(p.v * 100)}%` : "–"}</b>
            </div>
          ))}
          {openF != null && nowF != null && (
            <div className="move2 mono">
              <span>OPEN <b>{F.abbr} {fs(openF)}</b></span><span className="muted">→</span><span>NOW <b>{F.abbr} {fs(nowF)}</b></span>
              <em className={nowF > openF ? "c-fade" : nowF < openF ? "c-ok" : "muted"}>{nowF > openF ? "moving to the dog" : nowF < openF ? "moving to the fav" : "steady"}</em>
            </div>
          )}
          {o.bets > 0 && <p className="mono muted small">{o.bets.toLocaleString()} BETS TRACKED</p>}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="shop2">
          <div className="sh2 mono"><span>SPORTSBOOK</span><span>{D.abbr} SPREAD</span><span>{D.abbr} ML</span><span>{F.abbr} ML</span><span>TOTAL</span></div>
          {rows.map((r) => (
            <div key={r.book} className="sr2">
              <span>{r.book}</span>
              <span className={`mono ${r.dogSpread === bestS ? "best" : ""}`}>{fs(r.dogSpread)}</span>
              <span className={`mono ${r.dogML === bestM ? "best" : ""}`}>{fm(r.dogML)}</span>
              <span className="mono">{fm(r.favML)}</span>
              <span className="mono">{r.total ?? "–"}</span>
            </div>
          ))}
          <p className="mono muted small">HIGHLIGHTED = BEST PRICE ON {D.short.toUpperCase()}</p>
        </div>
      )}
    </section>
  );
}
