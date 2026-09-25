import { NextResponse } from "next/server";

export const revalidate = 86400;

export async function GET() {
  try {
    const r = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=1000", { next: { revalidate: 86400 } });
    const d = await r.json();
    const teams = (d.sports?.[0]?.leagues?.[0]?.teams || []).map(({ team: t }: any) => ({
      id: t.id, name: t.displayName, short: t.shortDisplayName, abbr: t.abbreviation, loc: t.location,
      nick: t.name || "", logo: t.logos?.[0]?.href || "", color: "#" + (t.color || "444444"),
    })).sort((a: any, b: any) => a.name.localeCompare(b.name));
    return NextResponse.json(teams, { headers: { "cache-control": "public, s-maxage=86400" } });
  } catch {
    return NextResponse.json([]);
  }
}
