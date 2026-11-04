import Link from "next/link";
import { getRecord, type Call } from "@/lib/record";
import Kickoff from "@/components/Kickoff";
import EdgeStat from "@/components/EdgeStat";
import { edgeFrom, lab, buckets } from "@/lib/edge";

export const revalidate = 1800;
export const maxDuration = 60;
export const metadata = { title: "Track record | TapeDog" };

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const pc = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");

export default async function RecordPage() {
  const { calls, year } = await getRecord();
  const stats = (l: Call[]) => ({ n: l.length, up: l.filter((c) => c.upset).length, cov: l.filter((c) => c.cover === true).length, graded: l.filter((c) => c.cover !== null).length });
  const all = stats(calls), fade = stats(calls.filter((c) => c.tier === "FADE")), watch = stats(calls.filter((c) => c.tier === "WATCH")), hold = stats(calls.filter((c) => c.tier === "HOLD"));
  const fades = calls.filter((c) => c.tier === "FADE").sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const weeks = [...new Set(calls.map((c) => c.week))].sort((a, b) => b - a);
  const upLift = pct(fade.up, fade.n) - pct(all.up, all.n);

  return (
    <main className="wrap board">
      <div className="eyebrow mono">{year} SEASON · EVERY GAME GRADED</div>
      <h1 className="btitle">Called it</h1>
      <p className="muted rec-lead">TapeDog's track record. Every finished FBS game this season, scored the way TapeDog would have scored it and checked against the final.</p>

      {(() => { const e = edgeFrom(year, calls); return e ? <div className="rec-edge"><EdgeStat e={e} link={false} /></div> : null; })()}

      <div className="rec-hero">
        <div><b>{fade.n}</b><span>Games flagged FADE</span></div>
        <div><b className="c-fade">{pc(fade.up, fade.n)}</b><span>Of FADE favorites lost outright</span><small>All favorites: {pc(all.up, all.n)}{upLift ? ` (${upLift > 0 ? "+" : ""}${upLift} pts)` : ""}</small></div>
        <div><b className="c-tape">{pc(fade.cov, fade.graded)}</b><span>Of FADE underdogs covered</span><small>All underdogs: {pc(all.cov, all.graded)}</small></div>
      </div>

      <section className="card rec-lab">
        <div className="cardh"><h3>Model lab</h3><span className="muted small">Same games, different rules</span></div>
        <div className="rec-row rec-head"><span>Rule</span><span>Games</span><span>Favorite lost</span><span>Dog covered</span></div>
        {lab(calls).map((r) => (
          <div key={r.name} className="rec-row"><span><b>{r.name}</b><small className="muted"> {r.rule}</small></span><span>{r.n}</span><span>{r.n ? `${r.upset}%` : "–"}</span><span>{r.n ? `${r.cover}%` : "–"}</span></div>
        ))}
        <div className="rec-cal">
          <span className="mono muted small">CALIBRATION · DO HIGHER TAPE SCORES LOSE MORE?</span>
          <div className="rec-bars">
            {buckets(calls).map((b) => (
              <div key={b.label} className="rec-bar"><i style={{ height: `${Math.max(4, b.upset)}%` }} /><b>{b.n ? `${b.upset}%` : "–"}</b><small>TAPE {b.label}<br />{b.n} games</small></div>
            ))}
          </div>
        </div>
        <p className="muted small rec-note">Every rule here uses only what was known before kickoff, and every rule runs on the same games, so a change has to win on identical data. Small samples swing a lot: treat anything under 100 games as early evidence, not proof. These are backtests, not live predictions.</p>
      </section>

      <section className="card rec-tiers">
        <div className="cardh"><h3>By tier</h3></div>
        <div className="rec-row rec-head"><span>Tier</span><span>Games</span><span>Favorite lost</span><span>Underdog covered</span></div>
        {([["FADE", fade], ["WATCH", watch], ["HOLD", hold]] as const).map(([t, s]) => (
          <div key={t} className="rec-row"><span className={`c-${t.toLowerCase()}`}><b>{t}</b></span><span>{s.n}</span><span>{pc(s.up, s.n)}</span><span>{pc(s.cov, s.graded)}</span></div>
        ))}
        <p className="muted small rec-note">How it's graded: past games are re-scored with the signals we can rebuild for any week (the AP poll at the time, last and next opponents, rest, travel, and the opening and closing lines). Weather, Kalshi and ESPN FPI are live-only, so they aren't part of past grades. A pick is "covered" if the underdog beat the closing spread; pushes are left out.</p>
      </section>

      <section className="rec-weeks">
        {weeks.map((w) => {
          const s = stats(calls.filter((c) => c.week === w && c.tier === "FADE"));
          return <div key={w} className="rec-wk"><span>Week {w}</span><b>{s.up}-{s.n - s.up}</b><small>{s.n ? `${pc(s.cov, s.graded)} covered` : "No fades"}</small></div>;
        })}
      </section>

      <h2 className="gtitle mono">Every FADE call <span className="muted">{fades.length}</span></h2>
      <div className="rec-list">
        {fades.map((c) => (
          <Link key={c.id} href={`/game/${c.id}`} className="rec-call">
            <span className="rec-wkk">Wk {c.week}</span>
            <span className="rec-logos">{c.fav.logo && <img src={c.fav.logo} alt="" />}{c.dog.logo && <img src={c.dog.logo} alt="" />}</span>
            <span className="rec-txt"><b>Fade {c.fav.short}{c.spread != null ? ` (-${c.spread})` : ""}</b><small className="muted">{c.flags.join(" · ")}</small></span>
            <span className="rec-score">{c.favPts}-{c.dogPts}</span>
            <span className={`rec-res ${c.upset ? "win" : c.cover ? "half" : "miss"}`}>{c.upset ? "Upset" : c.cover ? "Covered" : c.cover === null ? "Push" : "Missed"}</span>
          </Link>
        ))}
        {fades.length === 0 && <div className="empty">No graded FADE calls yet.</div>}
      </div>
    </main>
  );
}
