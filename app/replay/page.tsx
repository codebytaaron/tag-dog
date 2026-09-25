import { getSlate } from "@/lib/data";
import Replay, { type RGame } from "@/components/Replay";

export const revalidate = 300;
export const maxDuration = 60;
export const metadata = { title: "Replay | TapeDog" };
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";

async function week(w: number, live: boolean): Promise<RGame[]> {
  try {
    const r = await fetch(`${ESPN}/scoreboard?groups=80&limit=300&seasontype=2&week=${w}`, { next: { revalidate: live ? 60 : 3600 } });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.events || []).map((e: any) => {
      const c = e.competitions?.[0] || {};
      const side = (x: any) => {
        const rk = x?.curatedRank?.current;
        return {
          id: x?.team?.id, short: x?.team?.shortDisplayName || x?.team?.location || "TBD", abbr: x?.team?.abbreviation || "",
          logo: x?.team?.logo || "", color: "#" + (x?.team?.color || "444444"), rank: rk && rk <= 25 ? rk : null,
          score: x?.score != null && x.score !== "" ? Number(x.score) : null, winner: !!x?.winner,
        };
      };
      const home = side(c.competitors?.find((x: any) => x.homeAway === "home"));
      const away = side(c.competitors?.find((x: any) => x.homeAway === "away"));
      const state = e.status?.type?.state || "pre";
      const win = home.winner ? home : away.winner ? away : null, lose = win === home ? away : win === away ? home : null;
      const upset = !!(win && lose && lose.rank && (!win.rank || win.rank > lose.rank));
      return {
        id: e.id, date: e.date, state, detail: e.status?.type?.shortDetail || "", home, away, upset,
        headline: c.headlines?.[0]?.shortLinkText || c.headlines?.[0]?.description || "", network: c.broadcasts?.[0]?.names?.[0] || null,
      };
    });
  } catch { return []; }
}

export default async function ReplayPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const [{ week: wq }, s] = await Promise.all([searchParams, getSlate()]);
  const cur = s.week || 1;
  let w = parseInt(wq || "") || cur;
  w = Math.min(Math.max(w, 1), Math.max(cur, 1));
  let games = await week(w, w === cur);
  if (!wq && w === cur && cur > 1 && games.filter((g) => g.state === "post").length < 10) {
    w = cur - 1;
    games = await week(w, false);
  }
  return <main><Replay games={games} week={w} weeks={cur} /></main>;
}
