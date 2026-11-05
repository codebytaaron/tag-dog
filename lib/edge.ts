import { getRecord, type Call } from "@/lib/record";

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
