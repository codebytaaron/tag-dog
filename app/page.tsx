import Link from "next/link";
import { getSlate, type Game } from "@/lib/data";
import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import Kickoff from "@/components/Kickoff";
import FeatureGrid from "@/components/FeatureGrid";
import Countdown from "@/components/Countdown";
import { getGameDayId } from "@/lib/gameday";
import { getFutures } from "@/lib/pulse";
import SinceVisit from "@/components/SinceVisit";
import { lite } from "@/lib/data";

const FLOW: [string, string, string, string[]][] = [
  ["01", "Pull the odds", "Six sportsbooks, the opening line, Kalshi and ESPN's win model.", ["DraftKings", "FanDuel", "BetMGM", "Caesars", "bet365", "BetRivers", "Action Network", "Kalshi", "ESPN FPI"]],
  ["02", "Check the spot", "Last week, next week, travel, rest, weather and fan buzz.", ["ESPN", "Open-Meteo", "Bluesky", "Google News"]],
  ["03", "Score it", "Red flags add up to a 0 to 99 Tape Score. 50 or higher is a fade.", ["TapeDog model", "Gemini AI", "Live scores"]],
];

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
  const gd = await getGameDayId(s.games);
  const gdGame = pool.find((g) => g.id === gd);
  const watchList = gdGame ? [gdGame, ...watch.filter((g) => g.id !== gd)] : watch;
  const spot = gdGame || watch[0];
  const fut = await getFutures().catch(() => null);
  const race = (fut?.title?.markets || []).slice(0, 6);

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

      {spot && (
        <section className="wrap sect2">
          <Reveal>
            <Link href={`/game/${spot.id}`} className="spot" style={{ ["--ca" as any]: spot.away.color, ["--ch" as any]: spot.home.color }}>
              <div className="spottag mono"><i>★</i>{gdGame ? "COLLEGE GAMEDAY IS HERE THIS WEEK" : "GAME OF THE WEEK"}</div>
              <div className="spotteams">
                <div className="st">
                  {spot.away.logo && <img src={spot.away.logo} alt="" />}
                  <b>{spot.away.rank ? <sup>{spot.away.rank}</sup> : null}{spot.away.short}</b>
                  <small className="mono">{spot.away.record}</small>
                </div>
                <div className="spotmid">
                  <span className="mono muted">KICKOFF IN</span>
                  <b><Countdown date={spot.date} /></b>
                  <span className="mono muted">{spot.network ? `${spot.network} · ` : ""}{spot.venue.city || spot.venue.name}</span>
                </div>
                <div className="st">
                  {spot.home.logo && <img src={spot.home.logo} alt="" />}
                  <b>{spot.home.rank ? <sup>{spot.home.rank}</sup> : null}{spot.home.short}</b>
                  <small className="mono">{spot.home.record}</small>
                </div>
              </div>
              <div className="spotfoot">
                <span className="chip2 strong">{spot.line}{spot.total ? ` · O/U ${spot.total}` : ""}</span>
                <span className="chip2">WATCH {spot.watch}</span>
                <span className={`chip2 t-${spot.tier}`}>UPSET {spot.score} · {spot.tier}</span>
                <span className="btn primary">Open the game →</span>
              </div>
            </Link>
          </Reveal>
        </section>
      )}

      <div className="wrap"><SinceVisit games={s.games.map(lite)} /></div>

      {race.length > 0 && (
        <section className="wrap sect2">
          <Reveal>
            <Link href="/rankings?tab=title" className="race">
              <div className="raceh"><span className="mono c-tape">THE TITLE RACE · LIVE FROM KALSHI</span><span className="mono muted">ALL ODDS →</span></div>
              <div className="racerow">
                {race.map((m, k) => (
                  <div key={m.label} className="rteam" style={{ ["--c" as any]: m.team?.color || "var(--tape)" }}>
                    <span className="mono muted">{k + 1}</span>
                    {m.team?.logo && <img src={m.team.logo} alt="" />}
                    <b>{m.label}</b>
                    <em className="mono">{Math.round(m.p * 100)}%</em>
                  </div>
                ))}
              </div>
            </Link>
          </Reveal>
        </section>
      )}

      <section className="wrap sect2">
        <Reveal>
          <div className="eyebrow mono">WEEK {s.week ?? "–"}</div>
          <h2 className="h2">This week's tape</h2>
        </Reveal>
        <div className="twocol">
          <Reveal className="listcard">
            <div className="lch"><b>Upset watch</b><span className="muted">Favorites most likely to slip</span></div>
            {fades.slice(0, 5).map((g) => <Mini key={g.id} g={g} right={<span className={`tiny t-${g.tier}`}>{g.tier} {g.score}</span>} />)}
          </Reveal>
          <Reveal className="listcard" delay={100}>
            <div className="lch"><b>Must-watch</b><span className="muted">Close lines, big names, big buzz</span></div>
            {watchList.slice(0, 5).map((g) => <Mini key={g.id} g={g} right={g.id === gd ? <span className="tiny gdtag">★ GAMEDAY</span> : <span className="tiny wtag">WATCH {g.watch}</span>} />)}
          </Reveal>
        </div>
        <div className="center"><Link href="/board" className="btn primary">Open the full board →</Link></div>
      </section>

      <section className="wrap sect2">
        <Reveal><div className="eyebrow mono">FEATURES</div><h2 className="h2">Everything on TapeDog</h2></Reveal>
        <FeatureGrid />
      </section>

      <section className="wrap sect2">
        <Reveal>
          <div className="eyebrow mono">HOW IT WORKS</div>
          <h2 className="h2">Three steps, every game.</h2>
        </Reveal>
        <div className="how3">
          {FLOW.map(([n, t, d, tools], k) => (
            <Reveal key={n} delay={k * 100} className="hcard">
              <span className="hnum mono">{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
              <span className="hsrc mono">{tools.length} SOURCES</span>
            </Reveal>
          ))}
        </div>
        <p className="srcline"><span className="mono">CONNECTED TO</span>{FLOW.flatMap((f) => f[3]).map((x, i, a) => <span key={x}><span className="gsrc" style={{ animationDelay: `${i * 0.45}s` }}>{x}</span>{i < a.length - 1 && <span className="gsep"> · </span>}</span>)}</p>
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
