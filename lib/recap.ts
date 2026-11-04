import { darkJson } from "./espn";
// Game recap from ESPN's public summary: highlights, story, scoring, win probability, leaders, stats.
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";

export type RTeam = {
  id: string; name: string; short: string; abbr: string; logo: string; color: string;
  score: number | null; winner: boolean; rank: number | null; record: string;
};
export type Video = { title: string; thumb: string; mp4: string; url: string; duration: number };
export type Recap = {
  id: string; state: string; detail: string; date: string; venue: string; attendance: number | null;
  home: RTeam; away: RTeam; line: string | null; favSide: "home" | "away" | null; spread: number | null;
  upset: boolean; ats: string | null;
  videos: Video[]; article: { headline: string; text: string; url: string | null } | null;
  scoring: { q: string; clock: string; text: string; type: string; logo: string; away: number; home: number }[];
  leaders: { side: "home" | "away"; cat: string; name: string; value: string }[];
  stats: { label: string; away: string; home: string }[];
  wp: { x: number; home: number }[]; quarters: { x: number; label: string }[]; swing: number;
};

const ent = (s: string) => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;|&lsquo;/g, "\x27").replace(/&quot;|&ldquo;|&rdquo;/g, "\"").replace(/&mdash;|—/g, ", ");
const strip = (h: string) => ent(h.replace(/<photo\d*>|<video\d*>|<alsosee>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const clip = (s: string, n: number) => { if (s.length <= n) return s; const c = s.slice(0, n); const e = c.lastIndexOf(". "); return e > 200 ? c.slice(0, e + 1) : c + "…"; };

// Keep team colors readable on a dark background.
function vis(hex: string, alt?: string) {
  const lum = (h: string) => { const n = parseInt(h.replace("#", ""), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  if (lum(hex) > 0.22) return hex;
  if (alt && lum(alt) > 0.22) return alt;
  return "#d9d2c2";
}

function team(c: any): RTeam {
  const t = c?.team || {};
  const rk = c?.rank ?? c?.curatedRank?.current;
  return {
    id: t.id, name: t.displayName || t.location || "TBD", short: t.shortDisplayName || t.location || t.displayName || "TBD",
    abbr: t.abbreviation || "", logo: t.logos?.[0]?.href || t.logo || "",
    color: vis("#" + (t.color || "444444"), t.alternateColor ? "#" + t.alternateColor : undefined),
    score: c?.score != null && c.score !== "" ? Number(c.score) : null, winner: !!c?.winner,
    rank: rk && rk <= 25 ? rk : null, record: c?.record?.[0]?.displayValue || c?.record?.[0]?.summary || "",
  };
}

export async function getRecap(id: string): Promise<Recap | null> {
  if (!/^\d+$/.test(id)) return null;
  let d: any;
  try {
    const r = await fetch(`${ESPN}/summary?event=${id}`, { next: { revalidate: 60 } });
    if (!r.ok) return null;
    d = await darkJson(r);
  } catch { return null; }
  const comp = d.header?.competitions?.[0];
  if (!comp) return null;
  const hc = comp.competitors?.find((x: any) => x.homeAway === "home"), ac = comp.competitors?.find((x: any) => x.homeAway === "away");
  const home = team(hc), away = team(ac);
  const state = comp.status?.type?.state || "pre";

  const line: string | null = d.pickcenter?.[0]?.details || null;
  let favSide: "home" | "away" | null = null, spread: number | null = null;
  const m = line?.match(/^([A-Z&]+)\s+(-?\d+(\.\d+)?)/);
  if (m) { favSide = m[1] === away.abbr ? "away" : "home"; spread = Math.abs(parseFloat(m[2])); }
  let upset = false, ats: string | null = null;
  if (state === "post" && favSide && home.score != null && away.score != null) {
    const fav = favSide === "home" ? home : away, dog = favSide === "home" ? away : home;
    const margin = fav.score! - dog.score!;
    upset = margin < 0;
    ats = spread == null ? null : margin > spread ? `${fav.abbr} covered -${spread}` : margin === spread ? "Push" : `${dog.abbr} covered +${spread}`;
  }

  const videos: Video[] = (d.videos || []).slice(0, 8).map((v: any) => ({
    title: v.headline || "", thumb: v.thumbnail || "", mp4: v.links?.source?.HD?.href || v.links?.source?.href || "",
    url: v.links?.web?.href || "", duration: v.duration || 0,
  })).filter((v: Video) => v.mp4);

  const a = d.article;
  const article = a?.headline ? { headline: ent(a.headline), text: clip(strip(a.story || a.description || ""), 900), url: a.links?.web?.href || null } : null;

  const scoring = (d.scoringPlays || []).map((s: any) => ({
    q: (s.period?.number || 0) > 4 ? "OT" : `Q${s.period?.number || "?"}`, clock: s.clock?.displayValue || "",
    text: s.text || "", type: s.type?.text || "", logo: s.team?.logo || "", away: s.awayScore ?? 0, home: s.homeScore ?? 0,
  }));

  const leaders: Recap["leaders"] = [];
  for (const L of d.leaders || []) {
    const side = L.team?.id === home.id ? "home" : "away";
    for (const c of (L.leaders || []).filter((c: any) => /passing|rushing|receiving/i.test(c.name))) {
      const top = c.leaders?.[0];
      if (top) leaders.push({ side, cat: c.displayName || c.name, name: top.athlete?.displayName || "", value: top.displayValue || "" });
    }
  }

  const WANT = ["Total Yards", "Passing", "Rushing", "1st Downs", "3rd down efficiency", "Turnovers", "Penalties", "Possession"];
  const bt = d.boxscore?.teams || [];
  const hs = bt.find((t: any) => t.team?.id === home.id)?.statistics || [], as = bt.find((t: any) => t.team?.id === away.id)?.statistics || [];
  const stats = WANT.map((label) => ({
    label, home: hs.find((s: any) => s.label === label)?.displayValue ?? "", away: as.find((s: any) => s.label === label)?.displayValue ?? "",
  })).filter((s) => s.home !== "" || s.away !== "");

  const periodOf = new Map<string, number>();
  for (const dr of d.drives?.previous || []) for (const p of dr.plays || []) periodOf.set(String(p.id), p.period?.number || 0);
  const raw = (d.winprobability || []).map((w: any) => ({ home: w.homeWinPercentage as number, p: periodOf.get(String(w.playId)) || 0 }));
  if (state === "post" && raw.length) raw.push({ home: home.winner ? 1 : away.winner ? 0 : 0.5, p: raw[raw.length - 1].p });
  let swing = 0;
  for (let i = 1; i < raw.length; i++) swing = Math.max(swing, Math.abs(raw[i].home - raw[i - 1].home));
  const step = Math.max(1, Math.ceil(raw.length / 180));
  const sample = raw.filter((_: any, i: number) => i % step === 0 || i === raw.length - 1);
  const wp = sample.map((w: any, i: number) => ({ x: sample.length > 1 ? i / (sample.length - 1) : 0, home: w.home }));
  const quarters: Recap["quarters"] = [];
  let lastP = 0;
  sample.forEach((w: any, i: number) => {
    if (w.p > lastP && lastP > 0) quarters.push({ x: wp[i].x, label: w.p > 4 ? "OT" : `Q${w.p}` });
    if (w.p > lastP) lastP = w.p;
  });

  const gi = d.gameInfo || {};
  return {
    id, state, detail: comp.status?.type?.shortDetail || "", date: comp.date || "",
    venue: [gi.venue?.fullName, gi.venue?.address?.city].filter(Boolean).join(", "), attendance: gi.attendance || null,
    home, away, line, favSide, spread, upset, ats, videos, article, scoring, leaders, stats, wp, quarters, swing: Math.round(swing * 100),
  };
}
