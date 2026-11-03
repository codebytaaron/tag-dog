// Highlight reels. Ranks this week's and last week's finished games by how much they matter
// (Top 25 teams, upsets, one-score finishes, overtime, recency), then picks each game's best clips
// (full-game highlights first) and spaces them out so the feed keeps changing games.
import { darkJson } from "./espn";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";
export type ReelTeam = { id: string; abbr: string; short: string; logo: string; rank: number | null; score: number | null; winner: boolean };
export type Reel = {
  key: string; gameId: string; title: string; url: string; mp4: string; thumb: string; duration: number;
  away: ReelTeam; home: ReelTeam; week: number; tags: string[]; score: number;
};

async function board(q: string) {
  try {
    const r = await fetch(`${ESPN}/scoreboard?groups=80&limit=300${q}`, { next: { revalidate: 600 } });
    return r.ok ? await darkJson(r) : null;
  } catch { return null; }
}

const side = (c: any): ReelTeam => {
  const rk = c?.curatedRank?.current;
  return {
    id: c?.team?.id || "", abbr: c?.team?.abbreviation || "", short: c?.team?.shortDisplayName || "", logo: c?.team?.logo || "",
    rank: rk && rk <= 25 ? rk : null, score: c?.score != null ? Number(c.score) : null, winner: !!c?.winner,
  };
};

function rate(e: any) {
  const c = e.competitions?.[0]?.competitors || [];
  const home = side(c.find((x: any) => x.homeAway === "home")), away = side(c.find((x: any) => x.homeAway === "away"));
  const w = home.winner ? home : away.winner ? away : null, l = w === home ? away : w === away ? home : null;
  const tags: string[] = [];
  let base = 5;
  for (const t of [home, away]) if (t.rank) base += 26 - t.rank;
  if (w && l && l.rank && (!w.rank || w.rank > l.rank)) { base += 25; tags.push("Upset"); }
  if (home.rank && away.rank) tags.push("Top 25 matchup");
  const margin = Math.abs((home.score ?? 0) - (away.score ?? 0));
  base += Math.max(0, 17 - margin) * 1.5;
  if (/OT/.test(e.status?.type?.shortDetail || "")) { base += 12; tags.push("Overtime"); }
  else if (margin <= 8) tags.push("One-score game");
  return { home, away, tags, base };
}

export async function getReels(): Promise<Reel[]> {
  const cur = await board("");
  const wk = cur?.week?.number || 1;
  const prev = wk > 1 ? await board(`&seasontype=2&week=${wk - 1}`) : null;
  const final = (e: any) => e.status?.type?.state === "post";
  const games = [
    ...(cur?.events || []).filter(final).map((e: any) => ({ e, wk, recency: 1 })),
    ...(prev?.events || []).filter(final).map((e: any) => ({ e, wk: wk - 1, recency: 0.6 })),
  ].map((x) => { const r = rate(x.e); return { ...x, ...r, score: r.base * x.recency }; })
    .sort((a, b) => b.score - a.score).slice(0, 24);

  const lists = await Promise.all(games.map(async (x) => {
    try {
      const r = await fetch(`${ESPN}/summary?event=${x.e.id}`, { next: { revalidate: 3600 } });
      if (!r.ok) return [];
      const d = await darkJson(r);
      // Game action only: skip studio talk, interviews and previews.
      const TALK = /\?|what's next|reacts?|explains?|breaks? down|discuss|press conference|interview|podcast|preview|analysis|debate|takeaways|predict/i;
      const vids = (d.videos || []).filter((v: any) => (v.links?.source?.href || v.links?.source?.HD?.href) && !TALK.test(v.headline || ""));
      const ordered = [...vids.filter((v: any) => /highlights/i.test(v.headline || "")), ...vids.filter((v: any) => !/highlights/i.test(v.headline || ""))];
      return ordered.slice(0, 3).map((v: any, k: number): Reel => ({
        key: `${x.e.id}-${k}`, gameId: x.e.id, title: v.headline || "", url: v.links?.web?.href || "",
        mp4: v.links?.source?.HD?.href || v.links?.source?.href, thumb: v.thumbnail || "", duration: v.duration || 0,
        away: x.away, home: x.home, week: x.wk, tags: x.tags,
        score: x.score * (k === 0 ? 1 : 0.72 - k * 0.12),
      }));
    } catch { return []; }
  }));

  // Best clips first, but never the same game within three clips.
  const pool = lists.flat().sort((a, b) => b.score - a.score);
  const out: Reel[] = [];
  while (pool.length) {
    const i = pool.findIndex((c) => !out.slice(-3).some((o) => o.gameId === c.gameId));
    out.push(pool.splice(i < 0 ? 0 : i, 1)[0]);
  }
  return out;
}
