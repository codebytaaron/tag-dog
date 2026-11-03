import Link from "next/link";
import { getSlate, lite, type Game } from "@/lib/data";
import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import Kickoff from "@/components/Kickoff";
import SinceVisit from "@/components/SinceVisit";
import { getGameDayId } from "@/lib/gameday";
import { getFutures } from "@/lib/pulse";

export const revalidate = 900;
export const maxDuration = 60;

function Mini({ g, right }: { g: Game; right: React.ReactNode }) {
  return (
    <Link href={`/game/${g.id}`} className="mini">
      <span className="mlogos">{g.away.logo && <img src={g.away.logo} alt="" />}{g.home.logo && <img src={g.home.logo} alt="" />}</span>
      <span className="mtxt"><b>{g.away.short} at {g.home.short}</b><small className="muted">{g.line} · <Kickoff date={g.date} /></small></span>
      {right}
    </Link>
  );
}

function MatchupCard({ g, gameday }: { g: Game; gameday: boolean }) {
  const dog = g[g.favorite === "home" ? "away" : "home"];
  const flag = g.factors.find((f) => f.points > 0);
  const Side = ({ side }: { side: "home" | "away" }) => {
    const t = g[side];
    return (
      <div className={`mu-team ${side === "home" ? "r" : ""}`}>
        {t.logo && <img src={t.logo} alt="" />}
        <div>
          <span className="mu-name">{t.rank ? <em>{t.rank}</em> : null}{t.short}</span>
          <span className="mu-rec">{t.record}</span>
        </div>
      </div>
    );
  };
  return (
    <Link href={`/game/${g.id}`} className="mu" style={{ ["--ca" as any]: g.away.color, ["--ch" as any]: g.home.color }}>
      <div className="mu-top">
        <span className="mu-label">{gameday ? "College GameDay" : "Game of the week"}</span>
        <span className="mu-when"><Kickoff date={g.date} long />{g.network ? ` · ${g.network}` : ""}</span>
      </div>
      <div className="mu-body">
        <Side side="away" />
        <div className="mu-mid">
          <span className="mu-at">at</span>
          <span className="mu-line">{g.line}</span>
          {g.total ? <span className="mu-total">O/U {g.total}</span> : null}
        </div>
        <Side side="home" />
      </div>
      <div className="mu-foot">
        <p>Upset chance for <b>{dog.short}</b>: <b className="mu-pct">{g.upsetPct}%</b>{flag ? <span className="muted"> · Top flag: {flag.label.toLowerCase()}</span> : null}</p>
        <span className="textlink">Preview the game</span>
      </div>
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
    id: g.id, line: g.line, score: g.score, tier: g.tier, up: g.upsetPct,
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

  // Worked example for "How the Tape Score works": this week's top fade.
  const ex = fades[0];
  const exFlags = ex ? ex.factors.filter((f) => f.points > 0).slice(0, 4) : [];
  const exRest = ex ? ex.score - exFlags.reduce((n, f) => n + f.points, 0) : 0;

  return (
    <main>
      <Hero games={fly} count={s.games.length} week={s.week} />

      <div className="ticker" aria-hidden>
        <div className="track mono">
          {[...tick, ...tick].map((g, k) => (
            <span key={k}><b>{g.away.abbr} at {g.home.abbr}</b> <em className={`c-${g.tier.toLowerCase()}`}>{g.upsetPct}% upset</em></span>
          ))}
        </div>
      </div>

      {spot && (
        <section className="wrap sect2">
          <Reveal><MatchupCard g={spot} gameday={!!gdGame} /></Reveal>
        </section>
      )}

      <div className="wrap"><SinceVisit games={s.games.map(lite)} /></div>

      <section className="wrap sect2">
        <Reveal>
          <div className="secthead">
            <h2 className="h2">This week</h2>
            <Link href="/board" className="textlink">Full board</Link>
          </div>
        </Reveal>
        <div className="twocol">
          <Reveal className="listcard">
            <div className="lch"><b>Upset watch</b><span className="muted">Favorites most likely to slip</span></div>
            {[...pool].sort((a, b) => b.upsetPct - a.upsetPct).slice(0, 5).map((g) => <Mini key={g.id} g={g} right={<span className="pctag">{g.upsetPct}%</span>} />)}
          </Reveal>
          <Reveal className="listcard" delay={100}>
            <div className="lch"><b>Must-watch</b><span className="muted">Close lines and big names</span></div>
            {watchList.slice(0, 5).map((g) => <Mini key={g.id} g={g} right={g.id === gd ? <span className="gdtag2">GameDay</span> : <span className="pctag muted">{g.watch}</span>} />)}
          </Reveal>
        </div>
      </section>

      {race.length > 0 && (
        <section className="wrap sect2">
          <Reveal>
            <div className="secthead">
              <h2 className="h2">Title race</h2>
              <Link href="/rankings?tab=title" className="textlink">All odds</Link>
            </div>
            <div className="race2">
              {race.map((m, k) => (
                <Link key={m.label} href={m.team ? `/team/${m.team.id}` : "/rankings?tab=title"} className="r2">
                  <span className="r2k">{k + 1}</span>
                  {m.team?.logo && <img src={m.team.logo} alt="" />}
                  <b>{m.label}</b>
                  <span className="r2p">{Math.round(m.p * 100)}%</span>
                </Link>
              ))}
            </div>
            <p className="muted small srcnote">National title odds from Kalshi, updated through the day.</p>
          </Reveal>
        </section>
      )}

      {ex && (
        <section className="wrap sect2">
          <Reveal>
            <div className="howx">
              <div className="howx-copy">
                <h2 className="h2">How the Tape Score works</h2>
                <p>Every favorite starts near zero. We add points for the spots that get favorites beat: a big game next week, a letdown after a big one, a long road trip, a line drifting toward the underdog, bad weather. At 50 or more, we call it a fade.</p>
                <p className="muted small">Data from ESPN, six sportsbooks, Kalshi, Open-Meteo, Bluesky and Google News.</p>
                <Link href="/about" className="textlink">Read the full method</Link>
              </div>
              <Link href={`/game/${ex.id}`} className="howx-card">
                <div className="hx-head">
                  <span className="hx-teams">{ex.away.logo && <img src={ex.away.logo} alt="" />}{ex.home.logo && <img src={ex.home.logo} alt="" />}</span>
                  <span><b>{ex[ex.favorite].short}</b><small className="muted">this week's top fade</small></span>
                </div>
                {exFlags.map((f) => (
                  <div key={f.key} className="hx-row"><span>{f.label}</span><span className="hx-pts">+{f.points}</span></div>
                ))}
                {exRest > 0 && <div className="hx-row muted"><span>Everything else</span><span className="hx-pts">+{exRest}</span></div>}
                <div className="hx-total"><span>Tape Score</span><b className={`c-${ex.tier.toLowerCase()}`}>{ex.score} · {ex.tier}</b></div>
              </Link>
            </div>
          </Reveal>
        </section>
      )}

      <section className="wrap sect2">
        <Link href="/dogzone" className="dzrow">
          <span><b>Dog Zone</b> <span className="muted">Fade alerts, a season tracker and every AI breakdown. Coming 2027.</span></span>
          <span className="textlink">Learn more</span>
        </Link>
      </section>
    </main>
  );
}
