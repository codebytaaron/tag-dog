// Season-wide data: AP/Coaches polls and conference standings (ESPN),
// plus futures markets (Kalshi): national title, playoff, Heisman, conference titles, coach hot seat.
import { darkJson, readable } from "./espn";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";
const K = "https://api.elections.kalshi.com/trade-api/v2";

export type TeamRef = { id: string; name: string; logo: string; color: string } | null;
export type Mkt = { label: string; p: number; prev: number | null; vol: number; team: TeamRef };
export type Series = { title: string; markets: Mkt[] } | null;
export type PollRow = { rank: number; prev: number | null; record: string; points: number; fpv: number; team: { id: string; name: string; logo: string; color: string } };
export type Poll = { name: string; rows: PollRow[]; others: string };
export type Standing = { conf: string; short: string; rows: { team: { id: string; name: string; logo: string }; conf: string; overall: string; streak: string; diff: string }[] };

const norm = (s: string) => s.toLowerCase().replace(/\bst\.?(?=\s|$)/g, "state").replace(/[^a-z]/g, "");

async function teamIndex() {
  const m = new Map<string, NonNullable<TeamRef>>();
  try {
    const r = await fetch(`${ESPN}/teams?limit=1000`, { next: { revalidate: 86400 } });
    const d = await darkJson(r);
    for (const { team: t } of d.sports?.[0]?.leagues?.[0]?.teams || []) {
      const ref = { id: t.id, name: t.location || t.displayName, logo: t.logos?.[0]?.href || "", color: readable("#" + (t.color || "444444"), t.alternateColor ? "#" + t.alternateColor : undefined) };
      for (const k of [t.location, t.displayName, t.shortDisplayName]) if (k && !m.has(norm(k))) m.set(norm(k), ref);
    }
  } catch {}
  return m;
}
const find = (idx: Map<string, NonNullable<TeamRef>>, name: string): TeamRef =>
  idx.get(norm(name)) || idx.get(norm(name.replace(/\s*\(.*?\)/, ""))) || null;

async function series(ticker: string, idx: Map<string, NonNullable<TeamRef>>, teams = true): Promise<Series> {
  try {
    const r = await fetch(`${K}/events?series_ticker=${ticker}&status=open&with_nested_markets=true&limit=5`, { next: { revalidate: 900 } });
    if (!r.ok) return null;
    const e = (await r.json()).events?.[0];
    if (!e) return null;
    const markets: Mkt[] = (e.markets || []).map((m: any) => ({
      label: m.yes_sub_title || m.subtitle || "", p: parseFloat(m.last_price_dollars || "0") || 0,
      prev: m.previous_price_dollars != null ? parseFloat(m.previous_price_dollars) : null,
      vol: parseFloat(m.volume_fp || "0") || 0, team: teams ? find(idx, m.yes_sub_title || "") : null,
    })).filter((m: Mkt) => m.p > 0 && m.label).sort((a: Mkt, b: Mkt) => b.p - a.p);
    return { title: e.title || "", markets };
  } catch { return null; }
}

export async function getFutures() {
  const idx = await teamIndex();
  const [title, playoff, heisman, sec, b10, b12, acc, coach] = await Promise.all([
    series("KXNCAAF", idx), series("KXNCAAFPLAYOFF", idx), series("KXHEISMAN", idx, false),
    series("KXNCAAFSEC", idx), series("KXNCAAFB10", idx), series("KXNCAAFB12", idx), series("KXNCAAFACC", idx),
    series("KXNCAAFCOACHOUT", idx, false),
  ]);
  return { title, playoff, heisman, conf: { SEC: sec, "Big Ten": b10, "Big 12": b12, ACC: acc } as Record<string, Series>, coach };
}
export type Futures = Awaited<ReturnType<typeof getFutures>>;

export async function getPolls(): Promise<Poll[]> {
  try {
    const r = await fetch(`${ESPN}/rankings`, { next: { revalidate: 1800 } });
    const d = await darkJson(r);
    return (d.rankings || []).slice(0, 2).map((p: any) => ({
      name: p.name,
      rows: (p.ranks || []).map((x: any) => ({
        rank: x.current, prev: x.previous || null, record: x.recordSummary || "", points: x.points || 0, fpv: x.firstPlaceVotes || 0,
        team: { id: x.team?.id, name: x.team?.location || x.team?.name || "", logo: x.team?.logo || x.team?.logos?.[0]?.href || "", color: readable("#" + (x.team?.color || "444444"), x.team?.alternateColor ? "#" + x.team.alternateColor : undefined) },
      })),
      others: (p.others || []).slice(0, 12).map((o: any) => `${o.team?.location || o.team?.name} ${o.points}`).join(", "),
    }));
  } catch { return []; }
}

export async function getStandings(): Promise<Standing[]> {
  try {
    const r = await fetch(`https://site.web.api.espn.com/apis/v2/sports/football/college-football/standings?group=80&season=${new Date().getFullYear()}`, { next: { revalidate: 1800 } });
    const d = await darkJson(r);
    const NICE: Record<string, string> = { "Southeastern Conference": "SEC", "Big Ten Conference": "Big Ten", "Big 12 Conference": "Big 12", "Atlantic Coast Conference": "ACC", "Mountain West Conference": "Mountain West", "Mid-American Conference": "MAC", "Sun Belt Conference": "Sun Belt", "American Conference": "American", "Conference USA": "C-USA", "Pac-12 Conference": "Pac-12" };
    const pct = (r: string) => { const [w, l] = r.split("-").map(Number); return w + l ? w / (w + l) : 0; };
    const wins = (r: string) => Number(r.split("-")[0]) || 0;
    return (d.children || []).map((c: any) => ({
      conf: c.name, short: NICE[c.name] || c.name.replace(/ Conference$/, ""),
      rows: (c.standings?.entries || []).map((e: any) => {
        const st = (t: string) => { const s = e.stats?.find((x: any) => x.type === t); return s?.displayValue ?? s?.summary ?? ""; };
        return { team: { id: e.team?.id, name: e.team?.location || e.team?.displayName, logo: e.team?.logos?.[0]?.href || "" }, conf: st("vsconf"), overall: st("total"), streak: st("streak"), diff: st("pointdifferential") };
      }).sort((x: any, y: any) => pct(y.conf) - pct(x.conf) || wins(y.conf) - wins(x.conf) || pct(y.overall) - pct(x.overall) || parseInt(y.diff) - parseInt(x.diff)),
    }));
  } catch { return []; }
}

export async function teamNews(id: string) {
  try {
    const r = await fetch(`${ESPN}/news?team=${id}&limit=6`, { next: { revalidate: 1800 } });
    const d = await darkJson(r);
    return (d.articles || []).map((a: any) => ({ headline: a.headline as string, url: (a.links?.web?.href || "") as string, at: (a.published || "") as string })).filter((a: any) => a.url).slice(0, 5);
  } catch { return []; }
}

// Conference name as ESPN writes it -> key used for Kalshi conference markets.
export const CONF_KEY: Record<string, string> = {
  "Southeastern Conference": "SEC", "Big Ten Conference": "Big Ten", "Big 12 Conference": "Big 12", "Atlantic Coast Conference": "ACC",
};
