"use client";
import { useState } from "react";
import type { Buzz } from "@/lib/buzz";
import Ago from "./Ago";

type T = { abbr: string; short: string; color: string };

export default function BuzzPanel({ buzz, away, home }: { buzz: Buzz; away: T; home: T }) {
  const [tab, setTab] = useState<"fans" | "news">(buzz.posts.length ? "fans" : "news");
  const tot = buzz.volume.away + buzz.volume.home;
  const ap = tot ? Math.round((buzz.volume.away / tot) * 100) : 50;
  const chip = (s: string) => (s === "both" ? "MATCHUP" : s === "away" ? away.abbr : home.abbr);

  return (
    <section className="card buzz">
      <div className="cardh"><h3>The buzz</h3><span className="mono muted">{buzz.posts.length} POSTS · {buzz.news.length} HEADLINES</span></div>

      {tot > 0 && (
        <div className="loud">
          <div className="mono loudh"><span>{away.abbr} {ap}%</span><span className="muted">WHO'S GETTING TALKED ABOUT · 48H</span><span>{100 - ap}% {home.abbr}</span></div>
          <div className="loudbar"><i style={{ width: `${ap}%`, background: away.color }} /><i style={{ width: `${100 - ap}%`, background: home.color }} /></div>
        </div>
      )}

      <div className="btabs">
        <button className={tab === "fans" ? "on" : ""} onClick={() => setTab("fans")}>Experts <em>{buzz.posts.length}</em></button>
        <button className={tab === "news" ? "on" : ""} onClick={() => setTab("news")}>Headlines <em>{buzz.news.length}</em></button>
      </div>

      {tab === "fans" && (buzz.posts.length ? (
        <ul className="posts">
          {buzz.posts.map((p) => (
            <li key={p.url}>
              <a href={p.url} target="_blank" rel="noreferrer">
                {p.avatar ? <img src={p.avatar} alt="" /> : <span className="pavi" />}
                <div>
                  <div className="phead"><b>{p.name}</b><span className="mono muted">@{p.handle} · <Ago date={p.at} /></span><span className={`pchip mono ${p.side}`}>{chip(p.side)}</span></div>
                  {p.role && <div className="prole">{p.role}</div>}
                  <p>{p.text}</p>
                  {(p.likes > 0 || p.reposts > 0) && <span className="mono muted small">♥ {p.likes} · ↻ {p.reposts}</span>}
                </div>
              </a>
            </li>
          ))}
        </ul>
      ) : <p className="muted bempty">No reporter or analyst posts about this game yet. They usually show up the day before kickoff.</p>)}

      {tab === "news" && (buzz.news.length ? (
        <ul className="heads">
          {buzz.news.map((n) => (
            <li key={n.url}><a href={n.url} target="_blank" rel="noreferrer"><b>{n.title}</b><span className="mono muted">{n.source} · <Ago date={n.at} /></span></a></li>
          ))}
        </ul>
      ) : <p className="muted bempty">No headlines yet.</p>)}

      <p className="mono muted bfoot">Only reporters, analysts and outlets on Bluesky (checked by their bio and following). Headlines from Google News.</p>
    </section>
  );
}
