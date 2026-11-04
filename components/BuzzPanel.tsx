"use client";
import { useMemo, useState } from "react";
import type { Buzz } from "@/lib/buzz";
import Ago from "./Ago";

type T = { abbr: string; short: string; color: string };
type Item = { key: string; kind: "news" | "post"; at: string; url: string; title: string; source: string; avatar?: string; handle?: string };

// One clean feed: news headlines and posts from reporters and outlets, newest first.
export default function BuzzPanel({ buzz, away, home }: { buzz: Buzz; away: T; home: T }) {
  const [f, setF] = useState<"all" | "news" | "post">("all");
  const [more, setMore] = useState(false);
  const items = useMemo(() => {
    const all: Item[] = [
      ...buzz.news.map((n) => ({ key: n.url, kind: "news" as const, at: n.at, url: n.url, title: n.title, source: n.source })),
      ...buzz.posts.map((p) => ({ key: p.url, kind: "post" as const, at: p.at, url: p.url, title: p.text, source: p.name, avatar: p.avatar, handle: p.handle })),
    ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    return f === "all" ? all : all.filter((i) => i.kind === f);
  }, [buzz, f]);
  const shown = more ? items : items.slice(0, 6);

  return (
    <section className="card bz">
      <div className="cardh"><h3>The buzz</h3></div>
      <p className="muted bz-sub">What reporters and outlets are saying about {away.short} vs {home.short}.</p>
      <div className="bz-tabs">
        {([["all", `All ${buzz.news.length + buzz.posts.length}`], ["news", `Headlines ${buzz.news.length}`], ["post", `Reporters ${buzz.posts.length}`]] as const).map(([k, l]) => (
          <button key={k} className={f === k ? "on" : ""} onClick={() => { setF(k); setMore(false); }}>{l}</button>
        ))}
      </div>
      {items.length === 0 ? <p className="muted bz-empty">Nothing yet. Coverage usually picks up a day or two before kickoff.</p> : (
        <ul className="bz-list">
          {shown.map((i) => (
            <li key={i.key}>
              <a href={i.url} target="_blank" rel="noreferrer" className={`bz-item ${i.kind}`}>
                {i.kind === "post" ? (i.avatar ? <img src={i.avatar} alt="" /> : <span className="bz-av" />) : <span className="bz-news">News</span>}
                <span className="bz-body">
                  <span className="bz-meta"><b>{i.source}</b>{i.handle && <span>@{i.handle}</span>}<span>· <Ago date={i.at} /></span></span>
                  <span className={i.kind === "news" ? "bz-head" : "bz-text"}>{i.title}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {items.length > 6 && !more && <button className="bz-more" onClick={() => setMore(true)}>Show {items.length - 6} more</button>}
      <p className="muted small srcnote">Headlines from Google News. Posts from reporters and outlets on Bluesky.</p>
    </section>
  );
}
