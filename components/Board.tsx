"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LiteGame } from "@/lib/data";
import type { Live } from "@/lib/live";
import SaveButton, { useSaved } from "./SaveButton";
import Kickoff from "./Kickoff";
import { useLive } from "./useLive";

type Tab = "fade" | "scores" | "heat" | "saved";

function Matchup({ g, lv }: { g: LiteGame; lv?: Live }) {
  const scored = lv && lv.state !== "pre" && lv.home != null;
  const T = ({ t, side }: { t: any; side: "home" | "away" }) => {
    const sc = scored ? lv![side] : null, other = scored ? lv![side === "home" ? "away" : "home"] : null;
    return (
      <div className={`mt ${g.favorite === side ? "fav" : ""} ${scored && sc! > other! ? "win" : ""}`}>
        {t.logo ? <img src={t.logo} alt="" /> : <span className="dotc" style={{ background: t.color }} />}
        <span className="nm">{t.rank && <sup>{t.rank}</sup>}{t.short}</span>
        {scored ? <span className="sc mono">{sc}</span> : <span className="rc mono">{t.record}</span>}
      </div>
    );
  };
  return <div className="matchup"><T t={g.away} side="away" /><T t={g.home} side="home" /></div>;
}

function Status({ g, lv }: { g: LiteGame; lv?: Live }) {
  const st = lv?.state ?? g.state;
  if (st === "in") return <span className="ln"><b className="livetag"><i />LIVE</b><small className="mono">{lv?.detail}</small></span>;
  if (st === "post") return <span className="ln"><b className="muted">FINAL</b><small className="mono">{g.line}</small></span>;
  return <span className="ln"><b>{g.line}</b><small className="mono"><Kickoff date={g.date} />{g.network ? ` · ${g.network}` : ""}</small></span>;
}

function ScoreCard({ g, lv }: { g: LiteGame; lv?: Live }) {
  const st = lv?.state ?? g.state;
  return (
    <Link href={`/game/${g.id}`} className={`scard ${st}`} style={{ ["--c" as any]: g[g.favorite].color }}>
      <div className="shead mono">
        {st === "in" ? <span className="livetag"><i />LIVE · {lv?.detail}</span> : st === "post" ? <span>FINAL</span> : <span><Kickoff date={g.date} />{g.network ? ` · ${g.network}` : ""}</span>}
        <span className={`tiny t-${g.tier}`}>{g.tier} {g.score}</span>
      </div>
      <Matchup g={g} lv={lv} />
      <div className="sfoot mono">
        {st === "in" && lv?.down ? <span className={lv.redZone ? "c-fade" : ""}>{lv.down}</span> : <span className="muted">{g.line}{g.total ? ` · O/U ${g.total}` : ""}</span>}
      </div>
    </Link>
  );
}

export default function Board({ games, week, season, updated, initialTab, initialLive }: {
  games: LiteGame[]; week: number | null; season: number | null; updated: string; initialTab: Tab; initialLive: Record<string, Live>;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [tier, setTier] = useState<"ALL" | "FADE" | "WATCH">("ALL");
  const [ranked, setRanked] = useState(false);
  const [q, setQ] = useState("");
  const { ids } = useSaved();
  const live = useLive(initialLive);
  useEffect(() => setTab(initialTab), [initialTab]);

  const stateOf = (g: LiteGame) => live[g.id]?.state ?? g.state;
  const match = (g: LiteGame) => !q || `${g.home.name} ${g.away.name} ${g.home.abbr} ${g.away.abbr}`.toLowerCase().includes(q.toLowerCase());
  const open = useMemo(() => games.filter((g) => stateOf(g) !== "post"), [games, live]); // eslint-disable-line
  const liveCount = useMemo(() => games.filter((g) => stateOf(g) === "in").length, [games, live]); // eslint-disable-line

  const list = useMemo(() => {
    let l = tab === "saved" ? games.filter((g) => ids.includes(g.id)) : open;
    if (tab === "fade" || tab === "heat") {
      if (tier === "FADE") l = l.filter((g) => g.tier === "FADE");
      if (tier === "WATCH") l = l.filter((g) => g.tier !== "HOLD");
      if (ranked) l = l.filter((g) => g[g.favorite].rank);
    }
    return [...l.filter(match)].sort((a, b) => (tab === "heat" ? b.heat - a.heat : b.score - a.score));
  }, [games, open, tab, tier, ranked, q, ids]); // eslint-disable-line

  const groups = useMemo(() => {
    const all = games.filter(match);
    return [
      { key: "in", title: "Live now", items: all.filter((g) => stateOf(g) === "in") },
      { key: "pre", title: "Up next", items: all.filter((g) => stateOf(g) === "pre").sort((a, b) => Date.parse(a.date) - Date.parse(b.date)) },
      { key: "post", title: "Final", items: all.filter((g) => stateOf(g) === "post") },
    ].filter((x) => x.items.length);
  }, [games, live, q]); // eslint-disable-line

  const go = (t: Tab) => { setTab(t); history.replaceState(null, "", t === "fade" ? "/board" : `/board?tab=${t}`); };
  const titles: Record<Tab, [string, string]> = {
    fade: ["The Fade Board", "Every FBS favorite still to play, graded on how badly it's set up to stumble. Tap any game for the full file."],
    scores: ["Scores", "Every FBS game this week. Live scores update on their own — no refresh needed."],
    heat: ["Biggest games", "Ranked by heat: bets tracked across books, prediction-market volume, rankings and TV window."],
    saved: ["Your saved tape", "Games you bookmarked. Stored on this device."],
  };

  return (
    <div className="wrap board">
      <div className="bhead">
        <div>
          <div className="eyebrow mono">{season ?? ""} · WEEK {week ?? "—"} · UPDATED <Kickoff date={updated} /></div>
          <h1 className="btitle">{titles[tab][0]}</h1>
          <p className="muted">{titles[tab][1]}</p>
        </div>
        <div className="tally">
          {liveCount > 0 && <button onClick={() => go("scores")}><b className="c-fade">{liveCount}</b><span>Live</span></button>}
          <button onClick={() => { go("fade"); setTier("FADE"); }}><b className="c-fade">{open.filter((g) => g.tier === "FADE").length}</b><span>Fades</span></button>
          <button onClick={() => { go("fade"); setTier("WATCH"); }}><b className="c-watch">{open.filter((g) => g.tier === "WATCH").length}</b><span>Watch</span></button>
          <button onClick={() => { go("fade"); setTier("ALL"); }}><b>{open.length}</b><span>To play</span></button>
        </div>
      </div>

      <div className="controls">
        <div className="tabs">
          <button className={tab === "fade" ? "on" : ""} onClick={() => go("fade")}>Fade Board</button>
          <button className={tab === "scores" ? "on" : ""} onClick={() => go("scores")}>Scores{liveCount > 0 && <i className="ldot" />}</button>
          <button className={tab === "heat" ? "on" : ""} onClick={() => go("heat")}>Biggest</button>
          <button className={tab === "saved" ? "on" : ""} onClick={() => go("saved")}>Saved <em>{ids.length}</em></button>
        </div>
        <div className="filters">
          {(tab === "fade" || tab === "heat") && (<>
            {(["ALL", "FADE", "WATCH"] as const).map((t) => (
              <button key={t} className={`pill ${tier === t ? "on" : ""}`} onClick={() => setTier(t)}>{t === "ALL" ? "All" : t === "FADE" ? "Fades" : "Watch+"}</button>
            ))}
            <button className={`pill ${ranked ? "on" : ""}`} onClick={() => setRanked(!ranked)}>Ranked favs</button>
          </>)}
          <div className="searchwrap">
            <input className="search" placeholder="Filter this week's games" value={q} onChange={(e) => setQ(e.target.value)} />
            {q && <button className="clr" onClick={() => setQ("")} aria-label="Clear">×</button>}
          </div>
        </div>
      </div>

      {tab === "scores" ? (
        <div className="scores">
          {groups.map((grp) => (
            <section key={grp.key}>
              <h2 className="gtitle mono">{grp.key === "in" && <span className="dotrec" />}{grp.title} <span className="muted">{grp.items.length}</span></h2>
              <div className="scoregrid">{grp.items.map((g) => <ScoreCard key={g.id} g={g} lv={live[g.id]} />)}</div>
            </section>
          ))}
          {groups.length === 0 && <div className="empty">No games match “{q}”.</div>}
        </div>
      ) : (
        <div className="table">
          <div className="thead mono">
            <span>#</span><span>Matchup</span><span>Line</span><span>{tab === "heat" ? "Heat" : "Why it's flagged"}</span><span>{tab === "heat" ? "Action" : "Tape"}</span><span />
          </div>
          {list.map((g, k) => (
            <Link key={g.id} href={`/game/${g.id}`} className="row" style={{ ["--c" as any]: g[g.favorite].color, animationDelay: `${Math.min(k, 20) * 25}ms` }}>
              <span className="idx mono">{String(k + 1).padStart(2, "0")}</span>
              <Matchup g={g} lv={live[g.id]} />
              <Status g={g} lv={live[g.id]} />
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
              {tab === "saved" ? <>No saved games yet. Tap the bookmark on any game to keep it here.</> : games.length ? <>Nothing matches. <button className="linkbtn" onClick={() => { setQ(""); setTier("ALL"); setRanked(false); }}>Clear filters</button></> : "The slate is loading from the books. Refresh in a minute."}
            </div>
          )}
        </div>
      )}
      <p className="hint mono">TIP: PRESS ⌘K OR / TO JUMP TO ANY TEAM</p>
    </div>
  );
}
