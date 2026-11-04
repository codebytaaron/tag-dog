import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getSlate } from "@/lib/data";
import { briefPrompt, gemini } from "@/lib/ai";
import { getBuzz } from "@/lib/buzz";

export const maxDuration = 60;

// One brief per game every 6 hours, shared by every visitor, keeps us inside the free tier.
const cachedBrief = unstable_cache(async (id: string) => {
  const g = (await getSlate()).games.find((x) => x.id === id);
  if (!g) throw new Error("Game not found on this week's slate.");
  const buzz = await getBuzz(g.away, g.home);
  return gemini(briefPrompt(g, buzz));
}, ["tapedog-brief-v4"], { revalidate: 21600 });

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return NextResponse.json(await cachedBrief(id));
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Film room is busy. Try again in a minute." }, { status: 502 });
  }
}
