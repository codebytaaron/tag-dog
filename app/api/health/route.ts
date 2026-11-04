import { NextResponse } from "next/server";
import { getSlate } from "@/lib/data";
import { getFPI } from "@/lib/fpi";
import { getFutures, getPolls, getStandings } from "@/lib/pulse";
import { getGameDayId } from "@/lib/gameday";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Coverage report for every data source. Used to catch broken or mismatched feeds.
export async function GET() {
  const t0 = Date.now();
  const [s, fpi, fut, polls, stands] = await Promise.all([getSlate(), getFPI(), getFutures(), getPolls(), getStandings()]);
  const g = s.games, up = g.filter((x) => x.state !== "post");
  const name = (x: any) => `${x.away.short} @ ${x.home.short}`;
  return NextResponse.json({
    week: s.week, updated: s.updated, ms: Date.now() - t0,
    games: g.length, upcoming: up.length,
    books: { has: up.filter((x) => x.books.length).length, missing: up.filter((x) => !x.books.length).map(name) },
    opener: up.filter((x) => x.openFav != null).length,
    kalshi: { has: up.filter((x) => x.kalshi).length, missing: up.filter((x) => !x.kalshi).map(name) },
    espnFpiGame: up.filter((x) => x.fpi).length,
    fpiTeams: { count: Object.keys(fpi).length, missing: up.flatMap((x) => [x.home, x.away]).filter((t) => !fpi[t.id]).map((t) => t.short) },
    weather: { has: up.filter((x) => x.weather).length, indoor: up.filter((x) => x.venue.indoor).length },
    favoriteSource: { fromLine: up.filter((x) => x.spread != null).length, noLine: up.filter((x) => x.spread == null).map(name) },
    polls: polls.map((p) => `${p.name}: ${p.rows.length}`), standings: stands.length,
    futures: { title: fut.title?.markets.length || 0, titleUnmatched: (fut.title?.markets || []).filter((m) => !m.team).map((m) => m.label), poly: Object.keys(fut.polyTitle || {}).length, playoff: fut.playoff?.markets.length || 0, heisman: fut.heisman?.markets.length || 0, coach: fut.coach?.markets.length || 0 },
    rankedGames: g.filter((x) => x.home.rank || x.away.rank).length,
    gameday: await getGameDayId(g),
  });
}
