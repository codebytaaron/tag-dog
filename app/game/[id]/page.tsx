import Link from "next/link";
import { notFound } from "next/navigation";
import { getGameDetail, getSlate, lite } from "@/lib/data";
import ViewTracker from "@/components/ViewTracker";
import RelatedGames from "@/components/RelatedGames";
import { getLive } from "@/lib/live";
import { getBuzz } from "@/lib/buzz";
import { getRecap } from "@/lib/recap";
import { getFPI } from "@/lib/fpi";
import { getGameDayId } from "@/lib/gameday";
import Ring from "@/components/Ring";
import SaveButton from "@/components/SaveButton";
import ShareButton from "@/components/ShareButton";
import Kickoff from "@/components/Kickoff";
import Brief from "@/components/Brief";
import LiveBar from "@/components/LiveBar";
import BuzzPanel from "@/components/BuzzPanel";
import PickBar from "@/components/PickBar";
import LiveOdds from "@/components/LiveOdds";
import GameTabs from "@/components/GameTabs";
import Recap, { StandaloneGame } from "@/components/Recap";

export const revalidate = 300;
export const maxDuration = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getGameDetail(id);
  if (d) return { title: `${d.game.away.short} at ${d.game.home.short} | TapeDog` };
  const r = await getRecap(id);
  return { title: r ? `${r.away.short} at ${r.home.short} | TapeDog` : "TapeDog" };
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const [d, recap] = await Promise.all([getGameDetail(id), getRecap(id)]);
  if (!d) { if (!recap) notFound(); return <StandaloneGame r={recap} />; }
  const g = d.game;
  const [liveMap, buzz, gd, fpiAll] = await Promise.all([getLive(), getBuzz(g.away, g.home), getSlate().then((s) => getGameDayId(s.games)), getFPI()]);
  const live = liveMap[g.id] || null;
  const fav = g[g.favorite], dog = g[g.favorite === "home" ? "away" : "home"];
  const started = !!recap && recap.state !== "pre";
  const toH = (v: number | null) => (v == null ? null : g.favorite === "home" ? v : -v);
  const fa = fpiAll[g.away.id], fh = fpiAll[g.home.id];

  const Team = ({ side }: { side: "home" | "away" }) => {
    const t = g[side];
    return (
      <div className={`gteam ${side === "home" ? "r" : ""}`}>
        {side === "away" && <img src={t.logo} alt="" />}
        <div>
          <span className="mono muted">{t.rank ? `#${t.rank} · ` : ""}{t.record}{g.favorite === side ? " · FAV" : " · DOG"}</span>
          <h2><Link href={`/team/${t.id}`} className="tlink">{t.short}</Link></h2>
        </div>
        {side === "home" && <img src={t.logo} alt="" />}
      </div>
    );
  };

  const overview = (
    <div className="gv">
      <div className="gv-main">
        <section className="card">
          <div className="cardh"><h3>Why {fav.short} is flagged</h3><span className={`gscore t-${g.tier}`}>{g.score} · {g.tier}</span></div>
          {g.factors.length === 0 && <p className="muted">Nothing situational. Clean spot for {fav.short}.</p>}
          <ul className="flist">
            {g.factors.map((f) => (
              <li key={f.key}><div><b>{f.label}</b><p>{f.detail}</p></div><span className={f.points < 0 ? "neg" : "pos"}>{f.points > 0 ? "+" : ""}{f.points}</span></li>
            ))}
          </ul>
        </section>
        {fa && fh && (
          <section className="card numbers">
            <div className="cardh"><h3>By the numbers</h3></div>
            <div className="nrow nhead"><span>{g.away.short}</span><span /><span>{g.home.short}</span></div>
            {[
              ["Power rating", `${fa.fpi} (#${fa.rank})`, `${fh.fpi} (#${fh.rank})`, fa.fpi > fh.fpi ? "away" : "home"],
              ["Offense", fa.offRank, fh.offRank, parseInt(fa.offRank) < parseInt(fh.offRank) ? "away" : "home"],
              ["Defense", fa.defRank, fh.defRank, parseInt(fa.defRank) < parseInt(fh.defRank) ? "away" : "home"],
              ["Special teams", fa.stRank, fh.stRank, parseInt(fa.stRank) < parseInt(fh.stRank) ? "away" : "home"],
              ["Projected record", `${fa.projW.toFixed(1)}-${fa.projL.toFixed(1)}`, `${fh.projW.toFixed(1)}-${fh.projL.toFixed(1)}`, fa.projW > fh.projW ? "away" : "home"],
            ].map(([l, a, h, best]) => (
              <div key={l} className="nrow"><b className={best === "away" ? "hi" : ""}>{a}</b><span>{l}</span><b className={best === "home" ? "hi" : ""}>{h}</b></div>
            ))}
            {g.ratingMargin != null && (
              <p className="nsum">Power ratings make it <b>{g.ratingMargin >= 0 ? fav.short : dog.short} by {Math.abs(g.ratingMargin)}</b>. The line is <b>{g.line}</b>.</p>
            )}
            <p className="muted small srcnote">Source: ESPN Football Power Index.</p>
          </section>
        )}
      </div>
      <aside className="gv-side">
        <PickBar id={g.id} date={g.date} state={g.state} fav={g.favorite} line={g.line} away={{ abbr: g.away.abbr, short: g.away.short, logo: g.away.logo, color: g.away.color }} home={{ abbr: g.home.abbr, short: g.home.short, logo: g.home.logo, color: g.home.color }} />
        <section className="card">
          <div className="cardh"><h3>The spot</h3></div>
          <dl className="spotlist">
            <div><dt>Last week</dt><dd>{g.favPrev || "–"}{g.favRest != null && <small> · {g.favRest} days ago</small>}</dd></div>
            <div><dt>This week</dt><dd>{dog.short} · {g.line}</dd></div>
            <div><dt>Next week</dt><dd>{g.favNext || "–"}</dd></div>
            <div><dt>Weather</dt><dd>{g.weather ? `${g.weather.tempF}°, ${g.weather.windMph} mph wind, ${g.weather.precipPct}% rain` : g.venue.indoor ? "Indoors" : "–"}</dd></div>
            <div><dt>{dog.short} rest</dt><dd>{g.dogRest != null ? `${g.dogRest} days` : "–"}</dd></div>
          </dl>
        </section>
        <Brief id={g.id} />
      </aside>
    </div>
  );

  const tabs = [
    ...(started ? [{ id: "recap", label: recap!.state === "post" ? "Recap" : "Live", node: <Recap r={recap!} /> }] : []),
    { id: "overview", label: "Overview", node: overview },
    { id: "odds", label: "Odds", node: (
      <LiveOdds id={g.id} fav={g.favorite} fpi={g.fpi} fallbackBookFav={g.bookFavProb}
        away={{ abbr: g.away.abbr, short: g.away.short, color: g.away.color }} home={{ abbr: g.home.abbr, short: g.home.short, color: g.home.color }}
        initial={{ books: g.books, openH: toH(g.openFav), consH: toH(g.nowFav), total: g.total, ml: [null, null], kalshi: g.kalshi, bets: g.bets, at: new Date().toISOString() }} />
    ) },
    { id: "buzz", label: "Buzz", node: <BuzzPanel buzz={buzz} away={{ abbr: g.away.abbr, short: g.away.short, color: g.away.color }} home={{ abbr: g.home.abbr, short: g.home.short, color: g.home.color }} /> },
  ];

  return (
    <main className="game">
      <section className="ghero" style={{ ["--ca" as any]: g.away.color, ["--ch" as any]: g.home.color }}>
        <div className="wrap">
          <Link href="/board" className="back mono">← FADE BOARD</Link>
          <div className="gtop">
            <Team side="away" />
            <div className="gmid">
              <Ring score={g.score} tier={g.tier} size={96} />
              <div className={`stamp t-${g.tier}`}>{g.tier}</div>
              <div className="mono upc2">{g.upsetPct}% UPSET CHANCE</div>
            </div>
            <Team side="home" />
          </div>
          <LiveBar id={g.id} date={g.date} away={g.away.abbr} home={g.home.abbr} initial={live} />
          <div className="gchips">
            {gd === g.id && <span className="chip2 gdchip">College GameDay</span>}
            <span className="chip2"><Kickoff date={g.date} long /></span>
            {g.network && <span className="chip2">TV · {g.network}</span>}
            <span className="chip2">{g.venue.city ? `${g.venue.city}, ${g.venue.state}` : g.venue.name}</span>
            <span className="chip2 strong">{g.line}{g.total ? ` · O/U ${g.total}` : ""}</span>
            <span className="gact"><ShareButton title={`${g.away.short} at ${g.home.short} on TapeDog`} /><SaveButton id={g.id} big /></span>
          </div>
        </div>
      </section>
      <div className="wrap gbody"><GameTabs tabs={tabs} /></div>
      <div className="wrap"><RelatedGames games={(await getSlate()).games.filter((x) => x.state !== "post" && x.id !== g.id).map(lite)} /></div>
      <ViewTracker id={g.id} teams={[g.away.id, g.home.id]} />
    </main>
  );
}
