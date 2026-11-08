import Link from "next/link";
import { getSlate, type Game } from "@/lib/data";
import { getLive, type Live } from "@/lib/live";
import Kickoff from "@/components/Kickoff";
import Hero from "@/components/Hero";
import { getFutures } from "@/lib/pulse";
import AppNotify from "@/components/AppNotify";
import LegalNote from "@/components/LegalNote";
import { getEdge } from "@/lib/edge";
import { getRecord } from "@/lib/record";

export const revalidate = 120;
export const maxDuration = 60;

const dogOf = (g: Game) => g[g.favorite === "home" ? "away" : "home"];
const favOf = (g: Game) => g[g.favorite];

function Logo({ src, size = 28 }: { src?: string; size?: number }) {
  return src ? <img src={src} alt="" width={size} height={size} className="hm-logo" /> : <span className="hm-logo" style={{ width: size, height: size }} />;
}

/** App-style score card. */
function ScoreCard({ g, lv }: { g: Game; lv?: Live }) {
  const st = lv?.state ?? g.state;
  const row = (s: "home" | "away") => {
    const t = g[s], sc = lv?.[s], other = lv?.[s === "home" ? "away" : "home"];
    const lost = st === "post" && sc != null && other != null && sc < other;
    return (
      <div className={`hm-row ${lost ? "dim" : ""}`}>
        <Logo src={t.logo} size={24} />
        <span className="hm-name">{t.rank ? <em>{t.rank}</em> : null}{t.short}</span>
        {st !== "pre" && sc != null ? <b className="hm-pts">{sc}</b> : <span className="hm-rec">{t.record}</span>}
      </div>
    );
  };
  return (
    <Link href={`/game/${g.id}`} className={`hm-card ${st}`}>
      <div className="hm-card-top">
        {st === "in" ? <span className="hm-live"><i />{lv?.detail}</span> : st === "post" ? <span>Final</span> : <span><Kickoff date={g.date} /></span>}
        <span className="hm-dim">{g.network || ""}</span>
      </div>
      {row("away")}{row("home")}
      {st === "pre" && g.spread != null && (
        <div className="hm-card-foot"><span>{g.line}</span>{g.tier !== "HOLD" && <b className={`c-${g.tier.toLowerCase()}`}>{g.upsetPct}% upset</b>}</div>
      )}
    </Link>
  );
}

/** The app's "top upset spot" card. */
function SpotCard({ g, i }: { g: Game; i: number }) {
  const dog = dogOf(g), fav = favOf(g), why = g.factors.filter((f) => f.points > 0).slice(0, 2);
  return (
    <Link href={`/game/${g.id}`} className="hm-spot" style={{ ["--cf" as any]: fav.color, ["--cd" as any]: dog.color }}>
      <div className="hm-spot-top"><span>{i === 0 ? "Upset of the week" : `Upset spot #${i + 1}`}</span><span className={`hm-tier t-${g.tier}`}>{g.tier}</span></div>
      <div className="hm-spot-logos"><Logo src={dog.logo} size={44} /><span>over</span><Logo src={fav.logo} size={44} /></div>
      <h3>{dog.short} over {fav.rank ? `No. ${fav.rank} ` : ""}{fav.short}</h3>
      <p className="hm-dim">{g.line} · <Kickoff date={g.date} />{g.network ? ` · ${g.network}` : ""}</p>
      <div className="hm-spot-pct"><b>{g.upsetPct}%</b><span>upset chance</span></div>
      <i className="hm-meter"><u style={{ width: `${g.upsetPct}%` }} /></i>
      {why.length > 0 && <p className="hm-why">{why.map((f) => f.label).join(" · ")}</p>}
    </Link>
  );
}

export default async function Home() {
  const [s, live, fut, edge, rec] = await Promise.all([
    getSlate(), getLive().catch(() => ({} as Record<string, Live>)), getFutures().catch(() => null),
    getEdge(), getRecord().catch(() => null),
  ]);
  // A real example for "Inside a TAPE score": this week's top spot, or our most recent FADE call that hit.
  const lastHit = rec?.calls.filter((c) => c.tier === "FADE" && c.upset).sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0];
  const stateOf = (g: Game) => live[g.id]?.state ?? g.state;
  const now = s.games.filter((g) => stateOf(g) === "in");
  // Only games that haven't kicked off and have a real betting line count as upset spots.
  const ahead = s.games.filter((g) => stateOf(g) === "pre" && g.spread != null);
  const spots = [...ahead].sort((a, b) => b.score - a.score).slice(0, 3);
  const board = [...ahead].sort((a, b) => b.score - a.score).slice(3, 11);
  const finals = s.games.filter((g) => stateOf(g) === "post");
  const upsets = finals.filter((g) => {
    const lv = live[g.id]; if (!lv || lv.home == null || lv.away == null) return false;
    const fav = g.favorite === "home" ? lv.home : lv.away, dog = g.favorite === "home" ? lv.away : lv.home;
    return dog > fav && g.spread != null;
  });
  const weekDone = !now.length && !ahead.length;
  const race = (fut?.title?.markets || []).slice(0, 6);
  const fly = (ahead.length ? spots.concat(board) : []).map((g) => ({
    id: g.id, line: g.line, score: g.score, tier: g.tier, up: g.upsetPct,
    away: { abbr: g.away.abbr, logo: g.away.logo, color: g.away.color },
    home: { abbr: g.home.abbr, logo: g.home.logo, color: g.home.color },
  }));

  return (
    <main className="hm">
      <Hero games={fly} count={s.games.length} week={s.week} />

      <div className="wrap hm-body">
        {now.length > 0 && (
          <section>
            <header className="hm-h"><h2><i className="hm-dot" />Live now</h2><Link href="/board?tab=scores">All scores</Link></header>
            <div className="hm-grid">{now.slice(0, 6).map((g) => <ScoreCard key={g.id} g={g} lv={live[g.id]} />)}</div>
          </section>
        )}

        {spots.length > 0 && (
          <section>
            <header className="hm-h"><h2>Top upset spots</h2><Link href="/board">Full board</Link></header>
            <div className="hm-spots">{spots.map((g, i) => <SpotCard key={g.id} g={g} i={i} />)}</div>
          </section>
        )}

        {board.length > 0 && (
          <section>
            <header className="hm-h"><h2>More on the board</h2></header>
            <div className="hm-list">
              {board.map((g) => (
                <Link key={g.id} href={`/game/${g.id}`} className="hm-li">
                  <Logo src={dogOf(g).logo} size={26} />
                  <span className="hm-li-t"><b>{dogOf(g).short} over {favOf(g).rank ? `No. ${favOf(g).rank} ` : ""}{favOf(g).short}</b><small><Kickoff date={g.date} /> · {g.line}</small></span>
                  <b className={`hm-li-p c-${g.tier.toLowerCase()}`}>{g.upsetPct}%</b>
                </Link>
              ))}
            </div>
          </section>
        )}

        {weekDone && (
          <section>
            <header className="hm-h"><h2>Week {s.week} is in the books</h2><Link href="/record">Our record</Link></header>
            <p className="hm-note">Next week's games and upset odds show up here as soon as the sportsbooks post lines, usually by Sunday night.</p>
            {upsets.length > 0 && (
              <>
                <h3 className="hm-sub">Upsets this week</h3>
                <div className="hm-grid">{upsets.slice(0, 6).map((g) => <ScoreCard key={g.id} g={g} lv={live[g.id]} />)}</div>
              </>
            )}
          </section>
        )}

        {race.length > 0 && (
          <section>
            <header className="hm-h"><h2>National title odds</h2><Link href="/rankings?tab=title">All odds</Link></header>
            <div className="hm-race">
              {race.map((m, k) => (
                <Link key={m.label} href={m.team ? `/team/${m.team.id}` : "/rankings?tab=title"} className="hm-race-i">
                  <span className="hm-dim">{k + 1}</span><Logo src={m.team?.logo} size={26} /><b>{m.label}</b><span className="hm-race-p">{Math.round(m.p * 100)}%</span>
                </Link>
              ))}
            </div>
            <p className="hm-src">From Kalshi prediction markets.</p>
          </section>
        )}

        <section>
          <header className="hm-h"><h2>How TapeDog works</h2><Link href="/about">Full method</Link></header>
          <div className="hm-steps">
            <div><span>1</span><b>Every favorite gets a TAPE score</b><p>From 0 to 99. The higher it is, the shakier the favorite looks this week.</p></div>
            <div><span>2</span><b>We show our work</b><p>Each game lists the reasons in plain English, next to what the sportsbooks and Kalshi think.</p></div>
            <div><span>3</span><b>Scores of 50+ get flagged</b><p>Those are FADE games: favorites with the most ways to slip. Then we grade every call after the final.</p></div>
          </div>
        </section>

        <section className="hm-two">
          <div className="hm-panel">
            <h3>Inside a TAPE score</h3>
            {spots[0] ? (
              <>
                <p className="hm-dim">{favOf(spots[0]).short} vs {dogOf(spots[0]).short}, this week</p>
                {spots[0].factors.filter((f) => f.points > 0).slice(0, 4).map((f) => (
                  <div key={f.key} className="hm-factor"><span>{f.label}</span><b>+{f.points}</b></div>
                ))}
                <div className="hm-factor hm-total"><span>TAPE score</span><b className={`c-${spots[0].tier.toLowerCase()}`}>{spots[0].score} · {spots[0].tier}</b></div>
              </>
            ) : lastHit ? (
              <>
                <p className="hm-dim">Our last FADE call that hit: {lastHit.dog.short} beat {lastHit.fav.short} {lastHit.dogPts}–{lastHit.favPts}</p>
                {lastHit.flags.slice(0, 4).map((f) => <div key={f} className="hm-factor"><span>{f}</span><b>✓</b></div>)}
                <div className="hm-factor hm-total"><span>TAPE score</span><b className="c-fade">{lastHit.score} · FADE</b></div>
              </>
            ) : <p className="hm-dim">Examples appear once this week's lines are posted.</p>}
            <p className="hm-small">What adds points: a big game next week, a letdown after a big win, road trips, short rest and a line moving toward the underdog.</p>
          </div>

          <div className="hm-panel">
            <h3>Our track record</h3>
            {edge ? (
              <>
                <div className="hm-stats">
                  <div><b className="c-fade">{edge.fadePct}%</b><span>of our flagged favorites lost</span></div>
                  <div><b>{edge.expPct}%</b><span>expected by the betting lines</span></div>
                </div>
                <p className="hm-small">{edge.fadeN} graded games this season. That's a small sample, so treat it as early evidence. Every pick is now also saved before kickoff and graded after, so the live record can't be edited.</p>
                <Link href="/record" className="hm-more">See every call →</Link>
              </>
            ) : <p className="hm-dim">Grading this season's games…</p>}
          </div>
        </section>

        <section>
          <header className="hm-h"><h2>What's on TapeDog</h2></header>
          <div className="hm-feats">
            <Link href="/board"><b>Fade Board</b><span>Every game ranked by upset risk.</span></Link>
            <Link href="/board?tab=scores"><b>Live scores</b><span>Every FBS game, with drive charts and win chances.</span></Link>
            <Link href="/tracker"><b>Score Tracker</b><span>Your games on one screen, built for game day.</span></Link>
            <Link href="/reels"><b>Reels</b><span>The week's best plays, one swipe at a time.</span></Link>
            <Link href="/rankings"><b>Rankings & odds</b><span>The polls, title odds, Heisman and the coaching hot seat.</span></Link>
            <Link href="/playoff"><b>Playoff bracket</b><span>The projected 12-team field and each team's chances.</span></Link>
          </div>
        </section>

        <section className="hm-two">
          <div className="hm-panel">
            <h3>Where the numbers come from</h3>
            <ul className="hm-src-list">
              <li><b>ESPN</b><span>Scores, schedules, stats, rankings and power ratings</span></li>
              <li><b>Sportsbooks</b><span>Betting lines from six books, via Action Network</span></li>
              <li><b>Kalshi</b><span>Prediction-market prices for games and titles</span></li>
              <li><b>Open-Meteo</b><span>Game-day weather</span></li>
              <li><b>Google News and Bluesky</b><span>Headlines and reporter posts</span></li>
            </ul>
          </div>
          <div className="hm-panel">
            <h3>Questions</h3>
            <details><summary>Is this betting advice?</summary><p>No. TapeDog is for entertainment and information. We don't take bets, link to sportsbooks or sell picks.</p></details>
            <details><summary>How often does it update?</summary><p>Lines and scores refresh every few minutes, and live games every few seconds.</p></details>
            <details><summary>Does a FADE mean the favorite will lose?</summary><p>No. Most favorites still win. A FADE means the favorite is more likely than usual to slip.</p></details>
            <details><summary>Is it free?</summary><p>Yes, the site and the iPhone app are free, with no account needed.</p></details>
          </div>
        </section>

        <section className="hm-app">
          <div>
            <h2>TapeDog for iPhone</h2>
            <p>Live scores on your Lock Screen, upset alerts and a daily brief.</p>
            <AppNotify />
          </div>
          <img src="/app/home.jpg" alt="TapeDog for iPhone" />
        </section>

        <LegalNote />
      </div>
    </main>
  );
}
