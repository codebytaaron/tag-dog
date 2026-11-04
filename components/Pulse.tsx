"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Futures, Mkt, Poll, Series, Standing } from "@/lib/pulse";
import { useFollow, useProfile } from "./SaveButton";

const TABS: [string, string][] = [
  ["ap", "AP Top 25"], ["coaches", "Coaches"], ["title", "Title odds"], ["playoff", "Playoff odds"],
  ["heisman", "Heisman"], ["conf", "Conferences"], ["hotseat", "Hot seat"],
];
const KEY: Record<string, string> = { "Southeastern Conference": "SEC", "Big Ten Conference": "Big Ten", "Big 12 Conference": "Big 12", "Atlantic Coast Conference": "ACC" };

function Move({ rank, prev }: { rank: number; prev: number | null }) {
  if (!prev) return <span className="mv new mono">NEW</span>;
  const d = prev - rank;
  if (!d) return <span className="mv mono">–</span>;
  return <span className={`mv mono ${d > 0 ? "up" : "down"}`}>{d > 0 ? "▲" : "▼"}{Math.abs(d)}</span>;
}

function Odds({ s, mine, limit = 25, note, alt }: { s: Series; mine: Set<string>; limit?: number; note: string; alt?: Record<string, number> }) {
  const hasAlt = !!alt && Object.keys(alt).length > 0;
  if (!s || !s.markets.length) return <p className="muted empty">This market isn't open right now.</p>;
  const top = s.markets[0].p;
  return (
    <div className="odds">
      <p className="mono muted small onote">{note} · {hasAlt ? "KALSHI, THEN POLYMARKET" : "LIVE FROM KALSHI"} · 24H CHANGE</p>
      {s.markets.slice(0, limit).map((m: Mkt, k) => {
        const ch = m.prev != null ? Math.round((m.p - m.prev) * 100) : 0;
        const Name = m.team ? <Link href={`/team/${m.team.id}`} className="oname">{m.team.logo && <img src={m.team.logo} alt="" />}<b>{m.label}</b>{mine.has(m.team.id) && <em className="star"> ★</em>}</Link>
          : <span className="oname"><span className="oini">{m.label.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span><b>{m.label}</b></span>;
        return (
          <div key={m.label} className={`orow ${hasAlt ? "withalt" : ""}`} style={{ ["--c" as any]: m.team?.color || "var(--tape)" }}>
            <span className="mono ork">{k + 1}</span>
            {Name}
            <div className="obar"><i style={{ width: `${(m.p / top) * 100}%` }} /></div>
            <b className="mono opct">{Math.round(m.p * 100)}%</b>
            {hasAlt && <span className="mono opct alt">{m.team && alt![m.team.id] != null ? `${Math.round(alt![m.team.id] * 100)}%` : "–"}</span>}
            <span className={`mono och ${ch > 0 ? "up" : ch < 0 ? "down" : ""}`}>{ch > 0 ? `▲${ch}` : ch < 0 ? `▼${-ch}` : "–"}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Pulse({ polls, standings, futures, initialTab }: { polls: Poll[]; standings: Standing[]; futures: Futures; initialTab: string }) {
  const [tab, setTab] = useState(TABS.some(([k]) => k === initialTab) ? initialTab : "ap");
  const [conf, setConf] = useState(standings.find((s) => s.conf.startsWith("Southeastern"))?.conf || standings[0]?.conf || "");
  const { ids } = useFollow();
  const { profile } = useProfile();
  const mine = new Set([...ids, profile?.teamId].filter(Boolean) as string[]);
  useEffect(() => { history.replaceState(null, "", tab === "ap" ? "/rankings" : `/rankings?tab=${tab}`); }, [tab]);

  const poll = tab === "coaches" ? polls[1] : polls[0];
  const st = standings.find((s) => s.conf === conf);
  const confOdds = KEY[conf] ? futures.conf[KEY[conf]] : null;

  return (
    <div className="wrap board">
      <div className="bhead">
        <div>
          <div className="eyebrow mono">UPDATED AUTOMATICALLY · ESPN + KALSHI</div>
          <h1 className="btitle">Rankings & odds</h1>
          <p className="muted">The polls, every conference race, and what the prediction market thinks about titles, the playoff, the Heisman and coaches on the hot seat.</p>
        </div>
      </div>

      <div className="ptabs">
        {TABS.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}
        <Link href="/playoff" className="ptab-link">Playoff bracket ›</Link>
        <Link href="/record" className="ptab-link">Our track record ›</Link>
      </div>

      {(tab === "ap" || tab === "coaches") && (poll ? (
        <div className="table polltab">
          <div className="thead prow mono"><span>RK</span><span>TEAM</span><span>RECORD</span><span>POINTS</span><span>MOVE</span></div>
          {poll.rows.map((r) => (
            <Link key={r.team.id} href={`/team/${r.team.id}`} className="row prow" style={{ ["--c" as any]: r.team.color }}>
              <b className="prk">{r.rank}</b>
              <span className="pteam">{r.team.logo && <img src={r.team.logo} alt="" />}<b>{r.team.name}</b>{r.fpv > 0 && <small className="mono muted">({r.fpv})</small>}{mine.has(r.team.id) && <em className="star">★</em>}</span>
              <span className="mono">{r.record}</span>
              <span className="mono muted">{r.points.toLocaleString()}</span>
              <Move rank={r.rank} prev={r.prev} />
            </Link>
          ))}
          {poll.others && <p className="mono muted small others">ALSO RECEIVING VOTES: {poll.others}</p>}
        </div>
      ) : <p className="muted empty">Poll not available right now.</p>)}

      {tab === "title" && <Odds s={futures.title} alt={futures.polyTitle} mine={mine} note="CHANCE TO WIN THE NATIONAL TITLE" />}
      {tab === "playoff" && <Odds s={futures.playoff} mine={mine} limit={30} note="CHANCE TO MAKE THE COLLEGE FOOTBALL PLAYOFF" />}
      {tab === "heisman" && <Odds s={futures.heisman} mine={mine} limit={20} note="CHANCE TO WIN THE HEISMAN TROPHY" />}
      {tab === "hotseat" && <Odds s={futures.coach} mine={mine} limit={25} note="CHANCE THE COACH IS OUT BEFORE FEBRUARY · MARKET PRICES, NOT REPORTING" />}

      {tab === "conf" && (
        <>
          <div className="confs">
            {standings.map((s) => <button key={s.conf} className={`pill ${conf === s.conf ? "on" : ""}`} onClick={() => setConf(s.conf)}>{s.short.toUpperCase()}</button>)}
          </div>
          <div className="confgrid">
            <div className="table">
              <div className="thead crow mono"><span>#</span><span>TEAM</span><span>CONF</span><span>OVERALL</span><span>DIFF</span><span>STREAK</span></div>
              {st?.rows.map((r, k) => (
                <Link key={r.team.id} href={`/team/${r.team.id}`} className="row crow">
                  <span className="mono muted">{k + 1}</span>
                  <span className="pteam">{r.team.logo && <img src={r.team.logo} alt="" />}<b>{r.team.name}</b>{mine.has(r.team.id) && <em className="star">★</em>}</span>
                  <b className="mono">{r.conf}</b><span className="mono">{r.overall}</span><span className="mono muted">{r.diff}</span><span className="mono muted">{r.streak}</span>
                </Link>
              ))}
            </div>
            {confOdds && confOdds.markets.length > 0 && (
              <section className="card">
                <div className="cardh"><h3>Title odds</h3><span className="mono muted">{KEY[conf]} CHAMPION · KALSHI</span></div>
                <Odds s={confOdds} mine={mine} limit={8} note="CHANCE TO WIN THE CONFERENCE" />
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
