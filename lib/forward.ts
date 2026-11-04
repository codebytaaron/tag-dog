// Live record: calls saved before kickoff (see scripts/snapshot.mjs), graded against the final.
// Unlike the backtest, these were made with no knowledge of the result.
const RAW = "https://raw.githubusercontent.com/codebytaaron/tag-dog/data/picks.json";
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";

export type LivePick = {
  id: string; date: string; week: number; tier: "FADE" | "WATCH" | "HOLD"; score: number; upsetPct: number;
  fav: { short: string; abbr: string; logo: string }; dog: { short: string; abbr: string; logo: string };
  spread: number | null; favHome: boolean; favPts: number; dogPts: number; upset: boolean; cover: boolean | null;
};

const etDate = (iso: string) => new Date(Date.parse(iso) - 5 * 3600000).toISOString().slice(0, 10).replace(/-/g, "");

export async function getLiveRecord(): Promise<{ since: string | null; calls: LivePick[]; pending: number }> {
  try {
    const r = await fetch(RAW, { next: { revalidate: 600 } });
    if (!r.ok) return { since: null, calls: [], pending: 0 };
    const db = await r.json();
    const picks: any[] = Object.values(db.picks || {});
    const due = picks.filter((p) => Date.parse(p.date) < Date.now() - 3 * 3600000);
    const days = [...new Set(due.map((p) => etDate(p.date)))];
    const boards = await Promise.all(days.map((d) =>
      fetch(`${ESPN}/scoreboard?groups=80&limit=300&dates=${d}`, { next: { revalidate: 900 } }).then((x) => x.json()).catch(() => ({ events: [] }))));
    const finals = new Map<string, any>();
    for (const b of boards) for (const e of b.events || []) if (e.status?.type?.state === "post") finals.set(e.id, e);
    const calls: LivePick[] = [];
    for (const p of due) {
      const e = finals.get(p.id);
      if (!e) continue;
      const cs = e.competitions[0].competitors;
      const h = cs.find((x: any) => x.homeAway === "home"), a = cs.find((x: any) => x.homeAway === "away");
      const favPts = Number((p.favHome ? h : a).score) || 0, dogPts = Number((p.favHome ? a : h).score) || 0;
      const margin = dogPts - favPts + (p.spread ?? 0);
      calls.push({ ...p, favPts, dogPts, upset: dogPts > favPts, cover: p.spread == null || margin === 0 ? null : margin > 0 });
    }
    return { since: db.since || null, calls: calls.sort((x, y) => Date.parse(y.date) - Date.parse(x.date)), pending: picks.length - calls.length };
  } catch { return { since: null, calls: [], pending: 0 }; }
}
