"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { LiteGame } from "@/lib/data";
import { interest, recent, taste } from "@/lib/taste";
import { useFollow, useProfile } from "./SaveButton";
import Kickoff from "./Kickoff";

type Pick = { g: LiteGame; why: string };

// "Picked for you" and "Recently viewed", built from your follows and what you open and watch.
export default function ForYou({ games }: { games: LiteGame[] }) {
  const { ids } = useFollow();
  const { profile } = useProfile();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [seen, setSeen] = useState<LiteGame[]>([]);
  const key = [...ids, profile?.teamId || ""].join(",");

  useEffect(() => {
    const mine = new Set(key.split(",").filter(Boolean));
    const a = taste();
    const scored = games.map((g) => {
      const t = [g.home, g.away];
      const followed = t.find((x) => mine.has(x.id));
      const fav = [...t].sort((x, y) => (a[`team:${y.id}`] || 0) - (a[`team:${x.id}`] || 0))[0];
      const s = (followed ? 6 : 0) + interest([g.home.id, g.away.id], g.signals) + (g.tier === "FADE" ? 0.5 : 0);
      const why = followed ? `You follow ${followed.short}` : (a[`team:${fav.id}`] || 0) >= 1.5 ? `You keep checking ${fav.short}` : "";
      return { g, s, why };
    }).filter((x) => x.s >= 1.2 && x.why).sort((x, y) => y.s - x.s).slice(0, 4);
    setPicks(scored.map(({ g, why }) => ({ g, why })));
    const byId = new Map(games.map((g) => [g.id, g]));
    setSeen(recent().map((r) => byId.get(r.id)).filter(Boolean).slice(0, 6) as LiteGame[]);
  }, [games, key]);

  if (!picks.length && !seen.length) return null;
  return (
    <section className="foryou">
      {picks.length > 0 && (
        <>
          <div className="secthead"><h2 className="h2">Picked for you</h2><Link href="/board" className="textlink">Your board</Link></div>
          <div className="fy-grid">
            {picks.map(({ g, why }) => (
              <Link key={g.id} href={`/game/${g.id}`} className="fy-card">
                <span className="fy-why">{why}</span>
                <span className="fy-teams">{g.away.logo && <img src={g.away.logo} alt="" />}<b>{g.away.short} at {g.home.short}</b>{g.home.logo && <img src={g.home.logo} alt="" />}</span>
                <span className="muted small">{g.line} · <Kickoff date={g.date} /> · {g.upsetPct}% upset</span>
              </Link>
            ))}
          </div>
        </>
      )}
      {seen.length > 0 && (
        <div className="fy-recent">
          <span className="muted small">Recently viewed</span>
          {seen.map((g) => (
            <Link key={g.id} href={`/game/${g.id}`} className="fy-chip">{g.away.logo && <img src={g.away.logo} alt="" />}{g.home.logo && <img src={g.home.logo} alt="" />}<span>{g.away.abbr} at {g.home.abbr}</span></Link>
          ))}
        </div>
      )}
    </section>
  );
}
