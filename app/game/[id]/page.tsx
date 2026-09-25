import Link from "next/link";
import { notFound } from "next/navigation";
import { getGameDetail, getSlate } from "@/lib/data";
import { getGameDayId } from "@/lib/gameday";
import { getLive } from "@/lib/live";
import { getBuzz } from "@/lib/buzz";
import { getRecap } from "@/lib/recap";
import Ring from "@/components/Ring";
import SaveButton from "@/components/SaveButton";
import Kickoff from "@/components/Kickoff";
import Brief from "@/components/Brief";
import LiveBar from "@/components/LiveBar";
import BuzzPanel from "@/components/BuzzPanel";
import PickBar from "@/components/PickBar";
import LiveOdds from "@/components/LiveOdds";
import Recap, { StandaloneGame } from "@/components/Recap";

export const revalidate = 300;
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
  const g = d.game;
  const [liveMap, buzz, gd] = await Promise.all([getLive(), getBuzz(g.away, g.home), getSlate().then((s) => getGameDayId(s.games))]);
  const live = liveMap[g.id] || null;
  const fav = g[g.favorite], dog = g[g.favorite === "home" ? "away" : "home"];
  const started = !!recap && recap.state !== "pre";
  const toH = (v: number | null) => (v == null ? null : g.favorite === "home" ? v : -v);
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
            </div>
            <Team side="home" />
          </div>
          <LiveBar id={g.id} date={g.date} away={g.away.abbr} home={g.home.abbr} initial={live} />
          <div className="gchips">
            {gd === g.id && <span className="chip2 gdchip">★ College GameDay</span>}
            <span className="chip2"><Kickoff date={g.date} long /></span>
            {g.network && <span className="chip2">TV · {g.network}</span>}
            <span className="chip2">{g.venue.city ? `${g.venue.city}, ${g.venue.state}` : g.venue.name}</span>
            <span className="chip2 strong">{g.line}{g.total ? ` · O/U ${g.total}` : ""}</span>
            <SaveButton id={g.id} big />
          </div>
        </div>
      </section>

      <nav className="gnav">
        <div className="wrap gnavin">
          {started && <a href="#recap">{recap!.state === "post" ? "Recap" : "Live"}</a>}
          <a href="#overview">Overview</a>
          <a href="#odds">Live odds</a>
          <a href="#buzz">The buzz</a>
        </div>
      </nav>

      {started && <div className="wrap gsec" id="recap"><Recap r={recap!} /></div>}

      <div className="wrap gsec" id="overview">
        <div className="ggrid">
          <div className="col">
            <PickBar id={g.id} date={g.date} state={g.state} fav={g.favorite} line={g.line} away={{ abbr: g.away.abbr, short: g.away.short, logo: g.away.logo, color: g.away.color }} home={{ abbr: g.home.abbr, short: g.home.short, logo: g.home.logo, color: g.home.color }} />
            <section className="card">
              <div className="cardh"><h3>Why it's flagged</h3><span className="mono muted">{g.factors.length} SIGNALS · TAPE {g.score}</span></div>
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
          </div>
          <div className="col">
            <Brief id={g.id} />
            <section className="card">
              <div className="cardh"><h3>The spot</h3><span className="mono muted">{fav.short.toUpperCase()}'S WEEK</span></div>
              <div className="runway">
                <div><span className="mono">LAST WEEK</span><b>{g.favPrev || "–"}</b>{g.favRest != null && <small>{g.favRest} days ago</small>}</div>
                <div className="now"><span className="mono">THIS WEEK</span><b>{dog.short}</b><small>{g.line}</small></div>
                <div><span className="mono">NEXT WEEK</span><b>{g.favNext || "–"}</b></div>
              </div>
              <div className="spotmeta">
                <div><span className="mono">WEATHER</span><b>{g.weather ? `${g.weather.tempF}°` : g.venue.indoor ? "Dome" : "–"}</b><small>{g.weather ? `${g.weather.windMph} mph · ${g.weather.precipPct}% rain` : ""}</small></div>
                <div><span className="mono">{fav.abbr} REST</span><b>{g.favRest != null ? `${g.favRest}d` : "–"}</b></div>
                <div><span className="mono">{dog.abbr} REST</span><b>{g.dogRest != null ? `${g.dogRest}d` : "–"}</b></div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="wrap gsec" id="odds">
        <LiveOdds id={g.id} fav={g.favorite} fpi={g.fpi} fallbackBookFav={g.bookFavProb}
          away={{ abbr: g.away.abbr, short: g.away.short, color: g.away.color }} home={{ abbr: g.home.abbr, short: g.home.short, color: g.home.color }}
          initial={{ books: g.books, openH: toH(g.openFav), consH: toH(g.nowFav), total: g.total, ml: [null, null], kalshi: g.kalshi, bets: g.bets, at: new Date().toISOString() }} />
      </div>

      <div className="wrap gsec" id="buzz">
        <BuzzPanel buzz={buzz} away={{ abbr: g.away.abbr, short: g.away.short, color: g.away.color }} home={{ abbr: g.home.abbr, short: g.home.short, color: g.home.color }} />
      </div>
    </main>
  );
}
