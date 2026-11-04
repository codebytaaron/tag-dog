import { NextResponse } from "next/server";
import { getReelsForWeek } from "@/lib/reels";

export const maxDuration = 60;

// Older weeks for the endless Reels feed.
export async function GET(req: Request) {
  const w = parseInt(new URL(req.url).searchParams.get("week") || "");
  if (!w || w < 1) return NextResponse.json({ week: 0, clips: [] });
  const data = await getReelsForWeek(w);
  return NextResponse.json(data, { headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
