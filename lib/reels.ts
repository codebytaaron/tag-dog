// Reel clips per week. Each finished game is rated by how much it mattered (Top 25 teams, upsets,
// one-score finishes, overtime) and its best clips are picked (full-game highlights first; studio
// talk, interviews and previews are skipped). Ordering, variety and personalization happen on the client.
import { darkJson } from "./espn";
import { getRanks } from "./ranks";

let RANKS: Record<string, number> = {};

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";
export type ReelTeam = { id: string; abbr: string; short: string; logo: string; rank: number | null; score: number | null; winner: boolean };
export type Reel = {
  key: string; gameId: string; title: string; url: string; mp4: string; thumb: string; duration: number;
  away: ReelTeam; home: ReelTeam; week: number; tags: string[]; score: number;
  source?: "espn" | "bluesky"; handle?: string;
};

const TALK = /\?|what's next|reacts?|explains?|breaks? down|discuss|press conference|interview|podcast|preview|analysis|debate|takeaways|predict/i;

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
    rank: rk && rk <= 25 ? rk : RANKS[c?.team?.id] ?? null, score: c?.score != null ? Number(c.score) : null, winner: !!c?.winner,
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

export async function getReelsForWeek(week: number | null): Promise<{ week: number; clips: Reel[] }> {
  RANKS = await getRanks();
  const sb = await board(week ? `&seasontype=2&week=${week}` : "");
  const wk = week ?? sb?.week?.number ?? 1;
  const games = (sb?.events || []).filter((e: any) => e.status?.type?.state === "post")
    .map((e: any) => ({ e, ...rate(e) })).sort((a: any, b: any) => b.base - a.base).slice(0, 40);
  const lists = await Promise.all(games.map(async (x: any) => {
    try {
      const r = await fetch(`${ESPN}/summary?event=${x.e.id}`, { next: { revalidate: 3600 } });
      if (!r.ok) return [];
      const d = await darkJson(r);
      const vids = (d.videos || []).filter((v: any) => (v.links?.source?.href || v.links?.source?.HD?.href) && !TALK.test(v.headline || ""));
      const ordered = [...vids.filter((v: any) => /highlights/i.test(v.headline || "")), ...vids.filter((v: any) => !/highlights/i.test(v.headline || ""))];
      return ordered.slice(0, 6).map((v: any, k: number): Reel => ({
        key: `${x.e.id}-${v.id || k}`, gameId: x.e.id, title: v.headline || "", url: v.links?.web?.href || "",
        mp4: v.links?.source?.HD?.href || v.links?.source?.href, thumb: v.thumbnail || "", duration: v.duration || 0,
        away: x.away, home: x.home, week: wk, tags: x.tags, score: x.base * (k === 0 ? 1 : Math.max(0.2, 0.75 - k * 0.1)), source: "espn",
      }));
    } catch { return []; }
  }));
  return { week: wk, clips: lists.flat() };
}

export async function getReels() {
  const cur = await getReelsForWeek(null);
  const prev = cur.week > 1 ? await getReelsForWeek(cur.week - 1) : { week: 0, clips: [] as Reel[] };
  // Every clip is ESPN's own highlight video for an FBS game, linked back to ESPN.
  const prev2 = cur.week > 2 ? await getReelsForWeek(cur.week - 2) : { week: 0, clips: [] as Reel[] };
  return { week: cur.week, clips: [...cur.clips, ...prev.clips.map((c) => ({ ...c, score: c.score * 0.6 })), ...prev2.clips.map((c) => ({ ...c, score: c.score * 0.4 }))] };
}
