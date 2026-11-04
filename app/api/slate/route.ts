import { NextResponse } from "next/server";
import { getSlate, lite } from "@/lib/data";
import { getGameDayId } from "@/lib/gameday";

export const revalidate = 60;
export const maxDuration = 60;

// The full slate with TapeDog scores, for the app. Same data the Fade Board renders.
export async function GET() {
  const s = await getSlate();
  const gameday = await getGameDayId(s.games).catch(() => null);
  return NextResponse.json({ season: s.season, week: s.week, updated: s.updated, gameday, games: s.games.map(lite) },
    { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
