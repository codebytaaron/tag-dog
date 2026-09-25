"use client";
import { useEffect, useMemo, useState } from "react";

type Brief = { headline: string; verdict: string; upsetChance: number; take: string; why: string[]; xFactor: string; coachSpeak: string; error?: string };

const tierColor: Record<string, string> = { TRAP: "var(--trap)", WATCH: "var(--watch)", SAFE: "var(--safe)" };

function Ring({ score, tier, size = 58 }: { score: number; tier: string; size?: number }) {
  const r = size / 2 - 5, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="ring">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line)" strokeWidth="5" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={tierColor[tier]} strokeWidth="5" fill="none"
        strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" className="ringtxt">{score}</text>
    </svg>
  );
}

function TeamRow({ t, fav }: { t: any; fav: boolean }) {
  return (
    <div className="team">
      {t.logo ? <img src={t.logo} alt="" /> : <span className="dot" style={{ background: t.color }} />}
      <span className="tname">{t.rank && <b className="rk">{t.rank}</b>}{t.short}</span>
      <span className="rec">{t.record}</span>
      {fav && <span className="favtag">FAV</span>}
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState<"ALL" | "TRAP" | "WATCH" | "RANKED">("ALL");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<any>(null);
  const [brief, setBrief] = useState<Record<string, Brief | "loading">>({});

  useEffect(() => {
    fetch("/api/radar").then(r => r.json()).then(d => d.error ? setErr(d.error) : setData(d)).catch(e => setErr(String(e)));
  }, []);

  const games = useMemo(() => (data?.games || []).filter((g: any) => {
    if (filter === "TRAP" && g.tier !== "TRAP") return false;
    if (filter === "WATCH" && g.tier === "SAFE") return false;
    if (filter === "RANKED" && !g[g.favorite].rank) return false;
    if (q && !`${g.home.name} ${g.away.name}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [data, filter, q]);

  const counts = useMemo(() => {
    const c = { TRAP: 0, WATCH: 0, SAFE: 0 };
    (data?.games || []).forEach((g: any) => c[g.tier]++);
    return c;
  }, [data]);

  async function ask(g: any) {
    setBrief(b => ({ ...b, [g.id]: "loading" }));
    const r = await fetch("/api/brief", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(g) });
    const d = await r.json();
    setBrief(b => ({ ...b, [g.id]: d }));
  }

  const b = sel ? brief[sel.id] : undefined;

  return (
    <main>
      <header className="hero">
        <div className="brand"><span className="pulse" /> TRAP GAME RADAR</div>
        <h1>Which favorites are about to<br /><span className="grad">get got</span> this Saturday?</h1>
        <p className="sub">Every FBS game scored for look-ahead spots, letdowns, travel, rest, weather and line value — then AI writes the scouting brief.</p>
        {data && (
          <div className="stats">
            <div><b>{data.season}</b><span>Season</span></div>
            <div><b>Wk {data.week}</b><span>Slate</span></div>
            <div><b style={{ color: "var(--trap)" }}>{counts.TRAP}</b><span>Traps</span></div>
            <div><b style={{ color: "var(--watch)" }}>{counts.WATCH}</b><span>Watch</span></div>
            <div><b>{data.games.length}</b><span>Games</span></div>
          </div>
        )}
      </header>

      <div className="toolbar">
        <div className="seg">
          {(["ALL", "TRAP", "WATCH", "RANKED"] as const).map(f => (
            <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
              {f === "RANKED" ? "Ranked favs" : f === "WATCH" ? "Watch+" : f[0] + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <input placeholder="Search a team…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {err && <div className="err">Couldn't load the slate: {err}</div>}
      {!data && !err && (
        <div className="grid">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="card skel" />)}</div>
      )}

      <div className="grid">
        {games.map((g: any) => (
          <button key={g.id} className={`card ${sel?.id === g.id ? "active" : ""}`} onClick={() => setSel(g)}
            style={{ ["--accent" as any]: g[g.favorite].color }}>
            <div className="cardtop">
              <div>
                <TeamRow t={g.away} fav={g.favorite === "away"} />
                <TeamRow t={g.home} fav={g.favorite === "home"} />
              </div>
              <Ring score={g.score} tier={g.tier} />
            </div>
            <div className="meta">
              <span className="tier" style={{ color: tierColor[g.tier], borderColor: tierColor[g.tier] }}>{g.tier}</span>
              <span>{g.line || "No line"}</span>
              <span>{new Date(g.date).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}</span>
            </div>
            <div className="chips">
              {g.factors.filter((f: any) => f.points > 0).slice(0, 3).map((f: any) => <span key={f.key} className="chip">{f.label}</span>)}
            </div>
          </button>
        ))}
      </div>
      {data && games.length === 0 && <div className="empty">No games match that filter.</div>}

      {sel && (
        <div className="scrim" onClick={() => setSel(null)}>
          <aside className="panel" onClick={e => e.stopPropagation()} style={{ ["--accent" as any]: sel[sel.favorite].color }}>
            <button className="x" onClick={() => setSel(null)}>×</button>
            <div className="ptop">
              <Ring score={sel.score} tier={sel.tier} size={84} />
              <div>
                <div className="tier big" style={{ color: tierColor[sel.tier], borderColor: tierColor[sel.tier] }}>{sel.tier}</div>
                <h2>{sel.away.short} @ {sel.home.short}</h2>
                <p className="muted">{sel.venue.name}{sel.venue.city && ` · ${sel.venue.city}, ${sel.venue.state}`}{sel.network && ` · ${sel.network}`}</p>
              </div>
            </div>

            <div className="kv">
              <div><span>Line</span><b>{sel.line || "—"}</b></div>
              <div><span>Weather</span><b>{sel.weather?.summary || (sel.venue.indoor ? "Dome" : "—")}</b></div>
              <div><span>Fav last wk</span><b>{sel.favPrev || "—"}</b></div>
              <div><span>Fav next wk</span><b>{sel.favNext || "—"}</b></div>
            </div>

            <h3>Why the radar pinged</h3>
            {sel.factors.length === 0 && <p className="muted">Nothing situational. Clean spot for the favorite.</p>}
            <ul className="factors">
              {sel.factors.map((f: any) => (
                <li key={f.key}>
                  <div className="fhead"><b>{f.label}</b><span className={f.points < 0 ? "neg" : "pos"}>{f.points > 0 ? "+" : ""}{f.points}</span></div>
                  <div className="bar"><i style={{ width: `${Math.min(100, Math.abs(f.points) * 4)}%`, background: f.points < 0 ? "var(--safe)" : tierColor[sel.tier] }} /></div>
                  <p>{f.detail}</p>
                </li>
              ))}
            </ul>

            <div className="ai">
              <div className="aihead"><span className="spark">✦</span> AI scouting brief</div>
              {!b && <button className="cta" onClick={() => ask(sel)}>Generate brief</button>}
              {b === "loading" && <div className="thinking"><i /><i /><i /> Watching film…</div>}
              {b && b !== "loading" && (b.error ? <p className="err">{b.error}</p> : (
                <div className="brief">
                  <h4>{b.headline}</h4>
                  <div className="upset"><span>Upset chance</span><b>{b.upsetChance}%</b>
                    <div className="bar"><i style={{ width: `${b.upsetChance}%`, background: tierColor[b.verdict] || "var(--watch)" }} /></div></div>
                  <p>{b.take}</p>
                  <ul>{b.why?.map((w, i) => <li key={i}>{w}</li>)}</ul>
                  <p><b>X-factor:</b> {b.xFactor}</p>
                  <blockquote>“{b.coachSpeak}”</blockquote>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      <footer>Data: ESPN · Open-Meteo · Analysis: Gemini. Not betting advice — just vibes with receipts.</footer>
    </main>
  );
}
