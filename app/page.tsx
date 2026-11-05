import Link from "next/link";
import { getSlate, type Game } from "@/lib/data";
import Kickoff from "@/components/Kickoff";
import Hero from "@/components/Hero";
import { getGameDayId } from "@/lib/gameday";
import { getFutures } from "@/lib/pulse";
import { getEdge } from "@/lib/edge";
import EdgeStat from "@/components/EdgeStat";
import AppNotify from "@/components/AppNotify";

export const revalidate = 900;
export const maxDuration = 60;

const dogOf = (g: Game) => g[g.favorite === "home" ? "away" : "home"];
const favOf = (g: Game) => g[g.favorite];
const rk = (t: { rank: number | null }) => (t.rank ? `No. ${t.rank} ` : "");

/** Compact score tile for the strip across the top of the page. */
function StripGame({ g }: { g: Game }) {
  return (
    <Link href={`/game/${g.id}`} className="fp-sg">
      <span className="fp-sg-when mono"><Kickoff date={g.date} /></span>
      {(["away", "home"] as const).map((s) => (
        <span key={s} className="fp-sg-row">
          {g[s].logo && <img src={g[s].logo} alt="" />}
          <b>{g[s].rank ? <em>{g[s].rank}</em> : null}{g[s].abbr}</b>
          <span className="muted">{g[s].record}</span>
        </span>
      ))}
    </Link>
  );
}

export default async function FrontPage() {
  const s = await getSlate();
  const open = s.games.filter((g) => g.state !== "post");
  const pool = open.length ? open : s.games;
  const fades = [...pool].sort((a, b) => b.score - a.score);
  const lead = fades[0];
  const [gd, fut, edge] = await Promise.all([getGameDayId(s.games), getFutures().catch(() => null), getEdge()]);
  const watch = [...pool].sort((a, b) => (b.id === gd ? 1 : 0) - (a.id === gd ? 1 : 0) || b.watch - a.watch).slice(0, 5);
  const strip = [...pool].sort((a, b) => Date.parse(a.date) - Date.parse(b.date)).slice(0, 14);
  const race = (fut?.title?.markets || []).slice(0, 8);
  const fly = fades.slice(0, 18).map((g) => ({
    id: g.id, line: g.line, score: g.score, tier: g.tier, up: g.upsetPct,
    away: { abbr: g.away.abbr, logo: g.away.logo, color: g.away.color },
    home: { abbr: g.home.abbr, logo: g.home.logo, color: g.home.color },
  }));
  const day = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" });

  return (
    <main className="fp">
      <Hero games={fly} count={s.games.length} week={s.week} />
      <div className="fp-strip" aria-label="Upcoming games">
        <div className="wrap fp-strip-in">
          <span className="fp-strip-label mono">WEEK {s.week ?? "–"}</span>
          {strip.map((g) => <StripGame key={g.id} g={g} />)}
          <Link href="/board?tab=scores" className="fp-sg fp-sg-all">All scores →</Link>
        </div>
      </div>

      <div className="wrap fp-top">
        <p className="fp-date mono">{day.toUpperCase()} · {s.games.length} FBS GAMES THIS WEEK</p>
      </div>

      <div className="wrap fp-grid">
        {lead && (
          <article className="fp-lead">
            <Link href={`/game/${lead.id}`} className="fp-lead-card" style={{ ["--ca" as any]: favOf(lead).color, ["--cb" as any]: dogOf(lead).color }}>
              <span className="fp-kicker mono">UPSET OF THE WEEK</span>
              <h1 className="fp-h1">Can {dogOf(lead).short} take down {rk(favOf(lead))}{favOf(lead).short}?</h1>
              <p className="fp-dek">
                {favOf(lead).short} is {lead.spread != null ? `a ${lead.spread}-point favorite` : "favored"} {lead.favorite === "home" ? "at home" : "on the road"}, but our model puts {dogOf(lead).short}'s chances at <b>{lead.upsetPct}%</b>.
                {lead.factors.find((f) => f.points > 0) ? ` ${lead.factors.find((f) => f.points > 0)!.detail}` : ""}
              </p>
              <div className="fp-match">
                {(["away", "home"] as const).map((sd) => (
                  <div key={sd} className="fp-team">
                    {lead[sd].logo && <img src={lead[sd].logo} alt="" />}
                    <b>{lead[sd].rank ? <em>{lead[sd].rank}</em> : null}{lead[sd].short}</b>
                    <span className="muted">{lead[sd].record}</span>
                  </div>
                ))}
                <div className="fp-meta mono"><Kickoff date={lead.date} long />{lead.network ? ` · ${lead.network}` : ""}</div>
              </div>
              <ul className="fp-factors">
                {lead.factors.filter((f) => f.points > 0).slice(0, 4).map((f) => (
                  <li key={f.key}><span className="fp-pts mono">+{f.points}</span><span><b>{f.label}</b> <span className="muted">{f.detail}</span></span></li>
                ))}
              </ul>
              <span className="fp-more">Read the full breakdown →</span>
            </Link>
          </article>
        )}

        <aside className="fp-rail">
          <section className="fp-box">
            <header className="fp-boxh"><h2>The Fade Board</h2><Link href="/board" className="fp-link">Full board</Link></header>
            <table className="fp-table">
              <thead><tr><th>Matchup</th><th>Line</th><th className="r">Upset</th></tr></thead>
              <tbody>
                {fades.slice(1, 8).map((g) => (
                  <tr key={g.id}>
                    <td><Link href={`/game/${g.id}`}>{dogOf(g).short} <span className="muted">over</span> {rk(favOf(g))}{favOf(g).short}</Link></td>
                    <td className="mono muted">{g.line}</td>
                    <td className={`r mono c-${g.tier.toLowerCase()}`}>{g.upsetPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {edge && <EdgeStat e={edge} />}
        </aside>
      </div>

      <div className="wrap fp-cols">
        <section className="fp-box">
          <header className="fp-boxh"><h2>Games to watch</h2><Link href="/board?tab=scores" className="fp-link">Schedule</Link></header>
          <ol className="fp-list">
            {watch.map((g) => (
              <li key={g.id}>
                <Link href={`/game/${g.id}`}>
                  <span className="fp-logos">{g.away.logo && <img src={g.away.logo} alt="" />}{g.home.logo && <img src={g.home.logo} alt="" />}</span>
                  <span className="fp-li-t"><b>{rk(g.away)}{g.away.short} at {rk(g.home)}{g.home.short}</b><small className="muted">{g.line} · <Kickoff date={g.date} />{g.network ? ` · ${g.network}` : ""}</small></span>
                  {g.id === gd && <span className="fp-tag">GameDay</span>}
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {race.length > 0 && (
          <section className="fp-box">
            <header className="fp-boxh"><h2>National title odds</h2><Link href="/rankings?tab=title" className="fp-link">All odds</Link></header>
            <table className="fp-table">
              <tbody>
                {race.map((m, k) => (
                  <tr key={m.label}>
                    <td className="mono muted fp-n">{k + 1}</td>
                    <td>{m.team ? <Link href={`/team/${m.team.id}`} className="fp-team-cell">{m.team.logo && <img src={m.team.logo} alt="" />}{m.label}</Link> : m.label}</td>
                    <td className="r mono">{Math.round(m.p * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="fp-src">Prices from Kalshi prediction markets.</p>
          </section>
        )}
      </div>

      <div className="wrap fp-cols fp-bottom">
        <section className="fp-box fp-method">
          <h2>How we rate games</h2>
          <p>Every favorite gets a TAPE score from 0 to 99. It starts from the betting line and ESPN's power ratings, then adds points for situations that historically trip favorites up: a big game the following week, a letdown after a big win, travel, short rest and a line moving toward the underdog. Scores of 50 or more are flagged FADE.</p>
          <p className="muted small">Our numbers are estimates, not predictions or betting advice. <Link href="/about" className="fp-link">Full methodology</Link> · <Link href="/record" className="fp-link">Track record</Link></p>
        </section>
        <section className="fp-box fp-app">
          <div>
            <h2>TapeDog for iPhone</h2>
            <p className="muted">Live scores on your Lock Screen, upset alerts and a daily brief. Coming soon to the App Store.</p>
            <div className="fp-app-cta"><AppNotify /><Link href="/app" className="fp-link">Learn more</Link></div>
          </div>
          <img src="/app/home.jpg" alt="TapeDog for iPhone home screen" />
        </section>
      </div>
    </main>
  );
}
