import Link from "next/link";

export const metadata = { title: "About — TapeDog" };

const STEPS = [
  ["1. Pull the odds", "Spreads from six sportsbooks, the opening line, Kalshi prices and ESPN's win model for every FBS game."],
  ["2. Check the spot", "Who the favorite just played, who they play next, travel, rest days and kickoff weather."],
  ["3. Score it", "Each red flag adds points to a 0–99 Tape Score. 50 or higher is a FADE."],
];

const DO = [
  ["Fade Board", "Every upcoming game ranked by Tape Score.", "/board"],
  ["Live scores", "Scores, down and distance and win odds, updating on their own.", "/board?tab=scores"],
  ["Team pages", "Search any team with ⌘K for its schedule, results and this week's spot.", "/team/333"],
  ["AI breakdown", "A short summary of each game, written only from TapeDog's data.", "/board"],
  ["Saved games", "Bookmark games to check back on later.", "/board?tab=saved"],
];

const GAMES = [
  { tag: "In person", title: "Ohio State 27, Penn State 26", when: "Sept. 29, 2018", note: "Penn State led 26–14 in the fourth. Ohio State scored the last 13. I was there." },
  { tag: "On TV", title: "Alabama 41, Georgia 34", when: "2024", note: "Alabama led 28–0, Georgia took the lead late, Alabama answered right away. ESPN's No. 2 game of 2024." },
  { tag: "On TV", title: "Texas A&M 41, Notre Dame 40", when: "Sept. 13, 2025", note: "One-point game in South Bend. 9.7/10." },
  { tag: "On TV", title: "Indiana 27, Miami 21", when: "2026 CFP title game", note: "Close all second half, and Miami had the ball late with a chance to win. ESPN's best game of the 2025 season." },
];

export default function About() {
  return (
    <main className="wrap about">
      <section>
        <div className="eyebrow mono">ABOUT TAPEDOG</div>
        <h1 className="big">What TapeDog does.</h1>
        <p className="lead2">TapeDog grades every FBS favorite on the stuff box scores miss — look-ahead spots, letdowns, line movement, prediction markets, rest and weather — then flags the ones worth fading.</p>
      </section>

      <section className="sect0">
        <div className="eyebrow mono">HOW IT WORKS</div>
        <div className="aboutsteps">
          {STEPS.map(([t, d]) => <div key={t} className="bcard"><b>{t}</b><p>{d}</p></div>)}
        </div>
      </section>

      <section className="sect0">
        <div className="eyebrow mono">WHAT YOU CAN DO</div>
        <div className="aboutdo">
          {DO.map(([t, d, h]) => (
            <Link key={t} href={h} className="dorow"><b>{t}</b><span className="muted">{d}</span><i>→</i></Link>
          ))}
        </div>
      </section>

      <section className="sect0 founder2" id="founder">
        <div className="eyebrow mono">THE FOUNDER</div>
        <div className="fhead">
          <div className="pav sm">TA</div>
          <div><h2 className="big nomb">Teddy A.</h2><span className="mono muted">FOUNDER · BUILDER</span></div>
        </div>
        <p className="lead2">I've loved college football since I was a little kid. I've always cared more about the spot than the matchup: who's looking ahead, who just got punched in the mouth, who's traveling across the country for a noon kick.</p>
        <p className="lead2 muted">TapeDog is the tool I wanted every Saturday. It finds the favorites in a bad spot and tells you why.</p>

        <h3 className="gtitle mono">FAVORITE GAMES</h3>
        <div className="favlist">
          {GAMES.map((g) => (
            <div key={g.title} className="fav-row">
              <span className={`mono ftag ${g.tag === "In person" ? "live" : ""}`}>{g.tag}</span>
              <div><b>{g.title}</b> <span className="mono muted">· {g.when}</span><p>{g.note}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="sect0">
        <div className="eyebrow mono">UNDER THE HOOD</div>
        <p className="lead2 muted">TapeDog pulls public sports, odds and prediction-market data automatically, scores each game with its own model, and uses AI only to summarize that data. It updates itself; nobody runs it by hand.</p>
      </section>

      <section className="sect0 aboutcta">
        <Link href="/board" className="btn primary">Open the Fade Board →</Link>
        <Link href="/dogzone" className="btn ghost">What's coming in Dog Zone</Link>
      </section>
    </main>
  );
}
