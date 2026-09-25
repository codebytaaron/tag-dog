import Link from "next/link";
import { getSlate } from "@/lib/data";
import Hero from "@/components/Hero";
import Reveal, { CountUp } from "@/components/Reveal";
import Ring from "@/components/Ring";

export const revalidate = 900;
export const maxDuration = 60;

const PLAYBOOK = [
  ["Look-ahead", "+20", "Ranked opponent waiting next week"],
  ["Model dissent", "+16", "ESPN FPI disagrees with the books"],
  ["Letdown", "+14", "Coming off a ranked, emotional game"],
  ["Line sliding", "+12", "Number moved toward the dog since open"],
  ["Road favorite", "+10", "Laying points in a hostile building"],
  ["Sandwich", "+10", "Ranked teams on both sides"],
  ["Chaos weather", "+10", "Wind, rain or cold at kickoff"],
  ["Market doubt", "+8", "Kalshi prices the fav lower than books"],
  ["Rest edge", "+8", "Short week for fav or bye for dog"],
  ["Big cushion", "−12", "24+ point spreads rarely get got"],
];
const SOURCES = ["ESPN", "DraftKings", "FanDuel", "BetMGM", "Caesars", "bet365", "BetRivers", "Kalshi", "ESPN FPI", "Open-Meteo", "Gemini"];

export default async function Landing() {
  const s = await getSlate();
  const up = s.games.filter((g) => g.state !== "post");
  const pool = [...(up.length ? up : s.games)].sort((a, b) => b.score - a.score);
  const fly = pool.slice(0, 18).map((g) => ({
    id: g.id, line: g.line, score: g.score, tier: g.tier,
    away: { abbr: g.away.abbr, logo: g.away.logo, color: g.away.color },
    home: { abbr: g.home.abbr, logo: g.home.logo, color: g.home.color },
  }));
  const top = pool.slice(0, 3);
  const books = new Set(s.games.flatMap((g) => g.books.map((b) => b.book))).size;
  const signals = s.games.reduce((n, g) => n + g.factors.length, 0);
  const tick = pool.slice(0, 24);

  return (
    <main>
      <Hero games={fly} count={s.games.length} week={s.week} />

      <div className="ticker" aria-hidden>
        <div className="track mono">
          {[...tick, ...tick].map((g, k) => (
            <span key={k}><b>{g.away.abbr} @ {g.home.abbr}</b> {g.line} <em className={`c-${g.tier.toLowerCase()}`}>{g.tier} {g.score}</em></span>
          ))}
        </div>
      </div>

      <section className="wrap sect" id="how">
        <Reveal><div className="eyebrow mono">01 — THE PROCESS</div><h2 className="big">We watch the schedule,<br />not the highlights.</h2></Reveal>
        <div className="steps">
          {[
            ["Pull the odds", "We collect spreads from six sportsbooks, the opening line, Kalshi prices and ESPN's win model for every FBS game."],
            ["Check the spot", "We look at who the favorite just played, who they play next, travel, rest and kickoff weather."],
            ["Flag the fades", "Each red flag adds points to a 0–99 Tape Score. 50 or higher is a FADE. Open any game for the details and an AI summary."],
          ].map(([t, d], k) => (
            <Reveal key={t} delay={k * 120} className="step">
              <span className="num">{String(k + 1).padStart(2, "0")}</span>
              <h3>{t}</h3><p>{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="wrap sect stats">
        {[
          [s.games.length, "games on tape"], [books || 6, "sportsbooks shopped"], [signals, "signals flagged"], [pool.filter((g) => g.tier === "FADE").length, "fades this week"],
        ].map(([n, l], k) => (
          <Reveal key={String(l)} delay={k * 90} className="stat"><b><CountUp to={Number(n)} /></b><span className="mono">{l}</span></Reveal>
        ))}
      </section>

      {top.length > 0 && (
        <section className="wrap sect">
          <Reveal><div className="eyebrow mono">02 — THIS WEEK'S TAPE</div><h2 className="big">Top fades right now.</h2></Reveal>
          <div className="topfades">
            {top.map((g, k) => {
              const fav = g[g.favorite], dog = g[g.favorite === "home" ? "away" : "home"];
              return (
                <Reveal key={g.id} delay={k * 120}>
                  <Link href={`/game/${g.id}`} className="tf" style={{ ["--c" as any]: fav.color }}>
                    <div className="tfh">
                      <span className="mono muted">NO. {k + 1}</span>
                      <Ring score={g.score} tier={g.tier} size={52} />
                    </div>
                    <div className="tfteams">
                      <img src={fav.logo} alt="" /><span className="vs mono">vs</span><img src={dog.logo} alt="" />
                    </div>
                    <h3>Fade {fav.short}</h3>
                    <p className="muted">{g.line} vs {dog.short}</p>
                    <div className="chips">{g.factors.filter((f) => f.points > 0).slice(0, 3).map((f) => <em key={f.key}>{f.label}</em>)}</div>
                    <span className="go mono">OPEN FILE →</span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      <section className="wrap sect split">
        <Reveal>
          <div className="eyebrow mono">03 — THE PLAYBOOK</div>
          <h2 className="big">Ten signals.<br />No vibes.</h2>
          <p className="muted lead2">Every point in the Tape Score comes from one of these checks. The AI summary only uses this data.</p>
          <Link href="/board" className="btn primary">See the board →</Link>
        </Reveal>
        <div className="playbook">
          {PLAYBOOK.map(([n, p, d], k) => (
            <Reveal key={n} delay={k * 50} className="pb">
              <span className={`pts mono ${p.startsWith("−") ? "neg" : ""}`}>{p}</span>
              <div><b>{n}</b><small>{d}</small></div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="wrap sect">
        <div className="sources">
          <span className="mono muted">WIRED INTO</span>
          {SOURCES.map((x) => <span key={x} className="src">{x}</span>)}
        </div>
      </section>

      <section className="wrap sect">
        <Reveal>
          <Link href="/dogzone" className="dzband">
            <div>
              <div className="eyebrow mono">COMING SOON</div>
              <h2 className="big">The Dog Zone.</h2>
              <p>A paid tier with fade alerts, a season-long results tracker and every past AI breakdown.</p>
            </div>
            <span className="btn primary">Get on the list →</span>
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
