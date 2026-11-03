import { NextResponse } from "next/server";
import { getLive } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET() {
  const m = await getLive();
  // Never cache an empty answer: if ESPN hiccups, clients keep their last good scores.
  if (!Object.keys(m).length) return NextResponse.json({}, { status: 503, headers: { "cache-control": "no-store" } });
  return NextResponse.json(m, { headers: { "cache-control": "public, s-maxage=15, stale-while-revalidate=30" } });
}
