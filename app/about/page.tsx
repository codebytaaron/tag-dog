import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = { title: "About the founder — TapeDog" };

const GAMES = [
  { where: "In the building", title: "Texas vs Ohio State", year: "2026", score: null, note: "The big comeback. The kind of game where the stadium goes quiet, then goes insane. Nothing on a screen beats being there for that." },
  { where: "On the couch", title: "Alabama 41, Georgia 34", year: "2024", score: "No. 2 game of 2024 per ESPN", note: "Alabama went up 28–0. Georgia clawed all the way back and took the lead late — then Alabama answered almost immediately. Pure chaos." },
  { where: "Instant classic", title: "Texas A&M 41, Notre Dame 40", year: "Sep 13, 2025", score: "9.7 / 10", note: "One-point game in South Bend. The definition of a spot you can't trust the favorite in." },
];

const BUILD = [
  ["Live data, everywhere", "TapeDog listens to a mix of public sports, sportsbook and prediction-market feeds and stitches them into one picture of every game — refreshed automatically all week and live on Saturdays."],
  ["The Tape Score", "A situational model I built from how upsets actually happen: schedule spots, market movement and conditions. The exact recipe stays in the film room."],
  ["An AI that stays honest", "The scouting briefs are written by AI, but only from the data TapeDog already pulled. No invented injuries, no fake quotes."],
  ["Runs itself", "No one updates this by hand. It caches smartly, refreshes itself and costs nothing to keep running."],
];

export default function About() {
  return (
    <main className="wrap about">
      <section className="founder">
        <div className="fmark"><Logo size={120} /><span className="mono">TA</span></div>
        <div>
          <div className="eyebrow mono">ABOUT THE FOUNDER</div>
          <h1 className="big">Built by TA.</h1>
          <p className="lead2">I'm TA, a builder who spends Saturdays watching way too much college football. I've always cared more about the <em>spot</em> than the matchup: who's looking ahead, who just got punched in the mouth, who's traveling across the country for a noon kick.</p>
          <p className="lead2 muted">TapeDog is the tool I wanted every week: one place that flags the favorites that are set up to stumble, and explains why in plain English.</p>
        </div>
      </section>

      <section className="sect0">
        <div className="eyebrow mono">THE GAMES THAT MADE ME</div>
        <div className="gamesgrid">
          {GAMES.map((g, k) => (
            <article key={g.title} className="fgame">
              <div className="fgtop mono"><span>{String(k + 1).padStart(2, "0")} · {g.where.toUpperCase()}</span><span className="muted">{g.year}</span></div>
              <h3>{g.title}</h3>
              {g.score && <div className="fscore mono">{g.score}</div>}
              <p>{g.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sect0">
        <div className="eyebrow mono">HOW TAPEDOG IS BUILT</div>
        <h2 className="big">The short version.</h2>
        <div className="buildgrid">
          {BUILD.map(([t, d]) => <div key={t} className="bcard"><b>{t}</b><p>{d}</p></div>)}
        </div>
      </section>

      <section className="sect0 aboutcta">
        <Link href="/board" className="btn primary">Open the Fade Board →</Link>
        <Link href="/dogzone" className="btn ghost">See what's coming in Dog Zone</Link>
      </section>
    </main>
  );
}
