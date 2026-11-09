"use client";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import type { LiteGame } from "@/lib/data";
import type { Live } from "@/lib/live";
import SaveButton, { useSaved, useFollow } from "./SaveButton";
import Kickoff from "./Kickoff";
import { useLive } from "./useLive";
import { interest } from "@/lib/taste";

type Tab = "board" | "scores" | "saved";
type Lens = "foryou" | "upset" | "watch" | "live" | "mine" | "ranked" | "steam" | "weather" | "prime" | "all";
const NATIONAL = ["ABC", "CBS", "FOX", "NBC", "ESPN"];
const etHour = (d: string) => (new Date(d).getUTCHours() + 20) % 24;

const LENSES: { id: Lens; label: string; hint: string }[] = [
  { id: "foryou", label: "For you", hint: "Your teams and what you watch" },
  { id: "upset", label: "Upset watch", hint: "Favorites most likely to slip" },
  { id: "watch", label: "Must-watch", hint: "Close lines, big names, big buzz" },
  { id: "live", label: "Live now", hint: "Games in progress" },
  { id: "mine", label: "Your teams", hint: "Teams you follow" },
  { id: "ranked", label: "Ranked on alert", hint: "Top-25 favorites flagged" },
  { id: "steam", label: "Line moving", hint: "Spread sliding to the dog" },
  { id: "weather", label: "Weather games", hint: "Wind, rain or cold" },
  { id: "prime", label: "Primetime", hint: "Night games on national TV" },
  { id: "all", label: "All games", hint: "Everything left to play" },
];

function Matchup({ g, lv, mine }: { g: LiteGame; lv?: Live; mine: string[] }) {
  const scored = lv && lv.state !== "pre" && lv.home != null;
  const T = ({ t, side }: { t: any; side: "home" | "away" }) => {
    const sc = scored ? lv![side] : null, other = scored ? lv![side === "home" ? "away" : "home"] : null;
    return (
      <div className={`mt ${g.favorite === side ? "fav" : ""} ${scored && sc! > other! ? "win" : ""}`}>
        {t.logo ? <img src={t.logo} alt="" /> : <span className="dotc" style={{ background: t.color }} />}
        <span className="nm">{t.rank && <sup>{t.rank}</sup>}{t.short}{mine.includes(t.id) && <em className="star"> ★</em>}</span>
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

function Feature({ label, g, note }: { label: string; g?: LiteGame; note: string }) {
  if (!g) return null;
  return (
    <Link href={`/game/${g.id}`} className="feat" style={{ ["--c" as any]: g[g.favorite].color }}>
      <span className="mono flabel">{label}</span>
      <div className="flogos">{g.away.logo && <img src={g.away.logo} alt="" />}<span className="mono">@</span>{g.home.logo && <img src={g.home.logo} alt="" />}</div>
      <b className="fname">{g.away.short} @ {g.home.short}</b>
      <span className="mono muted small">{g.line} · <Kickoff date={g.date} /></span>
      <span className="fnote">{note}</span>
    </Link>
  );
}

function ScoreCard({ g, lv, mine }: { g: LiteGame; lv?: Live; mine: string[] }) {
  const st = lv?.state ?? g.state;
  const scored = st !== "pre" && lv?.home != null && lv?.away != null;
  const Row = ({ s }: { s: "home" | "away" }) => {
    const t = g[s], sc = scored ? lv![s]! : null, other = scored ? lv![s === "home" ? "away" : "home"]! : null;
    const lead = scored && sc! > other!;
    return (
      <div className={`sc-row ${scored && !lead ? "dim" : ""}`}>
        {t.logo && <img src={t.logo} alt="" />}
        <span className="sc-name">{t.rank ? <em>{t.rank}</em> : null}{t.short}{mine.includes(t.id) && <i className="star"> ★</i>}</span>
        {st === "in" && lv?.poss === t.id && <i className="sc-poss" title="Has the ball" />}
        {scored ? <b className="sc-pts">{sc}</b> : <span className="sc-rec">{t.record}</span>}
      </div>
    );
  };
  return (
    <Link href={`/game/${g.id}`} className={`scard2 ${st}`}>
      <div className="sc-top">
        {st === "in" ? <span className="sc-live"><i />{lv?.detail}</span> : st === "post" ? <span className="sc-final">Final{/OT/.test(lv?.detail || "") ? " (OT)" : ""}</span> : <span><Kickoff date={g.date} /></span>}
        <span className="muted">{g.network || ""}</span>
      </div>
      <Row s="away" /><Row s="home" />
      <div className="sc-foot">
        {st === "in" && lv?.down ? <span className={lv.redZone ? "c-fade" : ""}>{lv.down}{lv.redZone ? " · Red zone" : ""}</span>
          : st === "pre" ? <span>{g.line}{g.total ? ` · O/U ${g.total}` : ""}{g.upsetPct >= 30 ? <em className="sc-up"> · {g.upsetPct}% upset chance</em> : null}</span>
          : <span className="muted">Closed {g.line}</span>}
      </div>
    </Link>
  );
}

export default function Board({ games, week, season, updated, initialTab, initialLive, gameday }: {
  games: LiteGame[]; week: number | null; season: number | null; updated: string; initialTab: string; initialLive: Record<string, Live>; gameday?: string | null;
}) {
  const startTab: Tab = initialTab === "scores" ? "scores" : initialTab === "saved" ? "saved" : "board";
  const [tab, setTab] = useState<Tab>(startTab);
  const [lens, setLens] = useState<Lens>(initialTab === "heat" ? "watch" : "upset");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"upset" | "watch" | "time" | "close">(initialTab === "heat" ? "watch" : "upset");
  const [byTime, setByTime] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sf, setSf] = useState<"all" | "live" | "top25" | "mine">("all");
  const { ids: saved } = useSaved();
  const { ids: mine, list: myTeams, toggle: toggleTeam } = useFollow();
  const live = useLive(initialLive);
  useEffect(() => { setTab(startTab); if (initialTab === "heat") setLens("watch"); }, [initialTab]); // eslint-disable-line

  const stateOf = (g: LiteGame) => live[g.id]?.state ?? g.state;
  const match = (g: LiteGame) => !q || `${g.home.name} ${g.away.name} ${g.home.abbr} ${g.away.abbr}`.toLowerCase().includes(q.toLowerCase());
  const open = useMemo(() => games.filter((g) => stateOf(g) !== "post"), [games, live]); // eslint-disable-line
  const test: Record<Lens, (g: LiteGame) => boolean> = {
    foryou: () => true,
    all: () => true,
    upset: (g) => g.tier !== "HOLD",
    watch: () => true,
    live: (g) => stateOf(g) === "in",
    mine: (g) => mine.includes(g.home.id) || mine.includes(g.away.id),
    ranked: (g) => !!g[g.favorite].rank && g.tier !== "HOLD",
    steam: (g) => g.keys.includes("steam"),
    weather: (g) => g.keys.includes("weather"),
    prime: (g) => etHour(g.date) >= 19 && NATIONAL.some((n) => (g.network || "").includes(n)),
  };
  const base = (l: Lens) => (l === "live" || l === "mine" ? games : open).filter(test[l]);
  const counts = useMemo(() => Object.fromEntries(LENSES.map((l) => [l.id, base(l.id).length])) as Record<Lens, number>, [games, live, mine]); // eslint-disable-line
  const byWatch = lens === "watch" || lens === "prime";
  // Personal score: teams you follow, teams you keep opening or watching, then watchability.
  const personal = (g: LiteGame) => (mine.includes(g.home.id) || mine.includes(g.away.id) ? 6 : 0) + interest([g.home.id, g.away.id]) + g.watch / 40;
  const list = useMemo(() => [...base(lens).filter(match)].sort((a, b) =>
    lens === "foryou" ? personal(b) - personal(a) || b.watch - a.watch
    : sort === "watch" ? (b.id === gameday ? 1 : 0) - (a.id === gameday ? 1 : 0) || b.watch - a.watch
    : sort === "time" ? Date.parse(a.date) - Date.parse(b.date)
    : sort === "close" ? (a.spread ?? 99) - (b.spread ?? 99)
    : b.score - a.score), [games, live, mine, lens, q, sort, gameday]); // eslint-disable-line

  const upsetPick = useMemo(() => [...open].sort((a, b) => b.score - a.score)[0], [open]);
  const watchPick = useMemo(() => open.find((g) => g.id === gameday) || [...open].sort((a, b) => b.watch - a.watch).find((g) => g.id !== upsetPick?.id), [open, upsetPick, gameday]);
  const steamPick = useMemo(() => [...open].filter((g) => g.keys.includes("steam")).sort((a, b) => b.score - a.score).find((g) => g.id !== upsetPick?.id && g.id !== watchPick?.id), [open, upsetPick, watchPick]);

  // Scores: one tab per day (Eastern time). Inside a day: live, then upcoming by kickoff, then finals.
  const dayKey = (d: string) => new Date(d).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const dayName = (d: string, style: "short" | "long") => new Date(d).toLocaleDateString("en-US", style === "short" ? { weekday: "short", timeZone: "America/New_York" } : { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" });
  const scoreOk = (g: LiteGame) => match(g) && (sf === "all" || (sf === "live" && stateOf(g) === "in")
    || (sf === "top25" && !!(g.home.rank || g.away.rank)) || (sf === "mine" && (mine.includes(g.home.id) || mine.includes(g.away.id))));
  const days = useMemo(() => {
    const m = new Map<string, { key: string; date: string; games: LiteGame[] }>();
    for (const g of [...games].sort((a, b) => Date.parse(a.date) - Date.parse(b.date))) {
      const k = dayKey(g.date);
      if (!m.has(k)) m.set(k, { key: k, date: g.date, games: [] });
      m.get(k)!.games.push(g);
    }
    return [...m.values()];
  }, [games]); // eslint-disable-line
  const defaultDay = useMemo(() => (days.find((d) => d.games.some((g) => stateOf(g) === "in"))
    || days.find((d) => d.games.some((g) => stateOf(g) === "pre")) || days[days.length - 1])?.key || "all", [days]); // eslint-disable-line
  const [day, setDay] = useState<string>("");
  const curDay = day || defaultDay;
  const rank = (g: LiteGame) => ({ in: 0, pre: 1, post: 2 } as Record<string, number>)[stateOf(g)] ?? 1;
  const groups = useMemo(() => days
    .filter((d) => curDay === "all" || d.key === curDay)
    .map((d) => ({ key: d.key, title: dayName(d.date, "long"), items: d.games.filter(scoreOk).sort((a, b) => rank(a) - rank(b) || Date.parse(a.date) - Date.parse(b.date)) }))
    .filter((d) => d.items.length), [days, curDay, live, q, sf, mine]); // eslint-disable-line

  // Fade report card: how flagged games actually finished this week.
  const report = useMemo(() => {
    const fin = games.filter((g) => stateOf(g) === "post" && live[g.id]?.home != null);
    if (!fin.length) return null;
    const rows = fin.map((g) => {
      const lv = live[g.id]!;
      const favS = g.favorite === "home" ? lv.home! : lv.away!, dogS = g.favorite === "home" ? lv.away! : lv.home!;
      const upset = dogS > favS;
      return { g, upset, cover: g.spread != null ? dogS - favS + g.spread > 0 : upset };
    });
    const flagged = rows.filter((x) => x.g.tier !== "HOLD");
    return { rows, upsets: rows.filter((x) => x.upset), flagged, fu: flagged.filter((x) => x.upset).length, fc: flagged.filter((x) => x.cover).length };
  }, [games, live]); // eslint-disable-line

  const go = (t: Tab) => { setTab(t); history.replaceState(null, "", t === "board" ? "/board" : `/board?tab=${t}`); };
  const cur = LENSES.find((l) => l.id === lens)!;

  // Kickoff window in Eastern time (deterministic on server and client).
  const slot = (d: string) => {
    const et = new Date(Date.parse(d) - 4 * 3600000);
    const h = et.getUTCHours();
    return `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][et.getUTCDay()]} · ${h < 15 ? "Early window" : h < 19 ? "Afternoon" : "Prime time"}`;
  };

  const renderRow = (g: LiteGame, k: number) => {
    const isOpen = expanded === g.id;
    const fav = g[g.favorite];
    return (
      <Fragment key={g.id}>
        <Link href={`/game/${g.id}`} className={`row brow ${isOpen ? "open" : ""}`} style={{ ["--c" as any]: fav.color, animationDelay: `${Math.min(k, 20) * 20}ms` }}>
          <span className="idx mono">{String(k + 1).padStart(2, "0")}</span>
          <Matchup g={g} lv={live[g.id]} mine={mine} />
          <Status g={g} lv={live[g.id]} />
          <span className="sig">{g.id === gameday && <em className="gd">GameDay</em>}<span className="sigtxt">{g.signals.length ? g.signals.join(" · ") : "Clean spot"}</span></span>
          <span className={`score t-${g.tier}`}><b>{g.score}</b><small>{g.tier}</small><em className="upc mono">{g.upsetPct}% upset</em></span>
          <span className="wcell"><b className="mono">{g.watch}</b><i><u style={{ width: `${g.watch}%` }} /></i></span>
          <span className="rowact">
            <SaveButton id={g.id} />
            <button className={`peek ${isOpen ? "on" : ""}`} aria-label="Quick look" aria-expanded={isOpen}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(isOpen ? null : g.id); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m6 9 6 6 6-6" /></svg>
            </button>
          </span>
        </Link>
        {isOpen && (
          <div className="peekbox" style={{ ["--c" as any]: fav.color }}>
            <div className="pkf">
              <div className="mono muted small">WHY {fav.short.toUpperCase()} IS FLAGGED</div>
              {g.factors.length ? g.factors.map((f) => (
                <div key={f.key} className="pkr">
                  <span className={`pts mono ${f.points < 0 ? "neg" : ""}`}>{f.points > 0 ? "+" : ""}{f.points}</span>
                  <div><b>{f.label}</b><small>{f.detail}</small></div>
                </div>
              )) : <p className="muted">No red flags. Clean spot for {fav.short}.</p>}
            </div>
            <div className="pks">
              <div><span className="mono">UPSET CHANCE</span><b>{g.upsetPct}%</b></div>
              {g.kalshi && <div><span className="mono">KALSHI</span><b>{fav.abbr} {Math.round(g.kalshi[g.favorite] * 100)}%</b></div>}
              <div><span className="mono">TOTAL</span><b>{g.total ?? "–"}</b></div>
              <div><span className="mono">BETS TRACKED</span><b>{g.bets ? g.bets.toLocaleString() : "–"}</b></div>
              <div><span className="mono">WINDOW</span><b>{slot(g.date).split(" · ")[1]}</b></div>
              <Link href={`/game/${g.id}`} className="btn primary">Open full game →</Link>
            </div>
          </div>
        )}
      </Fragment>
    );
  };

  const renderRows = (items: LiteGame[]) => {
    const groups: [string, LiteGame[]][] = [];
    if (byTime) {
      for (const g of [...items].sort((a, b) => Date.parse(a.date) - Date.parse(b.date))) {
        const s = slot(g.date), last = groups[groups.length - 1];
        if (last && last[0] === s) last[1].push(g); else groups.push([s, [g]]);
      }
    } else groups.push(["", items]);
    let k = 0;
    return (
      <div className="table">
        <div className="thead brow mono"><span>#</span><span>Matchup</span><span>Line</span><span>Why it's flagged</span><span>Upset</span><span>Watch</span><span /></div>
        {groups.map(([label, lst]) => (
          <Fragment key={label || "all"}>
            {label && <div className="slot mono">{label.toUpperCase()} <span className="muted">{lst.length}</span></div>}
            {lst.map((g) => renderRow(g, k++))}
          </Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="wrap board">
      <div className="bhead">
        <div>
          <div className="eyebrow mono">{season ?? ""} · WEEK {week ?? "–"} · UPDATED <Kickoff date={updated} /></div>
          <h1 className="btitle">{tab === "scores" ? "Scores" : tab === "saved" ? "Your stuff" : "The Fade Board"}</h1>
          <p className="muted">{tab === "scores" ? "Every FBS game this week. Scores update live."
            : tab === "saved" ? "Teams you follow and games you saved, on this device."
            : "Every FBS game left to play. Upset = how shaky the favorite looks. Watch = how good the game should be."}</p>
        </div>
        {tab !== "scores" && (
          <div className="seg">
            <button className={tab === "board" ? "on" : ""} aria-pressed={tab === "board"} onClick={() => go("board")}>All games</button>
            <button className={tab === "saved" ? "on" : ""} aria-pressed={tab === "saved"} onClick={() => go("saved")}>Saved <em>{saved.length + mine.length}</em></button>
          </div>
        )}
      </div>

      {tab === "board" && (<>
        <div className="feats">
          <Feature label="Upset of the week" g={upsetPick} note={upsetPick ? `Tape ${upsetPick.score}: ${upsetPick.signals.slice(0, 2).join(" + ") || "situational spot"}` : ""} />
          <Feature label={watchPick && watchPick.id === gameday ? "College GameDay" : "Game of the week"} g={watchPick} note={watchPick ? `Watch ${watchPick.watch}${watchPick.spread != null ? ` · ${watchPick.spread}-pt line` : ""}${watchPick.home.rank && watchPick.away.rank ? " · ranked vs ranked" : ""}` : ""} />
          <Feature label="Line on the move" g={steamPick} note="The spread is moving toward the underdog" />
        </div>

        <div className="lenses" role="tablist">
          {LENSES.filter((l) => l.id !== "live" || counts.live > 0).map((l) => (
            <button key={l.id} role="tab" aria-selected={lens === l.id} className={`lens ${lens === l.id ? "on" : ""} ${l.id === "live" ? "islive" : ""}`} onClick={() => { setLens(l.id); setSort(l.id === "watch" || l.id === "prime" ? "watch" : "upset"); }}>
              <span className="lt"><b>{l.label}</b><span className="mono">{counts[l.id]}</span></span>
              <small>{l.hint}</small>
            </button>
          ))}
        </div>

        <div className="controls2">
          <div className="ctl">
            <span className="mono muted small">{cur.label} · {list.length} games</span>
            <label className="sortsel mono">SORT
              <select value={sort} onChange={(e) => setSort(e.target.value as any)}>
                <option value="upset">Upset risk</option>
                <option value="watch">Watchability</option>
                <option value="time">Kickoff time</option>
                <option value="close">Closest line</option>
              </select>
            </label>
            <button className={`pill ${byTime ? "on" : ""}`} onClick={() => setByTime(!byTime)}>Group by kickoff</button>
          </div>
          <div className="searchwrap">
            <input className="search" placeholder="Filter by team" value={q} onChange={(e) => setQ(e.target.value)} />
            {q && <button className="clr" onClick={() => setQ("")} aria-label="Clear">×</button>}
          </div>
        </div>

        {list.length ? renderRows(list) : (
          <div className="empty">
            {lens === "mine" ? <>Follow teams from their page (search with ⌘K) and their games show up here.</>
              : games.length ? <>Nothing here right now. <button className="linkbtn" onClick={() => { setQ(""); setLens("all"); }}>See all games</button></>
              : "The slate is loading from the books. Refresh in a minute."}
          </div>
        )}
      </>)}

      {tab === "scores" && (
        <div className="scores">
          <div className="sc-bar">
            <div className="sc-days" role="tablist" aria-label="Day">
              {days.map((d) => {
                const lv = d.games.some((g) => stateOf(g) === "in");
                return (
                  <button key={d.key} role="tab" aria-selected={curDay === d.key} className={curDay === d.key ? "on" : ""} onClick={() => setDay(d.key)}>
                    <span>{dayName(d.date, "short")}</span>
                    <b>{new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" })}</b>
                    <small>{lv ? <><i className="ldot" />Live</> : `${d.games.length} game${d.games.length === 1 ? "" : "s"}`}</small>
                  </button>
                );
              })}
              <button role="tab" aria-selected={curDay === "all"} className={curDay === "all" ? "on" : ""} onClick={() => setDay("all")}>
                <span>Week</span><b>All</b><small>{games.length} games</small>
              </button>
            </div>
            <div className="sc-tools">
              <div className="seg" role="group" aria-label="Filter">
                {([["all", "All"], ["live", "Live"], ["top25", "Top 25"], ["mine", "My teams"]] as const).map(([k, l]) => (
                  <button key={k} className={sf === k ? "on" : ""} aria-pressed={sf === k} onClick={() => setSf(k)}>{l}{k === "live" && counts.live ? <em>{counts.live}</em> : null}</button>
                ))}
              </div>
              <div className="searchwrap">
                <input className="search" placeholder="Find a team" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a team" />
                {q && <button className="clr" onClick={() => setQ("")} aria-label="Clear">×</button>}
              </div>
            </div>
          </div>
          {report && report.upsets.length > 0 && (
            <div className="sumbar">
              <span className="sum-l">Upsets this week</span>
              {report.upsets.slice(0, 5).map(({ g }) => {
                const dog = g[g.favorite === "home" ? "away" : "home"], fav = g[g.favorite];
                return <Link key={g.id} href={`/game/${g.id}`} className="upchip">{dog.logo && <img src={dog.logo} alt="" />}<b>{dog.short}</b><span className="muted">over {fav.short}</span></Link>;
              })}
            </div>
          )}
          {groups.map((grp) => (
            <section key={grp.key}>
              <h2 className="sc-day">{grp.title}<span className="muted">{grp.items.length}</span></h2>
              <div className="scoregrid">{grp.items.map((g) => <ScoreCard key={g.id} g={g} lv={live[g.id]} mine={mine} />)}</div>
            </section>
          ))}
          {groups.length === 0 && (
            <div className="empty">
              {q ? <>No games match “{q}”.</> : sf === "live" ? "No games are live right now." : sf === "mine" ? "None of your teams play on this day." : "No games on this day."}
              {(q || sf !== "all") && <> <button className="linkbtn" onClick={() => { setQ(""); setSf("all"); }}>Clear filters</button></>}
            </div>
          )}
          <Link href="/replay" className="textlink sc-past">Past weeks and highlights</Link>
        </div>
      )}

      {tab === "saved" && (
        <div>
          <h2 className="gtitle mono">Teams you follow <span className="muted">{myTeams.length}</span></h2>
          {myTeams.length ? (
            <div className="myteams">
              {myTeams.map((t) => (
                <div key={t.id} className="myteam">
                  <Link href={`/team/${t.id}`}>{t.logo && <img src={t.logo} alt="" />}<b>{t.name}</b></Link>
                  <button onClick={() => toggleTeam(t)} aria-label={`Unfollow ${t.name}`}>×</button>
                </div>
              ))}
            </div>
          ) : <p className="muted">No teams yet. Open any team (⌘K) and hit Follow.</p>}
          <h2 className="gtitle mono">Saved games <span className="muted">{saved.length}</span></h2>
          {games.filter((g) => saved.includes(g.id)).length
            ? renderRows(games.filter((g) => saved.includes(g.id)))
            : <p className="muted">Tap the bookmark on any game to keep it here.</p>}
        </div>
      )}
    </div>
  );
}
