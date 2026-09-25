import Link from "next/link";

export const metadata = { title: "How it works | TapeDog" };

const WHY = [
  ["Spot, not strength", "Power ratings tell you who's better. TapeDog tells you who's in a bad spot this week."],
  ["Every number, shopped", "Six sportsbooks, the opening line, a prediction market and ESPN's model, side by side."],
  ["AI that shows its work", "Breakdowns use only the data on the page plus what fans and media are saying. No made-up picks."],
];

const SOURCES = [
  ["ESPN", "Schedules, scores, rankings, news"],
  ["DraftKings · FanDuel · BetMGM", "Spreads, totals, moneylines"],
  ["Caesars · bet365 · BetRivers", "More books to find the best price"],
  ["Action Network", "Opening line and bets tracked"],
  ["Kalshi", "Prediction-market win odds"],
  ["ESPN FPI", "Model win probability"],
  ["Open-Meteo", "Kickoff-hour weather at the stadium"],
  ["Bluesky · Google News", "What fans and media are saying"],
  ["Gemini", "Writes the AI breakdown"],
];

const PLAYBOOK = [
  ["Look-ahead", "+20", "Ranked opponent next week"],
  ["Model dissent", "+16", "ESPN FPI disagrees with the books"],
  ["Letdown", "+14", "Coming off a ranked opponent"],
  ["Line sliding", "+12", "Spread moved toward the underdog"],
  ["Road favorite", "+10", "Favored on the road"],
  ["Sandwich", "+10", "Ranked teams on both sides"],
  ["Chaos weather", "+10", "Wind, rain or cold at kickoff"],
  ["Market doubt", "+8", "Kalshi lower on the favorite than books"],
  ["Rest edge", "+8", "Short week for fav or bye for dog"],
  ["Big cushion", "−12", "Spread of 24 or more"],
];

export default function How() {
  return (
    <main className="wrap about">
      <section className="howhero">
        <div className="eyebrow mono">HOW IT WORKS</div>
        <h1 className="mega">Spot the<br /><span className="c-tape">bad spot.</span></h1>
        <p className="lead2">TapeDog scores every FBS game for upset risk. It checks odds at six sportsbooks, prediction markets, schedule spots, rest and weather, then tells you which favorites to fade and which games are worth watching.</p>
      </section>

      <section className="pipe" aria-label="How a game gets scored">
        {[["13", "data sources"], ["10", "red-flag checks"], ["0–99", "Tape Score"], ["FADE", "or WATCH or HOLD"]].map(([b, s], k) => (
          <div key={s} className="pnode" style={{ animationDelay: `${k * 0.15}s` }}><b className={k === 3 ? "c-fade" : ""}>{b}</b><span className="mono">{s}</span></div>
        ))}
        <i className="pflow" />
      </section>

      <section className="sect0">
        <div className="eyebrow mono">WHY IT'S DIFFERENT</div>
        <div className="aboutsteps">
          {WHY.map(([t, d], k) => <div key={t} className="bcard why"><span className="mono num">0{k + 1}</span><b>{t}</b><p>{d}</p></div>)}
        </div>
      </section>

      <section className="sect0 split2">
        <div>
          <div className="eyebrow mono">THE RED FLAGS</div>
          <h2 className="big">10 checks.<br />No vibes.</h2>
          <p className="muted">Points add up to the Tape Score.</p>
          <div className="scale">
            <div><i className="hold" /><span className="mono">0–27 HOLD</span></div>
            <div><i className="watch" /><span className="mono">28–49 WATCH</span></div>
            <div><i className="fade" /><span className="mono">50+ FADE</span></div>
          </div>
        </div>
        <div className="playbook">
          {PLAYBOOK.map(([n, p, d]) => (
            <div key={n} className="pb">
              <span className={`pts mono ${p.startsWith("−") ? "neg" : ""}`}>{p}</span>
              <div><b>{n}</b><small>{d}</small></div>
            </div>
          ))}
        </div>
      </section>

      <section className="sect0">
        <div className="eyebrow mono">WIRED INTO</div>
        <div className="srcgrid">
          {SOURCES.map(([n, d]) => <div key={n} className="src2"><b>{n}</b><span className="muted">{d}</span></div>)}
        </div>
        <p className="mono muted small refresh">ODDS REFRESH EVERY 15 MIN · LIVE SCORES EVERY 20 SEC · RUNS ITSELF</p>
      </section>

      <section className="sect0 aboutcta">
        <Link href="/board" className="btn primary">Open the Fade Board →</Link>
        <Link href="/founder" className="btn ghost">Meet the founder →</Link>
      </section>
    </main>
  );
}
