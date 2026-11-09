import Link from "next/link";
import { getRecord, getPastRecord, type Call } from "@/lib/record";
import { CANDIDATES } from "@/lib/signals";
import Kickoff from "@/components/Kickoff";
import EdgeStat from "@/components/EdgeStat";
import { edgeFrom, lab, buckets, candidateLab, holdout, compareModels } from "@/lib/edge";
import { getLiveRecord } from "@/lib/forward";

export const revalidate = 1800;
export const maxDuration = 300;
export const metadata = { title: "Track record | TapeDog" };

const pc = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");

export default async function RecordPage() {
  const [{ calls, year }, live, past] = await Promise.all([getRecord(), getLiveRecord(), getPastRecord().catch(() => ({ year: 0, calls: [] as Call[] }))]);
  const models = compareModels(calls, past.calls), ho = holdout(past.calls), cands = candidateLab(calls, past.calls, Object.values(CANDIDATES));
  const sg = (n: number) => `${n > 0 ? "+" : ""}${n}`;
  const lf = live.calls.filter((c) => c.tier === "FADE"), lg = lf.filter((c) => c.cover !== null);
  const stats = (l: Call[]) => ({ n: l.length, up: l.filter((c) => c.upset).length, cov: l.filter((c) => c.cover === true).length, graded: l.filter((c) => c.cover !== null).length });
  const all = stats(calls), fade = stats(calls.filter((c) => c.tier === "FADE")), watch = stats(calls.filter((c) => c.tier === "WATCH")), hold = stats(calls.filter((c) => c.tier === "HOLD"));
  const fades = calls.filter((c) => c.tier === "FADE").sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const weeks = [...new Set(calls.map((c) => c.week))].sort((a, b) => b - a);

  return (
    <main className="wrap board">
      <div className="eyebrow mono">{year} SEASON · EVERY GAME GRADED</div>
      <h1 className="btitle">Called it</h1>
      <p className="muted rec-lead">TapeDog's track record. Every finished FBS game this season, scored the way TapeDog would have scored it and checked against the final.</p>

      {(() => { const e = edgeFrom(year, calls); return e ? <div className="rec-edge"><EdgeStat e={e} link={false} /></div> : null; })()}

      <div className="rec-hero rec-two">
        <div><b>{fade.n}</b><span>Games flagged FADE</span><small>All favorites lost {pc(all.up, all.n)} of the time</small></div>
        <div><b className="c-tape">{pc(fade.cov, fade.graded)}</b><span>Of FADE underdogs covered</span><small>All underdogs: {pc(all.cov, all.graded)}</small></div>
      </div>

      <section className="card rec-live">
        <div className="cardh"><h3>Live record</h3><span className="muted small">Calls saved before kickoff{live.since ? ` since ${new Date(live.since).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}</span></div>
        {lf.length ? (
          <div className="rec-hero">
            <div><b>{lf.length}</b><span>Live FADE calls graded</span></div>
            <div><b className="c-fade">{Math.round(lf.filter((c) => c.upset).length / lf.length * 100)}%</b><span>Favorite lost outright</span></div>
            <div><b className="c-tape">{lg.length ? Math.round(lg.filter((c) => c.cover).length / lg.length * 100) : 0}%</b><span>Underdog covered</span></div>
          </div>
        ) : <p className="muted">Tracking started. Every call is now saved before kickoff and graded after the final, with no way to change it later. The first results show up after this week's games ({live.pending} calls saved so far).</p>}
        <p className="muted small rec-note">This is the honest number: picks frozen before kickoff, never re-scored. The backtest below is for testing ideas.</p>
      </section>

      <section className="card rec-lab">
        <div className="cardh"><h3>Model lab</h3><span className="muted small">Same games, different rules</span></div>
        <div className="rec-row rec-lab5 rec-head"><span>Rule</span><span>Games</span><span>Favorite lost</span><span>Lines expected</span><span>Dog covered</span></div>
        {lab(calls).map((r) => (
          <div key={r.name} className="rec-row rec-lab5"><span><b>{r.name}</b><small className="muted"> {r.rule}</small></span><span>{r.n}</span><span>{r.n ? `${r.upset}%` : "–"}</span><span className="muted">{r.n ? `${r.expected}%` : "–"}</span><span>{r.n ? `${r.cover}%` : "–"}</span></div>
        ))}
        <div className="rec-cal">
          <span className="mono muted small">CALIBRATION · DO HIGHER TAPE SCORES LOSE MORE?</span>
          <div className="rec-bars">
            {buckets(calls).map((b) => (
              <div key={b.label} className="rec-bar"><i style={{ height: `${Math.max(4, b.upset)}%` }} /><b>{b.n ? `${b.upset}%` : "–"}</b><small>TAPE {b.label}<br />{b.n} games · lines {b.expected}%</small></div>
            ))}
          </div>
        </div>
        <p className="muted small rec-note">Every rule here uses only what was known before kickoff, and every rule runs on the same games. The fair test is "favorite lost" against "lines expected" for the same games: beating all favorites isn't enough, because close games get upset more often anyway. We tried several rules on these games, so the best-looking one may simply be lucky. Treat anything under 100 games as early evidence, not proof.</p>
      </section>

      <section className="card rec-lab">
        <div className="cardh"><h3>Model comparison</h3><span className="muted small">FADE calls · favorite lost vs. lines expected</span></div>
        <div className="rec-row rec-lab5 rec-head"><span>Model</span><span>{year} games</span><span>{year}</span><span>{past.year || "Last season"} games</span><span>{past.year || "Last season"}</span></div>
        {models.map((m) => (
          <div key={m.name} className="rec-row rec-lab5">
            <span><b>{m.name}</b><small className="muted"> {m.about}</small></span>
            <span className="muted">{m.cur.n}</span>
            <span>{m.cur.n ? `${m.cur.upset}% vs ${m.cur.expected}%` : "–"}</span>
            <span className="muted">{m.past.n}</span>
            <span>{m.past.n ? `${m.past.upset}% vs ${m.past.expected}%` : "–"}</span>
          </div>
        ))}
        <p className="muted small rec-note">The first number is how often the favorite lost; the second is what the betting lines expected for those same games. A model only helps if the first beats the second in both seasons. "TAPE + travel" is a test version and doesn't change any live call.</p>
      </section>

      {past.calls.length > 0 && (
        <section className="card rec-lab">
          <div className="cardh"><h3>Last season check</h3><span className="muted small">{past.year} · games the model was never tuned on</span></div>
          <div className="rec-row rec-lab5 rec-head"><span>Group</span><span>Games</span><span>Favorite lost</span><span>Lines expected</span><span>Difference</span></div>
          {([["All favorites", ho.all], ["FADE", ho.fade]] as const).map(([n, c]) => (
            <div key={n} className="rec-row rec-lab5"><span><b>{n}</b></span><span>{c.n}</span><span>{c.n ? `${c.upset}%` : "–"}</span><span className="muted">{c.n ? `${c.expected}%` : "–"}</span><span>{c.n ? `${sg(c.diff)} pts` : "–"}</span></div>
          ))}
          <p className="muted small rec-note">Same TAPE rules, run on a full season they weren't built from. If FADE favorites lose more often than the lines expected here too, the edge is less likely to be luck.</p>
        </section>
      )}

      <section className="card rec-lab">
        <div className="cardh"><h3>New signals under test</h3><span className="muted small">Not part of the TAPE score yet</span></div>
        <div className="rec-row rec-lab5 rec-head"><span>Signal</span><span>{year}</span><span>{past.year || "Last season"}</span><span>Games</span><span>Verdict</span></div>
        {cands.map((c) => (
          <div key={c.name} className="rec-row rec-lab5">
            <span><b>{c.name}</b></span>
            <span>{c.cur.n ? `${sg(c.cur.diff)} pts` : "–"}</span>
            <span>{c.past.n ? `${sg(c.past.diff)} pts` : "–"}</span>
            <span className="muted">{c.cur.n} / {c.past.n}</span>
            <span className={c.verdict === "Passes" ? "c-tape" : c.verdict === "Fails" ? "c-fade" : "muted"}>{c.verdict}</span>
          </div>
        ))}
        <p className="muted small rec-note">Each number is how much more often favorites lost in those games than the betting lines expected. A signal only joins the TAPE score if it beats the lines in both seasons on at least 30 games each. Weather is the forecast at kickoff; travel is measured from the favorite's home stadium.</p>
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

      {(() => {
        const t25 = calls.filter((c) => c.note).sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 12);
        return t25.length > 0 && (
          <section className="card rec-why">
            <div className="cardh"><h3>Top 25 games: what we got right and wrong</h3><span className="muted small">Latest {t25.length}</span></div>
            {t25.map((c) => (
              <Link key={c.id} href={`/game/${c.id}`} className="rec-why-i">
                <span className="rec-logos">{c.fav.logo && <img src={c.fav.logo} alt="" />}{c.dog.logo && <img src={c.dog.logo} alt="" />}</span>
                <span className="rec-txt"><b>{c.favRank ? `No. ${c.favRank} ` : ""}{c.fav.short} vs {c.dogRank ? `No. ${c.dogRank} ` : ""}{c.dog.short} <span className="muted">· {c.favPts}-{c.dogPts}</span></b><small>{c.note}</small></span>
                <span className={`hm-tier t-${c.tier}`}>{c.tier}</span>
              </Link>
            ))}
          </section>
        );
      })()}

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
