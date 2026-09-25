import { NextResponse } from "next/server";
import { getWeek, scoreGame, pool } from "@/lib/radar";

export const revalidate = 1800;

export async function GET(req: Request) {
  const week = new URL(req.url).searchParams.get("week") || undefined;
  try {
    const { week: wk, season, games } = await getWeek(week);
    const scored = await pool(games, 10, scoreGame);
    scored.sort((a, b) => b.score - a.score);
    return NextResponse.json({ week: wk, season, updated: new Date().toISOString(), games: scored });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
