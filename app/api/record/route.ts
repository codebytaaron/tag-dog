import { NextResponse } from "next/server";
import { getRecord, getPastRecord } from "@/lib/record";
import { getLiveRecord } from "@/lib/forward";
import { candidateLab, compareModels } from "@/lib/edge";
import { CANDIDATES } from "@/lib/signals";

export const revalidate = 1800;
export const maxDuration = 300;

// Track record for the TapeDog app: every graded call this season, plus the model tests (two seasons).
export async function GET() {
  const [r, live, past] = await Promise.all([getRecord(), getLiveRecord(), getPastRecord().catch(() => ({ year: 0, calls: [] }))]);
  const lab = { pastYear: past.year, models: compareModels(r.calls, past.calls), signals: candidateLab(r.calls, past.calls, Object.values(CANDIDATES)) };
  return NextResponse.json({ ...r, live, lab }, { headers: { "cache-control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
}
