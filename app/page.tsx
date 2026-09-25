import Link from "next/link";
import { getSlate, type Game } from "@/lib/data";
import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import Kickoff from "@/components/Kickoff";

export const revalidate = 900;
export const maxDuration = 60;

function Mini({ g, right }: { g: Game; right: React.ReactNode }) {
  return (
    <Link href={`/game/${g.id}`} className="mini" style={{ ["--c" as any]: g[g.favorite].color }}>
      <span className="mlogos">{g.away.logo && <img src={g.away.logo} alt="" />}{g.home.logo && <img src={g.home.logo} alt="" />}</span>
      <span className="mtxt"><b>{g.away.short} @ {g.home.short}</b><small className="mono muted">{g.line} · <Kickoff date={g.date} /></small></span>
      {right}
    </Link>
  );
}

export default async function Landing() {
  const s = await getSlate();
  const up = s.games.filter((g) => g.state !== "post");
  const pool = [...(up.length ? up : s.games)];
  const fades = [...pool].sort((a, b) => b.score - a.score);
  const watch = [...pool].sort((a, b) => b.watch - a.watch);
  const fly = fades.slice(0, 18).map((g) => ({
    id: g.id, line: g.line, score: g.score, tier: g.tier,
    away: { abbr: g.away.abbr, logo: g.away.logo, color: g.away.color },
    home: { abbr: g.home.abbr, logo: g.home.logo, color: g.home.color },
  }));
  const tick = fades.slice(0, 24);

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

      <section className="wrap sect2">
        <Reveal>
          <div className="eyebrow mono">WEEK {s.week ?? "—"}</div>
          <h2 className="h2">This week's tape</h2>
        </Reveal>
        <div className="twocol">
          <Reveal className="listcard">
            <div className="lch"><b>Upset watch</b><span className="muted">Favorites most likely to slip</span></div>
            {fades.slice(0, 5).map((g) => <Mini key={g.id} g={g} right={<span className={`tiny t-${g.tier}`}>{g.tier} {g.score}</span>} />)}
          </Reveal>
          <Reveal className="listcard" delay={100}>
            <div className="lch"><b>Must-watch</b><span className="muted">Close lines, big names, big buzz</span></div>
            {watch.slice(0, 5).map((g) => <Mini key={g.id} g={g} right={<span className="tiny wtag">WATCH {g.watch}</span>} />)}
          </Reveal>
        </div>
        <div className="center"><Link href="/board" className="btn primary">Open the full board →</Link></div>
      </section>

      <section className="wrap sect2">
        <Reveal>
          <div className="eyebrow mono">HOW IT WORKS</div>
          <h2 className="h2">Three steps, every game.</h2>
        </Reveal>
        <div className="steps3">
          {[
            ["01", "Pull the odds", "Six sportsbooks, the opening line, Kalshi and ESPN's model."],
            ["02", "Check the spot", "Last week, next week, travel, rest and weather."],
            ["03", "Score it", "Red flags add up to a 0–99 Tape Score. 50+ is a FADE."],
          ].map(([n, t, d], k) => (
            <Reveal key={n} delay={k * 90} className="step3"><span className="mono">{n}</span><b>{t}</b><p>{d}</p></Reveal>
          ))}
        </div>
        <div className="center"><Link href="/about" className="btn ghost">See everything it checks →</Link></div>
      </section>

      <section className="wrap sect2">
        <Reveal>
          <Link href="/dogzone" className="dzmini">
            <div><span className="mono c-tape">DOG ZONE · COMING 2027</span><b>Alerts, a season tracker and every AI breakdown. $15/mo.</b></div>
            <span className="btn primary">Join the list →</span>
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
