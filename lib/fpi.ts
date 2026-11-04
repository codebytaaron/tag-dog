// ESPN Football Power Index: team ratings, efficiencies and season projections. Free, no key.
export type FPI = {
  fpi: number; rank: number; projW: number; projL: number; winOut: string; sosRank: string;
  off: number; offRank: string; def: number; defRank: string; st: number; stRank: string;
};

export async function getFPI(): Promise<Record<string, FPI>> {
  try {
    const r = await fetch(`https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/${new Date().getFullYear()}/powerindex?limit=300`, { next: { revalidate: 21600 } });
    if (!r.ok) return {};
    const d = await r.json();
    const out: Record<string, FPI> = {};
    for (const i of d.items || []) {
      const id = String(i.team?.$ref || "").match(/teams\/(\d+)/)?.[1];
      if (!id) continue;
      const g = (arr: any[], n: string) => arr?.find((s: any) => s.name === n)?.displayValue ?? "";
      const p = i.predictives, e = i.efficiencies;
      out[id] = {
        fpi: parseFloat(g(p, "fpi")) || 0, rank: parseInt(g(p, "fpirank")) || 0,
        projW: parseFloat(g(p, "projectedw")) || 0, projL: parseFloat(g(p, "projectedl")) || 0,
        winOut: g(p, "probwinout"), sosRank: g(p, "sosremainingrank"),
        off: parseFloat(g(e, "offefficiency")) || 0, offRank: g(e, "offefficiencyrank"),
        def: parseFloat(g(e, "defefficiency")) || 0, defRank: g(e, "defefficiencyrank"),
        st: parseFloat(g(e, "stefficiency")) || 0, stRank: g(e, "stefficiencyrank"),
      };
    }
    return out;
  } catch { return {}; }
}
