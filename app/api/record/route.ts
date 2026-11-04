import { NextResponse } from "next/server";
import { getRecord } from "@/lib/record";
import { getLiveRecord } from "@/lib/forward";

export const revalidate = 1800;
export const maxDuration = 60;

// Track record for the TapeDog app: every graded call this season.
export async function GET() {
  const [r, live] = await Promise.all([getRecord(), getLiveRecord()]);
  return NextResponse.json({ ...r, live }, { headers: { "cache-control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
}
