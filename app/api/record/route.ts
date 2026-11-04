import { NextResponse } from "next/server";
import { getRecord } from "@/lib/record";

export const revalidate = 1800;
export const maxDuration = 60;

// Track record for the TapeDog app: every graded call this season.
export async function GET() {
  const r = await getRecord();
  return NextResponse.json(r, { headers: { "cache-control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
}
