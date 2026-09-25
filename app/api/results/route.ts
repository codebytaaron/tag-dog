import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";

// Final results for a list of game ids (used to grade user picks).
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") || "").split(",").filter((x) => /^\d+$/.test(x)).slice(0, 60);
  const out: Record<string, { state: string; home: number | null; away: number | null; winner: "home" | "away" | null }> = {};
  await Promise.all(ids.map(async (id) => {
    try {
      const r = await fetch(`${ESPN}/summary?event=${id}`, { next: { revalidate: 120 } });
      if (!r.ok) return;
      const c = (await r.json()).header?.competitions?.[0];
      const h = c?.competitors?.find((x: any) => x.homeAway === "home"), a = c?.competitors?.find((x: any) => x.homeAway === "away");
      const state = c?.status?.type?.state || "pre";
      out[id] = {
        state, home: h?.score != null ? Number(h.score) : null, away: a?.score != null ? Number(a.score) : null,
        winner: state === "post" ? (h?.winner ? "home" : a?.winner ? "away" : null) : null,
      };
    } catch {}
  }));
  return NextResponse.json(out, { headers: { "cache-control": "public, s-maxage=120" } });
}
