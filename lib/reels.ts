// Highlight reels: ESPN clips from this week's (and last week's) finished games, biggest games first.
import { darkJson } from "./espn";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";
export type ReelTeam = { abbr: string; short: string; logo: string; rank: number | null; score: number | null; winner: boolean };
export type Reel = { key: string; gameId: string; title: string; mp4: string; thumb: string; duration: number; away: ReelTeam; home: ReelTeam };

async function board(q: string) {
  try {
    const r = await fetch(`${ESPN}/scoreboard?groups=80&limit=300${q}`, { next: { revalidate: 600 } });
    return r.ok ? await darkJson(r) : null;
  } catch { return null; }
}

const side = (c: any): ReelTeam => {
  const rk = c?.curatedRank?.current;
  return {
    abbr: c?.team?.abbreviation || "", short: c?.team?.shortDisplayName || "", logo: c?.team?.logo || "",
    rank: rk && rk <= 25 ? rk : null, score: c?.score != null ? Number(c.score) : null, winner: !!c?.winner,
  };
};

export async function getReels(): Promise<Reel[]> {
  const cur = await board("");
  let events: any[] = (cur?.events || []).filter((e: any) => e.status?.type?.state === "post");
  const wk = cur?.week?.number;
  if (events.length < 12 && wk > 1) {
    const prev = await board(`&seasontype=2&week=${wk - 1}`);
    events = events.concat((prev?.events || []).filter((e: any) => e.status?.type?.state === "post"));
  }
  // Biggest first: ranked teams, then close finishes.
  const weight = (e: any) => {
    const c = e.competitions?.[0]?.competitors || [];
    const ranked = c.filter((x: any) => (x.curatedRank?.current || 99) <= 25).length;
    const margin = Math.abs(Number(c[0]?.score || 0) - Number(c[1]?.score || 0));
    return ranked * 20 + Math.max(0, 21 - margin);
  };
  const top = events.sort((a, b) => weight(b) - weight(a)).slice(0, 18);
  const lists = await Promise.all(top.map(async (e: any) => {
    try {
      const r = await fetch(`${ESPN}/summary?event=${e.id}`, { next: { revalidate: 3600 } });
      if (!r.ok) return [];
      const d = await darkJson(r);
      const c = e.competitions?.[0]?.competitors || [];
      const home = side(c.find((x: any) => x.homeAway === "home")), away = side(c.find((x: any) => x.homeAway === "away"));
      return (d.videos || []).slice(0, 2).map((v: any, k: number) => ({
        key: `${e.id}-${k}`, gameId: e.id, title: v.headline || "", thumb: v.thumbnail || "",
        mp4: v.links?.source?.HD?.href || v.links?.source?.href || "", duration: v.duration || 0, away, home,
      })).filter((x: Reel) => x.mp4);
    } catch { return []; }
  }));
  // One clip per game first, then second clips, so the feed keeps changing games.
  const firsts = lists.map((l) => l[0]).filter(Boolean), seconds = lists.map((l) => l[1]).filter(Boolean);
  return [...firsts, ...seconds];
}
