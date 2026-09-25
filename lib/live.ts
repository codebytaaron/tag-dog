// Live scores straight from ESPN's scoreboard, cached ~15s.
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";

export type Live = {
  state: string; detail: string; clock: string; period: number;
  home: number | null; away: number | null; poss: string | null; down: string | null;
  lastPlay: string | null; homeWP: number | null; redZone: boolean;
};

export async function getLive(): Promise<Record<string, Live>> {
  try {
    const r = await fetch(`${ESPN}/scoreboard?groups=80&limit=300`, { next: { revalidate: 15 } });
    if (!r.ok) return {};
    const d = await r.json();
    const out: Record<string, Live> = {};
    for (const e of d.events || []) {
      const c = e.competitions?.[0];
      const h = c?.competitors?.find((x: any) => x.homeAway === "home");
      const a = c?.competitors?.find((x: any) => x.homeAway === "away");
      const state = e.status?.type?.state || "pre";
      const s = c?.situation;
      const wp = s?.lastPlay?.probability?.homeWinPercentage;
      out[e.id] = {
        state, detail: e.status?.type?.shortDetail || "", clock: e.status?.displayClock || "", period: e.status?.period || 0,
        home: state !== "pre" && h?.score != null ? Number(h.score) : null,
        away: state !== "pre" && a?.score != null ? Number(a.score) : null,
        poss: s?.possession || null, down: s?.downDistanceText || null, lastPlay: s?.lastPlay?.text || null,
        homeWP: typeof wp === "number" ? wp : null, redZone: !!s?.isRedZone,
      };
    }
    return out;
  } catch { return {}; }
}
