import { NextResponse } from "next/server";
import { getLive } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getLive(), { headers: { "cache-control": "public, s-maxage=15, stale-while-revalidate=30" } });
}
