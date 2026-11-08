import { getRecord, type Call } from "@/lib/record";
import { CANDIDATES } from "@/lib/signals";

// The headline stat: how much more often TapeDog's FADE favorites lose than the average favorite.
export type Edge = { year: number; fadePct: number; expPct: number; allPct: number; fadeN: number; allN: number; coverPct: number; lo: number; hi: number };

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

// What the betting line implied: the chance the underdog wins outright, from the spread
// (college football margins are roughly normal around the spread, standard deviation ~14.5 points).
const erf = (x: number) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
export const lineUpset = (spread: number | null) => (spread == null ? null : 1 - 0.5 * (1 + erf(spread / 14.5 / Math.SQRT2)));
const expected = (l: Call[]) => { const v = l.map((c) => lineUpset(c.spread)).filter((x): x is number => x != null); return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) : 0; };

export function edgeFrom(year: number, calls: Call[]): Edge | null {
  const fade = calls.filter((c) => c.tier === "FADE");
  if (!fade.length || !calls.length) return null;
  const fadeUp = fade.filter((c) => c.upset).length, allUp = calls.filter((c) => c.upset).length;
  const graded = fade.filter((c) => c.cover !== null);
  const p = fadeUp / fade.length, se = Math.sqrt((p * (1 - p)) / fade.length);
  return {
    year, fadeN: fade.length, allN: calls.length, fadePct: pct(fadeUp, fade.length), allPct: pct(allUp, calls.length),
    expPct: expected(fade), coverPct: pct(graded.filter((c) => c.cover).length, graded.length),
    lo: Math.max(0, Math.round((p - 1.96 * se) * 100)), hi: Math.min(100, Math.round((p + 1.96 * se) * 100)),
  };
}

export async function getEdge(): Promise<Edge | null> {
  try { const r = await getRecord(); return edgeFrom(r.year, r.calls); } catch { return null; }
}

// Model Lab: the same graded games, run through different FADE rules, so changes are judged on identical data.
// Every signal here is known before kickoff, so nothing from the result leaks into the pick.
export type LabRow = { name: string; rule: string; n: number; upset: number; expected: number; cover: number };
const SCHEDULE = ["Look-ahead", "Letdown", "Sandwich", "Short week", "Road night game", "Road favorite", "Dog off a bye"];
const MARKET = ["Line sliding to dog", "Live number"];

export function lab(calls: Call[]): LabRow[] {
  const row = (name: string, rule: string, f: (c: Call) => boolean): LabRow => {
    const l = calls.filter(f), g = l.filter((c) => c.cover !== null);
    return { name, rule, n: l.length, upset: pct(l.filter((c) => c.upset).length, l.length), expected: expected(l), cover: pct(g.filter((c) => c.cover).length, g.length) };
  };
  return [
    row("All favorites", "Every graded game", () => true),
    row("Current FADE", "TAPE score 50+", (c) => c.tier === "FADE"),
    row("Stricter FADE", "TAPE 50+ and 3 or more flags", (c) => c.tier === "FADE" && c.flags.length >= 3),
    row("Two kinds of evidence", "A schedule spot and a market signal", (c) => c.flags.some((f) => SCHEDULE.includes(f)) && c.flags.some((f) => MARKET.includes(f))),
    row("Close lines only", "FADE with a spread of 10 or less", (c) => c.tier === "FADE" && (c.spread ?? 99) <= 10),
  ];
}

// Calibration: do higher TAPE scores actually lose more often?
export function buckets(calls: Call[]) {
  const b = [[0, 27, "0–27"], [28, 49, "28–49"], [50, 69, "50–69"], [70, 99, "70+"]] as const;
  return b.map(([lo, hi, label]) => {
    const l = calls.filter((c) => c.score >= lo && c.score <= hi);
    return { label, n: l.length, upset: pct(l.filter((c) => c.upset).length, l.length), expected: expected(l) };
  });
}

// Candidate signals, tested on two seasons. A signal only earns points in the TAPE score if favorites in those
// games lose more often than the lines expected in BOTH seasons, on at least 30 games each. One good season can be luck.
export type SeasonCut = { n: number; upset: number; expected: number; diff: number };
export type CandidateRow = { name: string; cur: SeasonCut; past: SeasonCut; verdict: "Passes" | "Fails" | "Too few games" };
const MIN_GAMES = 30;

const cut = (l: Call[]): SeasonCut => {
  const v = l.map((c) => lineUpset(c.spread)).filter((x): x is number => x != null);
  const up = l.length ? (l.filter((c) => c.upset).length / l.length) * 100 : 0;
  const ex = v.length ? (v.reduce((a, b) => a + b, 0) / v.length) * 100 : 0;
  return { n: l.length, upset: Math.round(up), expected: Math.round(ex), diff: Math.round(up - ex) };
};

export function candidateLab(cur: Call[], past: Call[], names: string[]): CandidateRow[] {
  return names.map((name) => {
    const a = cut(cur.filter((c) => c.extra?.includes(name))), b = cut(past.filter((c) => c.extra?.includes(name)));
    const verdict = a.n < MIN_GAMES || b.n < MIN_GAMES ? "Too few games" : a.diff > 0 && b.diff > 0 ? "Passes" : "Fails";
    return { name, cur: a, past: b, verdict };
  });
}

// The current TAPE rules on last season: games the model was never tuned on.
export const holdout = (past: Call[]) => ({ all: cut(past), fade: cut(past.filter((c) => c.tier === "FADE")) });

// Model versions side by side. "Travel" adds points when the favorite crosses 2+ time zones or travels
// 1,200+ miles, the two signals that beat the lines in both seasons. It is a test model, not the live score.
export const TRAVEL_POINTS = 10;
const travelScore = (c: Call) => Math.min(99, c.score + (c.extra?.some((x) => x === CANDIDATES.zones || x === CANDIDATES.trip) ? TRAVEL_POINTS : 0));
export type ModelRow = { name: string; about: string; cur: SeasonCut; past: SeasonCut };

export function compareModels(cur: Call[], past: Call[]): ModelRow[] {
  const fade = (l: Call[], s: (c: Call) => number) => cut(l.filter((c) => s(c) >= 50));
  return [
    { name: "Current TAPE", about: "What the site and app use today", cur: fade(cur, (c) => c.score), past: fade(past, (c) => c.score) },
    { name: "TAPE + travel", about: `+${TRAVEL_POINTS} for 2+ time zones or 1,200+ miles`, cur: fade(cur, travelScore), past: fade(past, travelScore) },
    { name: "Betting lines alone", about: "Every favorite, as a baseline", cur: cut(cur), past: cut(past) },
  ];
}
