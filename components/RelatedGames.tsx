"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { LiteGame } from "@/lib/data";
import { interest } from "@/lib/taste";
import { useFollow } from "./SaveButton";
import Kickoff from "./Kickoff";

// "More games for you" at the bottom of a game page: your interests first, then the best games to watch.
export default function RelatedGames({ games }: { games: LiteGame[] }) {
  const { ids } = useFollow();
  const [list, setList] = useState<LiteGame[]>([]);
  useEffect(() => {
    const mine = new Set(ids);
    setList([...games].sort((a, b) => {
      const s = (g: LiteGame) => (mine.has(g.home.id) || mine.has(g.away.id) ? 6 : 0) + interest([g.home.id, g.away.id], g.signals) + g.watch / 25;
      return s(b) - s(a);
    }).slice(0, 6));
  }, [games, ids.join(",")]); // eslint-disable-line
  if (!list.length) return null;
  return (
    <section className="related">
      <div className="secthead"><h2 className="h2">More games for you</h2><Link href="/board" className="textlink">Full board</Link></div>
      <div className="rel-row">
        {list.map((g) => (
          <Link key={g.id} href={`/game/${g.id}`} className="rel-card">
            <span className="rel-logos">{g.away.logo && <img src={g.away.logo} alt="" />}{g.home.logo && <img src={g.home.logo} alt="" />}</span>
            <b>{g.away.short} at {g.home.short}</b>
            <span className="muted small">{g.line} · <Kickoff date={g.date} /></span>
            <span className={`rel-up c-${g.tier.toLowerCase()}`}>{g.upsetPct}% upset chance</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
