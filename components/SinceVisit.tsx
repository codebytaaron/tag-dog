"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { LiteGame } from "@/lib/data";
import type { Live } from "@/lib/live";
import { useFollow, usePicks, useProfile } from "./SaveButton";

const KEY = "tapedog.lastVisit";

// "Since your last visit": the few things that changed while you were away.
export default function SinceVisit({ games }: { games: LiteGame[] }) {
  const [last, setLast] = useState<number | null>(null);
  const [live, setLive] = useState<Record<string, Live>>({});
  const { list: picks } = usePicks();
  const { ids } = useFollow();
  const { profile } = useProfile();

  useEffect(() => {
    let prev: number | null = null;
    try { prev = Number(localStorage.getItem(KEY)) || null; localStorage.setItem(KEY, String(Date.now())); } catch {}
    setLast(prev);
    fetch("/api/live").then((r) => r.json()).then(setLive).catch(() => {});
  }, []);

  if (!last || !Object.keys(live).length) return null;
  const mine = new Set([...ids, profile?.teamId].filter(Boolean) as string[]);
  const fresh = games.filter((g) => live[g.id]?.state === "post" && live[g.id].home != null && Date.parse(g.date) > last - 5 * 3600000);
  const upsets = fresh.filter((g) => { const l = live[g.id]; const f = g.favorite === "home" ? l.home! : l.away!, d = g.favorite === "home" ? l.away! : l.home!; return d > f; });
  const myPicks = picks.filter((p) => fresh.some((g) => g.id === p.id)).map((p) => { const l = live[p.id]; return p.pick === "home" ? l.home! > l.away! : l.away! > l.home!; });
  const myTeams = fresh.filter((g) => mine.has(g.home.id) || mine.has(g.away.id));
  const liveNow = games.filter((g) => live[g.id]?.state === "in").length;
  if (!upsets.length && !myPicks.length && !myTeams.length && !liveNow) return null;
  const hrs = Math.max(1, Math.round((Date.now() - last) / 3600000));

  return (
    <section className="since">
      <div className="sinceh mono"><span className="dotrec" /> SINCE YOUR LAST VISIT · {hrs < 48 ? `${hrs}H AGO` : `${Math.round(hrs / 24)}D AGO`}</div>
      <div className="sincerow">
        {liveNow > 0 && <Link href="/board?tab=scores" className="sc1"><b>{liveNow}</b><span>live now</span></Link>}
        {myPicks.length > 0 && <Link href="/profile" className="sc1"><b>{myPicks.filter(Boolean).length}-{myPicks.filter((x) => !x).length}</b><span>your picks</span></Link>}
        {upsets.length > 0 && <Link href="/board?tab=scores" className="sc1 hot"><b>{upsets.length}</b><span>upset{upsets.length > 1 ? "s" : ""}</span></Link>}
        {myTeams.slice(0, 3).map((g) => {
          const l = live[g.id];
          return (
            <Link key={g.id} href={`/game/${g.id}`} className="sc2">
              {g.away.logo && <img src={g.away.logo} alt="" />}<b>{l.away}</b><span className="muted">–</span><b>{l.home}</b>{g.home.logo && <img src={g.home.logo} alt="" />}
            </Link>
          );
        })}
        {upsets.slice(0, 3).map((g) => {
          const dog = g[g.favorite === "home" ? "away" : "home"], fav = g[g.favorite];
          return <Link key={`u${g.id}`} href={`/game/${g.id}`} className="sc2 up">{dog.logo && <img src={dog.logo} alt="" />}<span><b>{dog.short}</b> beat {fav.short}</span></Link>;
        })}
        <Link href="/reels" className="sc2 reelcta">▶ Watch the highlights</Link>
      </div>
    </section>
  );
}
