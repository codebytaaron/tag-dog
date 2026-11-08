import Link from "next/link";
import { getSlate, type Game } from "@/lib/data";
import { getLive, type Live } from "@/lib/live";
import Kickoff from "@/components/Kickoff";
import Hero from "@/components/Hero";
import { getFutures } from "@/lib/pulse";
import AppNotify from "@/components/AppNotify";
import LegalNote from "@/components/LegalNote";

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
  const [s, live, fut] = await Promise.all([getSlate(), getLive().catch(() => ({} as Record<string, Live>)), getFutures().catch(() => null)]);
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
