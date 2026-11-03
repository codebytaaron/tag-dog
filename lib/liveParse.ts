// Live scoreboard parsing shared by server and browser.
// In the browser we read ESPN's scoreboard directly (ESPN allows cross-site requests and serves it from its
// own CDN), so live polling by any number of visitors never touches our servers. Falls back to /api/live.
import { readable } from "./espn";

export type LT = { abbr: string; short: string; logo: string; color: string; rank: number | null };
export type Live = {
  state: string; detail: string; clock: string; period: number;
  home: number | null; away: number | null; poss: string | null; down: string | null;
  lastPlay: string | null; homeWP: number | null; redZone: boolean;
  teams?: { home: LT; away: LT };
};

export const SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=300";

const lt = (x: any): LT => {
  const rk = x?.curatedRank?.current;
  return {
    abbr: x?.team?.abbreviation || "", short: x?.team?.shortDisplayName || "", logo: x?.team?.logo || "",
    color: readable("#" + (x?.team?.color || "444444"), x?.team?.alternateColor ? "#" + x.team.alternateColor : undefined),
    rank: rk && rk <= 25 ? rk : null,
  };
};

export function parseScoreboard(d: any): Record<string, Live> {
  const out: Record<string, Live> = {};
  for (const e of d?.events || []) {
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
      teams: { home: lt(h), away: lt(a) },
    };
  }
  return out;
}

export async function fetchLiveDirect(): Promise<Record<string, Live> | null> {
  try {
    const r = await fetch(SCOREBOARD);
    if (r.ok) { const m = parseScoreboard(await r.json()); if (Object.keys(m).length) return m; }
  } catch {}
  try {
    const r = await fetch("/api/live", { cache: "no-store" });
    if (r.ok) { const m = await r.json(); if (Object.keys(m).length) return m; }
  } catch {}
  return null;
}
