"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LiteGame } from "@/lib/data";
import SaveButton, { useSaved } from "./SaveButton";
import Kickoff from "./Kickoff";

type Tab = "fade" | "heat" | "saved";

function Matchup({ g }: { g: LiteGame }) {
  const T = ({ t, fav }: { t: any; fav: boolean }) => (
    <div className={`mt ${fav ? "fav" : ""}`}>
      {t.logo ? <img src={t.logo} alt="" /> : <span className="dotc" style={{ background: t.color }} />}
      <span className="nm">{t.rank && <sup>{t.rank}</sup>}{t.short}</span>
      <span className="rc mono">{t.record}</span>
    </div>
  );
  return <div className="matchup"><T t={g.away} fav={g.favorite === "away"} /><T t={g.home} fav={g.favorite === "home"} /></div>;
}

export default function Board({ games, week, season, updated, initialTab }: { games: LiteGame[]; week: number | null; season: number | null; updated: string; initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [tier, setTier] = useState<"ALL" | "FADE" | "WATCH">("ALL");
  const [ranked, setRanked] = useState(false);
  const [q, setQ] = useState("");
  const { ids } = useSaved();
  useEffect(() => setTab(initialTab), [initialTab]);

  const upcoming = useMemo(() => games.filter((g) => g.state !== "post"), [games]);
  const list = useMemo(() => {
    let l = tab === "saved" ? games.filter((g) => ids.includes(g.id)) : upcoming;
    if (tab !== "saved") {
      if (tier === "FADE") l = l.filter((g) => g.tier === "FADE");
      if (tier === "WATCH") l = l.filter((g) => g.tier !== "HOLD");
      if (ranked) l = l.filter((g) => g[g.favorite].rank);
    }
    if (q) l = l.filter((g) => `${g.home.name} ${g.away.name}`.toLowerCase().includes(q.toLowerCase()));
    return [...l].sort((a, b) => (tab === "heat" ? b.heat - a.heat : b.score - a.score));
  }, [games, upcoming, tab, tier, ranked, q, ids]);

  const counts = useMemo(() => ({
    FADE: upcoming.filter((g) => g.tier === "FADE").length,
    WATCH: upcoming.filter((g) => g.tier === "WATCH").length,
  }), [upcoming]);

  const go = (t: Tab) => { setTab(t); history.replaceState(null, "", t === "fade" ? "/board" : `/board?tab=${t}`); };

  return (
    <div className="wrap board">
      <div className="bhead">
        <div>
          <div className="eyebrow mono">{season ?? ""} · WEEK {week ?? "—"} · UPDATED <Kickoff date={updated} /></div>
          <h1 className="btitle">{tab === "heat" ? "Biggest games" : tab === "saved" ? "Your saved tape" : "The Fade Board"}</h1>
          <p className="muted">{tab === "heat"
            ? "Ranked by heat: tickets tracked across books, prediction-market volume, rankings and TV window."
            : tab === "saved" ? "Games you bookmarked. Stored on this device."
            : "Every upcoming FBS favorite, graded on how badly it's set up to stumble."}</p>
        </div>
        <div className="tally">
          <div><b className="c-fade">{counts.FADE}</b><span>Fades</span></div>
          <div><b className="c-watch">{counts.WATCH}</b><span>Watch</span></div>
          <div><b>{upcoming.length}</b><span>On tape</span></div>
        </div>
      </div>

      <div className="controls">
        <div className="tabs">
          <button className={tab === "fade" ? "on" : ""} onClick={() => go("fade")}>Fade Board</button>
          <button className={tab === "heat" ? "on" : ""} onClick={() => go("heat")}>Biggest Games</button>
          <button className={tab === "saved" ? "on" : ""} onClick={() => go("saved")}>Saved <em>{ids.length}</em></button>
        </div>
        <div className="filters">
          {tab !== "saved" && (<>
            {(["ALL", "FADE", "WATCH"] as const).map((t) => (
              <button key={t} className={`pill ${tier === t ? "on" : ""}`} onClick={() => setTier(t)}>{t === "ALL" ? "All" : t === "FADE" ? "Fades" : "Watch+"}</button>
            ))}
            <button className={`pill ${ranked ? "on" : ""}`} onClick={() => setRanked(!ranked)}>Ranked favs</button>
          </>)}
          <input className="search" placeholder="Search team" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="table">
        <div className="thead mono">
          <span>#</span><span>Matchup</span><span>Line</span><span>{tab === "heat" ? "Heat" : "Signals"}</span><span>{tab === "heat" ? "Action" : "Tape"}</span><span />
        </div>
        {list.map((g, k) => (
          <Link key={g.id} href={`/game/${g.id}`} className="row" style={{ ["--c" as any]: g[g.favorite].color, animationDelay: `${Math.min(k, 20) * 25}ms` }}>
            <span className="idx mono">{String(k + 1).padStart(2, "0")}</span>
            <Matchup g={g} />
            <span className="ln">
              <b>{g.line}</b>
              <small className="mono"><Kickoff date={g.date} />{g.network ? ` · ${g.network}` : ""}</small>
            </span>
            {tab === "heat" ? (
              <span className="heat"><i style={{ width: `${g.heat}%` }} /><small className="mono">{g.heat}</small></span>
            ) : (
              <span className="sig">{g.signals.length ? g.signals.map((s) => <em key={s}>{s}</em>) : <em className="quiet">Clean spot</em>}</span>
            )}
            {tab === "heat" ? (
              <span className="act mono">
                <b>{g.bets ? g.bets.toLocaleString() : "—"}</b><small>bets tracked</small>
                {g.kalshi && <small>${Math.round(g.kalshi.volume / 1000)}k on Kalshi</small>}
              </span>
            ) : (
              <span className={`score t-${g.tier}`}><b>{g.score}</b><small>{g.tier}</small></span>
            )}
            <SaveButton id={g.id} />
          </Link>
        ))}
        {list.length === 0 && (
          <div className="empty">
            {tab === "saved" ? <>No saved games yet. Hit the bookmark on any row to keep it on your tape.</> : games.length ? "Nothing matches that filter." : "The slate is loading from the books. Refresh in a minute."}
          </div>
        )}
      </div>
    </div>
  );
}
