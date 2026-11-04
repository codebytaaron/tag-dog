"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import Kickoff from "./Kickoff";
import { useFollow, useProfile } from "./SaveButton";

type S = { id: string; short: string; abbr: string; logo: string; color: string; rank: number | null; score: number | null; winner: boolean };
export type RGame = { id: string; date: string; state: string; detail: string; home: S; away: S; upset: boolean; headline: string; network: string | null };
type F = "all" | "final" | "upsets" | "ranked" | "mine";

export default function Replay({ games, week, weeks }: { games: RGame[]; week: number; weeks: number }) {
  const [f, setF] = useState<F>("final");
  const [q, setQ] = useState("");
  const { ids } = useFollow();
  const { profile } = useProfile();
  const mine = new Set([...ids, profile?.teamId].filter(Boolean) as string[]);

  const test: Record<F, (g: RGame) => boolean> = {
    all: () => true,
    final: (g) => g.state === "post",
    upsets: (g) => g.upset,
    ranked: (g) => !!(g.home.rank || g.away.rank),
    mine: (g) => mine.has(g.home.id) || mine.has(g.away.id),
  };
  const list = useMemo(() => games.filter(test[f]).filter((g) => !q || `${g.home.short} ${g.away.short} ${g.home.abbr} ${g.away.abbr}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.state === "in" ? -1 : 0) - (b.state === "in" ? -1 : 0) || Date.parse(b.date) - Date.parse(a.date)), [games, f, q, ids, profile]); // eslint-disable-line
  const count = (k: F) => games.filter(test[k]).length;

  const Row = ({ t }: { t: S }) => (
    <div className={`rt ${t.winner ? "w" : ""}`}>
      {t.logo ? <img src={t.logo} alt="" /> : <span className="dotc" />}
      <span className="nm">{t.rank && <sup>{t.rank}</sup>}{t.short}{mine.has(t.id) && <em className="star"> ★</em>}</span>
      <b className="mono">{t.score ?? ""}</b>
    </div>
  );

  return (
    <div className="wrap board">
      <div className="bhead">
        <div>
          <div className="eyebrow mono">REPLAY · WEEK {week}</div>
          <h1 className="btitle">Replay</h1>
          <p className="muted">Every FBS result with highlights, the recap and play-by-play win odds. Tap any game.</p>
        </div>
      </div>

      <div className="weeks">
        {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
          <Link key={w} href={`/replay?week=${w}`} className={`wk ${w === week ? "on" : ""}`}>WK {w}</Link>
        ))}
      </div>

      <div className="controls2">
        <div className="rfilters">
          {([["final", "Finals"], ["upsets", "Upsets"], ["ranked", "Ranked"], ["mine", "Your teams"], ["all", "All"]] as [F, string][]).map(([k, l]) => (
            <button key={k} className={`pill ${f === k ? "on" : ""}`} onClick={() => setF(k)}>{l} <span className="mono">{count(k)}</span></button>
          ))}
        </div>
        <div className="searchwrap"><input className="search" placeholder="Filter by team" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>

      <div className="rcards">
        {list.map((g) => (
          <Link key={g.id} href={`/game/${g.id}`} className={`rcard ${g.state}`}>
            <div className="rch mono">
              <span>{g.state === "post" ? "FINAL" : g.state === "in" ? <span className="livetag"><i />LIVE · {g.detail}</span> : <Kickoff date={g.date} />}</span>
              {g.upset && <em className="upset-tag">UPSET</em>}
            </div>
            <Row t={g.away} /><Row t={g.home} />
            {g.headline && <p className="rcl">{g.headline}</p>}
            <span className="mono rcgo">{g.state === "post" ? "▶ HIGHLIGHTS & RECAP" : g.state === "in" ? "WATCH LIVE →" : "PREVIEW →"}</span>
          </Link>
        ))}
      </div>
      {list.length === 0 && (
        <div className="empty">{f === "mine" ? "Follow teams or set your team on your profile to see their results here." : "No games match."}</div>
      )}
    </div>
  );
}
