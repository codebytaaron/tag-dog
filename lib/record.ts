// "Called it": TapeDog's track record. Every finished game this season is re-scored with the signals we can
// rebuild for past weeks (the AP poll at the time, schedule spots, rest, travel, the closing and opening lines)
// and graded against the final score. Live-only signals (weather, Kalshi, ESPN FPI) are not part of past grades.
import { unstable_cache } from "next/cache";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";
const UA = { "user-agent": "Mozilla/5.0 (compatible; TapeDog/1.0)" };
const DAY = 86400000;

export type RT = { id: string; name: string; short: string; abbr: string; logo: string };
export type Call = {
  id: string; week: number; date: string; fav: RT; dog: RT; favHome: boolean; spread: number | null;
  score: number; tier: "FADE" | "WATCH" | "HOLD"; flags: string[]; favPts: number; dogPts: number; upset: boolean; cover: boolean | null;
};

async function j(url: string, rv: number, headers?: Record<string, string>) {
  const r = await fetch(url, { next: { revalidate: rv }, headers });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}
const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z]/g, "");
const board = (w: number, rv: number) => j(`${ESPN}/scoreboard?groups=80&limit=300&seasontype=2&week=${w}`, rv).catch(() => ({ events: [] }));
async function poll(year: number, w: number) {
  try {
    const d = await j(`https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/${year}/types/2/weeks/${w}/rankings/1`, 604800);
    const m: Record<string, number> = {};
    for (const x of d.ranks || []) { const id = String(x.team?.$ref || "").match(/teams\/(\d+)/)?.[1]; if (id) m[id] = x.current; }
    return m;
  } catch { return {}; }
}
const lines = (date: string, rv: number) =>
  j(`https://api.actionnetwork.com/web/v1/scoreboard/ncaaf?period=game&division=FBS&bookIds=15,30&date=${date}`, rv, UA).then((d) => d.games || []).catch(() => []);
// ESPN keeps the closing and opening line for finished games (Action Network only serves the current week).
async function espnOdds(id: string, rv: number) {
  try {
    const d = await j(`https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/events/${id}/competitions/${id}/odds`, rv);
    const o = (d.items || [])[0];
    if (!o) return null;
    const h = o.homeTeamOdds || {};
    const spread = typeof o.spread === "number" ? o.spread : null;
    const openRaw = parseFloat(h.open?.pointSpread?.american ?? "");
    return {
      spread_home: spread, ml_home: h.moneyLine ?? null, ml_away: o.awayTeamOdds?.moneyLine ?? null,
      open_home: Number.isFinite(openRaw) ? openRaw : null,
    };
  } catch { return null; }
}
const etDate = (iso: string) => new Date(Date.parse(iso) - 5 * 3600000).toISOString().slice(0, 10).replace(/-/g, "");
const team = (c: any): RT => ({ id: c.team?.id, name: c.team?.displayName || "", short: c.team?.shortDisplayName || "", abbr: c.team?.abbreviation || "", logo: c.team?.logo || "" });

async function gradeWeek(year: number, w: number, live: boolean): Promise<Call[]> {
  const rv = live ? 1800 : 604800;
  const [cur, prev, next, rk] = await Promise.all([board(w, rv), w > 1 ? board(w - 1, 604800) : { events: [] }, board(w + 1, 3600), poll(year, w)]);
  const opp = (sb: any) => {
    const m = new Map<string, { opp: string; date: number }>();
    for (const e of sb.events || []) {
      const [a, b] = e.competitions?.[0]?.competitors || [];
      if (!a || !b) continue;
      m.set(a.team.id, { opp: b.team.id, date: Date.parse(e.date) });
      m.set(b.team.id, { opp: a.team.id, date: Date.parse(e.date) });
    }
    return m;
  };
  const P = opp(prev), N = opp(next);
  const finals = (cur.events || []).filter((e: any) => e.status?.type?.state === "post");
  // An empty week means ESPN didn't answer. Throw so the empty result is never cached.
  if (!finals.length) { if (live) return []; throw new Error(`week ${w}: no finals`); }
  const an = (await Promise.all([...new Set(finals.map((e: any) => etDate(e.date)))].map((d) => lines(d as string, rv)))).flat();
  // Lines for past weeks come from ESPN, eight games at a time.
  const espn = new Map<string, Awaited<ReturnType<typeof espnOdds>>>();
  for (let i = 0; i < finals.length; i += 8) {
    const part = finals.slice(i, i + 8);
    const got = await Promise.all(part.map((e: any) => espnOdds(e.id, rv)));
    part.forEach((e: any, k: number) => espn.set(e.id, got[k]));
  }
  if (!an.length && ![...espn.values()].some(Boolean)) throw new Error(`week ${w}: no lines`);
  const hit = (t: any, x: any) => !!t && (norm(t.full_name) === norm(x.team?.displayName) || norm(t.location) === norm(x.team?.location) || t.abbr === x.team?.abbreviation);
  const out: Call[] = [];
  for (const e of finals) {
    const cs = e.competitions[0].competitors;
    const h = cs.find((x: any) => x.homeAway === "home"), a = cs.find((x: any) => x.homeAway === "away");
    const g = an.find((x: any) => hit(x.teams?.find((t: any) => t.id === x.home_team_id), h) && hit(x.teams?.find((t: any) => t.id === x.away_team_id), a));
    const eo = espn.get(e.id);
    const cons = g?.odds?.find((o: any) => o.book_id === 15) ?? (eo ? { spread_home: eo.spread_home, ml_home: eo.ml_home, ml_away: eo.ml_away } : undefined);
    const open = g?.odds?.find((o: any) => o.book_id === 30) ?? (eo?.open_home != null ? { spread_home: eo.open_home } : undefined);
    const consH: number | null = cons?.spread_home ?? null;
    if (consH == null && cons?.ml_home == null) continue;
    const favHome = consH != null && consH !== 0 ? consH < 0 : (cons.ml_home ?? 0) <= (cons.ml_away ?? 0);
    const fav = favHome ? h : a, dog = favHome ? a : h;
    const spread = consH != null ? Math.abs(consH) : null;
    const kick = Date.parse(e.date);
    const pr = P.get(fav.team.id), nx = N.get(fav.team.id);
    const prevR = pr ? rk[pr.opp] : undefined, nextR = nx ? rk[nx.opp] : undefined;
    let pts = 5; const flags: string[] = [];
    const add = (l: string, p: number) => { pts += p; if (p > 0) flags.push(l); };
    if (nextR) add("Look-ahead", 20);
    if (prevR) add("Letdown", 14);
    if (prevR && nextR) add("Sandwich", 10);
    if (!favHome) add("Road favorite", 10);
    if (!favHome && (new Date(kick).getUTCHours() + 19) % 24 >= 19) add("Road night game", 5);
    if (pr && (kick - pr.date) / DAY < 6) add("Short week", 8);
    if (w > 1 && !P.get(dog.team.id)) add("Dog off a bye", 8);
    if (open?.spread_home != null && consH != null) {
      const f = (x: number) => (favHome ? x : -x);
      const move = f(consH) - f(open.spread_home);
      if (move >= 1.5) add("Line sliding to dog", 12); else if (move <= -2) add("Money on the fav", -6);
    }
    if (spread != null) { if (spread >= 3 && spread <= 14) add("Live number", 8); else if (spread >= 24) add("Big cushion", -12); }
    const score = Math.max(0, Math.min(99, pts));
    const favPts = Number(fav.score) || 0, dogPts = Number(dog.score) || 0;
    const margin = dogPts - favPts + (spread ?? 0);
    out.push({
      id: e.id, week: w, date: e.date, fav: team(fav), dog: team(dog), favHome, spread, score,
      tier: score >= 50 ? "FADE" : score >= 28 ? "WATCH" : "HOLD", flags, favPts, dogPts,
      upset: dogPts > favPts, cover: spread == null || margin === 0 ? null : margin > 0,
    });
  }
  return out;
}

async function build() {
  const cur = await j(`${ESPN}/scoreboard?groups=80&limit=300`, 1800);
  const week: number = cur.week?.number || 1, year: number = cur.season?.year || new Date().getFullYear();
  // A few weeks at a time so ESPN and Action Network don't rate-limit us. A failed week is skipped this time
  // (and not cached), so it fills in on the next refresh instead of staying empty for a week.
  const weeks: Call[][] = [];
  const all = Array.from({ length: week }, (_, i) => i + 1);
  for (let i = 0; i < all.length; i += 3) {
    weeks.push(...await Promise.all(all.slice(i, i + 3).map((w) =>
      unstable_cache(() => gradeWeek(year, w, w >= week - 1), ["tapedog-record-week-v3", String(year), String(w)], { revalidate: w >= week - 1 ? 1800 : 604800 })()
        .catch(() => [] as Call[]))));
  }
  return { year, week, calls: weeks.flat() };
}
export const getRecord = unstable_cache(build, ["tapedog-record-v3"], { revalidate: 1800 });
