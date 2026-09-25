import Link from "next/link";
import { getSlate } from "@/lib/data";
import Hero from "@/components/Hero";
import Reveal, { CountUp } from "@/components/Reveal";
import Ring from "@/components/Ring";

export const revalidate = 900;
export const maxDuration = 60;

const SOURCES = ["ESPN", "DraftKings", "FanDuel", "BetMGM", "Caesars", "bet365", "BetRivers", "Kalshi", "ESPN FPI", "Open-Meteo", "Bluesky", "Google News", "Gemini"];

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
            ["Pull the odds", "Spreads from six sportsbooks, the opening line, Kalshi prices and ESPN's win model for every FBS game."],
            ["Check the spot", "Who the favorite just played, who they play next, travel, rest and kickoff weather."],
            ["Flag the fades", "Each red flag adds points to a 0–99 Tape Score. 50 or higher is a FADE."],
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
          [s.games.length, "games on tape"], [books || 6, "sportsbooks shopped"], [signals, "red flags found"], [pool.filter((g) => g.tier === "FADE").length, "fades this week"],
        ].map(([n, l], k) => (
          <Reveal key={String(l)} delay={k * 90} className="stat"><b><CountUp to={Number(n)} /></b><span className="mono">{l}</span></Reveal>
        ))}
      </section>

      {top.length > 0 && (
        <section className="wrap sect">
          <Reveal><div className="eyebrow mono">02 — THIS WEEK</div><h2 className="big">Top fades right now.</h2></Reveal>
          <div className="topfades">
            {top.map((g, k) => {
              const fav = g[g.favorite], dog = g[g.favorite === "home" ? "away" : "home"];
              return (
                <Reveal key={g.id} delay={k * 120}>
                  <Link href={`/game/${g.id}`} className="tf" style={{ ["--c" as any]: fav.color }}>
                    <div className="tfh"><span className="mono muted">NO. {k + 1}</span><Ring score={g.score} tier={g.tier} size={52} /></div>
                    <div className="tfteams"><img src={fav.logo} alt="" /><span className="vs mono">vs</span><img src={dog.logo} alt="" /></div>
                    <h3>Fade {fav.short}</h3>
                    <p className="muted">{g.line} vs {dog.short}</p>
                    <div className="chips">{g.factors.filter((f) => f.points > 0).slice(0, 3).map((f) => <em key={f.key}>{f.label}</em>)}</div>
                    <span className="go mono">OPEN GAME →</span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
          <div className="center"><Link href="/board" className="btn ghost">See all {up.length} games →</Link></div>
        </section>
      )}

      <section className="wrap sect">
        <Reveal>
          <Link href="/about" className="howband">
            <div>
              <div className="eyebrow mono">03 — UNDER THE HOOD</div>
              <h2 className="big">13 sources.<br />10 red flags.<br />One score.</h2>
              <p className="muted">See exactly what TapeDog checks and why it's different.</p>
              <span className="btn primary">How it works →</span>
            </div>
            <div className="srccloud">
              {SOURCES.map((x, k) => <span key={x} style={{ animationDelay: `${k * 0.35}s` }}>{x}</span>)}
            </div>
          </Link>
        </Reveal>
      </section>

      <section className="wrap sect">
        <Reveal>
          <Link href="/dogzone" className="dzband">
            <div>
              <div className="eyebrow mono">COMING 2027 · $15/MO</div>
              <h2 className="big">The Dog Zone.</h2>
              <p>Fade alerts, a season results tracker and every past AI breakdown. 150 of 500 early spots taken.</p>
            </div>
            <span className="btn primary">Get on the list →</span>
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
