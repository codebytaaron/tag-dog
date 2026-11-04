// Head-to-head history between two teams, built from ESPN team schedules back to 2004 (free, no key).
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";
export type Side = { id: string; name: string; short: string; abbr: string; logo: string; color: string };
export type Meet = { id: string; date: string; season: number; post: boolean; aScore: number; bScore: number; aHome: boolean; neutral: boolean; note: string };

async function team(id: string): Promise<Side | null> {
  try {
    const r = await fetch(`${ESPN}/teams/${id}`, { next: { revalidate: 604800 } });
    const t = (await r.json()).team;
    return t ? { id, name: t.displayName, short: t.shortDisplayName || t.location, abbr: t.abbreviation, logo: t.logos?.[0]?.href || "", color: "#" + (t.color || "444444") } : null;
  } catch { return null; }
}

export async function getH2H(a: string, b: string) {
  const now = new Date().getFullYear();
  const seasons = Array.from({ length: now - 2003 }, (_, i) => 2004 + i);
  const [A, B, lists] = await Promise.all([team(a), team(b), Promise.all(seasons.flatMap((s) => [2, 3].map(async (t) => {
    try {
      const r = await fetch(`${ESPN}/teams/${a}/schedule?season=${s}&seasontype=${t}`, { next: { revalidate: s >= now - 1 ? 21600 : 2592000 } });
      if (!r.ok) return [];
      const d = await r.json();
      return (d.events || []).filter((e: any) => e.competitions?.[0]?.competitors?.some((c: any) => c.team?.id === b)).map((e: any) => ({ e, s, t }));
    } catch { return []; }
  })))]);
  const seen = new Set<string>();
  const meets: Meet[] = lists.flat().filter(({ e }) => { if (seen.has(e.id)) return false; seen.add(e.id); return e.competitions?.[0]?.status?.type?.completed; })
    .map(({ e, s, t }) => {
      const c = e.competitions[0], ca = c.competitors.find((x: any) => x.team?.id === a), cb = c.competitors.find((x: any) => x.team?.id === b);
      const sc = (x: any) => Number(x?.score?.value ?? x?.score?.displayValue ?? x?.score ?? 0);
      return { id: e.id, date: e.date, season: s, post: t === 3, aScore: sc(ca), bScore: sc(cb), aHome: ca?.homeAway === "home", neutral: !!c.neutralSite, note: c.notes?.[0]?.headline || "" };
    }).sort((x, y) => Date.parse(y.date) - Date.parse(x.date));
  return { A, B, meets };
}
