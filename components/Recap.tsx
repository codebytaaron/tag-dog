import Link from "next/link";
import type { Recap as R } from "@/lib/recap";
import Highlights from "./Highlights";
import Kickoff from "./Kickoff";

function WPChart({ r }: { r: R }) {
  const W = 800, H = 200;
  const pts = r.wp.map((p) => `${(p.x * W).toFixed(1)},${((1 - p.home) * H).toFixed(1)}`).join(" ");
  const area = `0,${H / 2} ${pts} ${W},${H / 2}`;
  const start = Math.round((r.wp[0]?.home ?? 0.5) * 100);
  return (
    <div className="wpwrap">
      <div className="wplab top mono" style={{ color: r.home.color }}>{r.home.abbr} WINNING</div>
      <div className="wplab bot mono" style={{ color: r.away.color }}>{r.away.abbr} WINNING</div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="wpc" aria-label="Win probability over the game">
        <defs>
          <clipPath id="wtop"><rect x="0" y="0" width={W} height={H / 2} /></clipPath>
          <clipPath id="wbot"><rect x="0" y={H / 2} width={W} height={H / 2} /></clipPath>
        </defs>
        <line x1="0" x2={W} y1={H / 2} y2={H / 2} className="wmid" />
        {r.quarters.map((q) => <line key={q.x} x1={q.x * W} x2={q.x * W} y1="0" y2={H} className="wq" />)}
        <polygon points={area} fill={r.home.color} opacity=".16" clipPath="url(#wtop)" />
        <polygon points={area} fill={r.away.color} opacity=".16" clipPath="url(#wbot)" />
        <polyline points={pts} fill="none" stroke={r.home.color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" clipPath="url(#wtop)" />
        <polyline points={pts} fill="none" stroke={r.away.color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" clipPath="url(#wbot)" />
      </svg>
      <div className="wpq mono">
        <span style={{ left: 0 }}>KICK</span>
        {r.quarters.map((q) => <span key={q.x} style={{ left: `${q.x * 100}%` }}>{q.label}</span>)}
        <span style={{ right: 0 }}>{r.state === "post" ? "FINAL" : "NOW"}</span>
      </div>
      <p className="mono muted small wpnote">KICKOFF: {start >= 50 ? `${r.home.abbr} ${start}%` : `${r.away.abbr} ${100 - start}%`} · BIGGEST SINGLE-PLAY SWING: {r.swing} PTS</p>
    </div>
  );
}

function num(v: string) {
  if (/^\d+:\d+$/.test(v)) { const [m, s] = v.split(":").map(Number); return m + s / 60; }
  if (/^\d+-\d+$/.test(v)) return null;
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
}

export default function Recap({ r }: { r: R }) {
  const yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${r.away.name} vs ${r.home.name} ${new Date(r.date).getFullYear()} highlights`)}`;
  const byQ = r.scoring.reduce<Record<string, R["scoring"]>>((m, s) => { (m[s.q] ||= []).push(s); return m; }, {});
  const lower = new Set(["Turnovers", "Penalties"]);
  return (
    <div className="recap">
      <div className={`rbanner ${r.state}`}>
        <span className="mono">{r.state === "post" ? "FINAL" : <><span className="dotrec" /> LIVE · {r.detail}</>}</span>
        <b>{r.away.short} {r.away.score ?? 0}, {r.home.short} {r.home.score ?? 0}</b>
        {r.upset && <em className="upset-tag mono">UPSET</em>}
        {r.ats && <span className="mono muted">{r.ats}</span>}
        {r.line && <span className="mono muted">CLOSED {r.line}</span>}
      </div>

      <div className="rgrid">
        <div className="col">
          {(r.videos.length > 0 || r.state === "post") && (
            <section className="card">
              <div className="cardh"><h3>Highlights</h3><span className="mono muted">{r.videos.length ? `${r.videos.length} CLIPS · ESPN` : "YOUTUBE"}</span></div>
              <Highlights videos={r.videos} fallback={yt} />
            </section>
          )}
          {r.wp.length > 5 && (
            <section className="card">
              <div className="cardh"><h3>Win probability</h3><span className="mono muted">EVERY PLAY · ESPN MODEL</span></div>
              <WPChart r={r} />
            </section>
          )}
          {r.scoring.length > 0 && (
            <section className="card">
              <div className="cardh"><h3>Scoring plays</h3><span className="mono muted">{r.scoring.length} SCORES</span></div>
              {Object.entries(byQ).map(([q, list]) => (
                <div key={q} className="sq">
                  <span className="mono sqh">{q}</span>
                  {list.map((s, k) => (
                    <div key={k} className="sp">
                      {s.logo && <img src={s.logo} alt="" />}
                      <div><b>{s.type}</b><p>{s.text}</p></div>
                      <span className="mono spsc">{s.clock}<br /><b>{s.away}-{s.home}</b></span>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          )}
        </div>
        <div className="col">
          {r.article && (
            <section className="card">
              <div className="cardh"><h3>What happened</h3><span className="mono muted">ESPN RECAP</span></div>
              <h4 className="arth">{r.article.headline}</h4>
              <p className="artp">{r.article.text}</p>
              {r.article.url && <a href={r.article.url} target="_blank" rel="noreferrer" className="mono c-tape small">READ THE FULL STORY →</a>}
            </section>
          )}
          {r.leaders.length > 0 && (
            <section className="card">
              <div className="cardh"><h3>Top performers</h3></div>
              <div className="leaders">
                {(["away", "home"] as const).map((side) => (
                  <div key={side}>
                    <div className="mono lh" style={{ color: r[side].color }}>{r[side].abbr}</div>
                    {r.leaders.filter((l) => l.side === side).map((l) => (
                      <div key={l.cat} className="ld"><span className="mono muted">{l.cat.replace(/ yards/i, "").toUpperCase()}</span><b>{l.name}</b><small>{l.value}</small></div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}
          {r.stats.length > 0 && (
            <section className="card">
              <div className="cardh"><h3>Team stats</h3><span className="mono muted">{r.away.abbr} · {r.home.abbr}</span></div>
              <div className="tstats">
                {r.stats.map((s) => {
                  const a = num(s.away), h = num(s.home);
                  const tot = a != null && h != null ? a + h : 0;
                  const aw = tot ? (a! / tot) * 100 : 50;
                  const better = a != null && h != null && a !== h ? ((lower.has(s.label) ? a < h : a > h) ? "away" : "home") : null;
                  return (
                    <div key={s.label} className="ts">
                      <b className={better === "away" ? "hi" : ""}>{s.away}</b>
                      <div><span className="mono">{s.label.toUpperCase()}</span>{tot > 0 && <div className="tsbar"><i style={{ width: `${aw}%`, background: r.away.color }} /><i style={{ width: `${100 - aw}%`, background: r.home.color }} /></div>}</div>
                      <b className={better === "home" ? "hi" : ""}>{s.home}</b>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {r.attendance ? <p className="mono muted small">{r.venue.toUpperCase()} · ATTENDANCE {r.attendance.toLocaleString()}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function StandaloneGame({ r }: { r: R }) {
  const T = ({ t, right }: { t: R["home"]; right?: boolean }) => (
    <div className={`gteam ${right ? "r" : ""}`}>
      {!right && t.logo && <img src={t.logo} alt="" />}
      <div><span className="mono muted">{t.rank ? `#${t.rank} · ` : ""}{t.record}</span><h2><Link href={`/team/${t.id}`} className="tlink">{t.short}</Link></h2></div>
      {right && t.logo && <img src={t.logo} alt="" />}
    </div>
  );
  return (
    <main className="game">
      <section className="ghero" style={{ ["--ca" as any]: r.away.color, ["--ch" as any]: r.home.color }}>
        <div className="wrap">
          <Link href="/board" className="back mono">← FADE BOARD</Link>
          <div className="gtop">
            <T t={r.away} />
            <div className="gmid">
              {r.state === "pre" ? <div className="bigvs">VS</div> : (
                <div className="bigscore"><b className={r.away.winner ? "w" : ""}>{r.away.score}</b><span>–</span><b className={r.home.winner ? "w" : ""}>{r.home.score}</b></div>
              )}
              <span className="mono muted">{r.detail}</span>
            </div>
            <T t={r.home} right />
          </div>
          <div className="gmeta mono">
            <span><Kickoff date={r.date} long /></span>
            {r.venue && <span>{r.venue}</span>}
            {r.line && <span>{r.line}</span>}
          </div>
        </div>
      </section>
      <div className="wrap">
        {r.state === "pre" ? (
          <section className="card preview">
            <h3>Coming up</h3>
            <p className="muted">The full TapeDog breakdown (Tape Score, odds by sportsbook, fan buzz and AI breakdown) opens during game week.</p>
            <Link href={`/team/${r.home.id}`} className="btn ghost">{r.home.short} schedule →</Link>
          </section>
        ) : <Recap r={r} />}
      </div>
    </main>
  );
}
