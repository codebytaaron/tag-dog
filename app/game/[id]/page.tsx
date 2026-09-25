import Link from "next/link";
import { notFound } from "next/navigation";
import { getGameDetail, fmtSpread, fmtML } from "@/lib/data";
import Ring from "@/components/Ring";
import SaveButton from "@/components/SaveButton";
import Kickoff from "@/components/Kickoff";
import Brief from "@/components/Brief";
import LiveBar from "@/components/LiveBar";
import { getLive } from "@/lib/live";
import { getBuzz } from "@/lib/buzz";
import BuzzPanel from "@/components/BuzzPanel";
import PickBar from "@/components/PickBar";
import { getRecap } from "@/lib/recap";
import Recap, { StandaloneGame } from "@/components/Recap";

export const revalidate = 900;
export const maxDuration = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getGameDetail(id);
  if (d) return { title: `${d.game.away.short} @ ${d.game.home.short} | TapeDog` };
  const r = await getRecap(id);
  return { title: r ? `${r.away.short} @ ${r.home.short} | TapeDog` : "TapeDog" };
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const [d, recap] = await Promise.all([getGameDetail(id), getRecap(id)]);
  if (!d) { if (!recap) notFound(); return <StandaloneGame r={recap} />; }
  const { game: g, news } = d;
  const [liveMap, buzz] = await Promise.all([getLive(), getBuzz(g.away, g.home)]);
  const live = liveMap[g.id] || null;
  const fav = g[g.favorite], dog = g[g.favorite === "home" ? "away" : "home"];
  const favSide = g.favorite;

  const rows = g.books.map((b) => {
    const favSpread = b.spreadHome == null ? null : favSide === "home" ? b.spreadHome : -b.spreadHome;
    return { book: b.book, favSpread, dogSpread: favSpread == null ? null : -favSpread, total: b.total,
      favML: favSide === "home" ? b.mlHome : b.mlAway, dogML: favSide === "home" ? b.mlAway : b.mlHome };
  });
  const bestDogSpread = Math.max(...rows.map((r) => r.dogSpread ?? -99));
  const bestDogML = Math.max(...rows.map((r) => r.dogML ?? -9999));

  const probs = [
    { label: "Sportsbooks (no-vig)", v: g.bookFavProb != null ? g.bookFavProb * 100 : null },
    { label: "Kalshi market", v: g.kalshi ? g.kalshi[favSide] * 100 : null },
    { label: "ESPN FPI", v: g.fpi ? g.fpi[favSide] : null },
  ];

  return (
    <main className="game">
      <section className="ghero" style={{ ["--ca" as any]: g.away.color, ["--ch" as any]: g.home.color }}>
        <div className="wrap">
          <Link href="/board" className="back mono">← FADE BOARD</Link>
          <div className="gtop">
            <div className="gteam">
              <img src={g.away.logo} alt="" />
              <div><span className="mono muted">{g.away.rank ? `#${g.away.rank} · ` : ""}{g.away.record}{g.favorite === "away" ? " · FAV" : ""}</span><h2><Link href={`/team/${g.away.id}`} className="tlink">{g.away.short}</Link></h2></div>
            </div>
            <div className="gmid">
              <Ring score={g.score} tier={g.tier} size={96} />
              <div className={`stamp t-${g.tier}`}>{g.tier}</div>
            </div>
            <div className="gteam r">
              <div><span className="mono muted">{g.home.rank ? `#${g.home.rank} · ` : ""}{g.home.record}{g.favorite === "home" ? " · FAV" : ""}</span><h2><Link href={`/team/${g.home.id}`} className="tlink">{g.home.short}</Link></h2></div>
              <img src={g.home.logo} alt="" />
            </div>
          </div>
          <LiveBar id={g.id} date={g.date} away={g.away.abbr} home={g.home.abbr} initial={live} />
          <div className="gmeta mono">
            <span><Kickoff date={g.date} long /></span>
            {g.network && <span>{g.network}</span>}
            <span>{g.venue.name}{g.venue.city ? `, ${g.venue.city} ${g.venue.state}` : ""}</span>
            <span>{g.line}{g.total ? ` · O/U ${g.total}` : ""}</span>
            <SaveButton id={g.id} big />
          </div>
        </div>
      </section>

      {recap && recap.state !== "pre" && <div className="wrap"><Recap r={recap} /></div>}
      <div className="wrap ggrid">
        <div className="col">
          <PickBar id={g.id} date={g.date} state={g.state} fav={g.favorite} line={g.line} away={{ abbr: g.away.abbr, short: g.away.short, logo: g.away.logo, color: g.away.color }} home={{ abbr: g.home.abbr, short: g.home.short, logo: g.home.logo, color: g.home.color }} />
          <section className="card">
            <div className="cardh"><h3>Why it's flagged</h3><span className="mono muted">{g.factors.length} SIGNALS</span></div>
            {g.factors.length === 0 && <p className="muted">Nothing situational. Clean spot for {fav.short}.</p>}
            <ul className="factors">
              {g.factors.map((f) => (
                <li key={f.key}>
                  <span className={`pts mono ${f.points < 0 ? "neg" : ""}`}>{f.points > 0 ? "+" : ""}{f.points}</span>
                  <div><b>{f.label}</b><p>{f.detail}</p></div>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <div className="cardh"><h3>Odds by sportsbook</h3><span className="mono muted">BEST UNDERDOG PRICE HIGHLIGHTED</span></div>
            {rows.length ? (
              <div className="shop">
                <div className="sh mono"><span>Book</span><span>{dog.abbr} spread</span><span>{dog.abbr} ML</span><span>{fav.abbr} ML</span><span>Total</span></div>
                {rows.map((r) => (
                  <div key={r.book} className="sr">
                    <span>{r.book}</span>
                    <span className={`mono ${r.dogSpread === bestDogSpread ? "best" : ""}`}>{fmtSpread(r.dogSpread)}</span>
                    <span className={`mono ${r.dogML === bestDogML ? "best" : ""}`}>{fmtML(r.dogML)}</span>
                    <span className="mono">{fmtML(r.favML)}</span>
                    <span className="mono">{r.total ?? "–"}</span>
                  </div>
                ))}
              </div>
            ) : <p className="muted">Books haven't posted this one yet.</p>}
            {g.openFav != null && g.nowFav != null && (
              <div className="move mono">
                <span>OPEN <b>{fav.abbr} {fmtSpread(g.openFav)}</b></span><span className="arrow">→</span><span>NOW <b>{fav.abbr} {fmtSpread(g.nowFav)}</b></span>
                <span className={g.nowFav > g.openFav ? "c-fade" : g.nowFav < g.openFav ? "c-ok" : "muted"}>
                  {g.nowFav > g.openFav ? "toward the dog" : g.nowFav < g.openFav ? "toward the fav" : "no move"}
                </span>
              </div>
            )}
          </section>

          <section className="card">
            <div className="cardh"><h3>{fav.short} win chance</h3><span className="mono muted">FAVORITE WIN PROBABILITY</span></div>
            <div className="probs">
              {probs.map((p) => (
                <div key={p.label} className="prob">
                  <span>{p.label}</span>
                  <div className="bar"><i style={{ width: `${p.v ?? 0}%`, background: fav.color }} /></div>
                  <b className="mono">{p.v != null ? `${Math.round(p.v)}%` : "–"}</b>
                </div>
              ))}
            </div>
            {g.kalshi && <p className="muted small mono">${g.kalshi.volume.toLocaleString()} traded on Kalshi · {g.bets.toLocaleString()} bets tracked</p>}
          </section>
        </div>

        <div className="col">
          <Brief id={g.id} />

          <section className="card">
            <div className="cardh"><h3>{fav.short}'s schedule</h3><span className="mono muted">LAST · THIS · NEXT</span></div>
            <div className="runway">
              <div><span className="mono">LAST WEEK</span><b>{g.favPrev || "–"}</b>{g.favRest != null && <small>{g.favRest} days ago</small>}</div>
              <div className="now"><span className="mono">THIS WEEK</span><b>{dog.short}</b><small>{g.line}</small></div>
              <div><span className="mono">NEXT WEEK</span><b>{g.favNext || "–"}</b></div>
            </div>
          </section>

          <section className="card two">
            <div><span className="mono muted">KICKOFF WEATHER</span><b>{g.weather ? `${g.weather.tempF}°F` : g.venue.indoor ? "Dome" : "–"}</b>
              {g.weather && <small>{g.weather.windMph} mph wind · {g.weather.precipPct}% rain</small>}</div>
            <div><span className="mono muted">DOG REST</span><b>{g.dogRest != null ? `${g.dogRest} days` : "–"}</b><small>{dog.short}</small></div>
          </section>

          <BuzzPanel buzz={buzz} away={{ abbr: g.away.abbr, short: g.away.short, color: g.away.color }} home={{ abbr: g.home.abbr, short: g.home.short, color: g.home.color }} />

          {news.length > 0 && (
            <section className="card">
              <div className="cardh"><h3>Latest news</h3><span className="mono muted">ESPN</span></div>
              <ul className="wire">
                {news.map((n) => (
                  <li key={n.headline}>{n.url ? <a href={n.url} target="_blank" rel="noreferrer">{n.headline}</a> : n.headline}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
