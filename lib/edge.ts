import { getRecord, type Call } from "@/lib/record";

// The headline stat: how much more often TapeDog's FADE favorites lose than the average favorite.
export type Edge = { year: number; mult: number; fadePct: number; allPct: number; fadeN: number; allN: number; coverPct: number };

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export function edgeFrom(year: number, calls: Call[]): Edge | null {
  const fade = calls.filter((c) => c.tier === "FADE");
  if (!fade.length || !calls.length) return null;
  const fadeUp = fade.filter((c) => c.upset).length, allUp = calls.filter((c) => c.upset).length;
  const graded = fade.filter((c) => c.cover !== null);
  const fr = fadeUp / fade.length, ar = allUp / calls.length;
  return {
    year, fadeN: fade.length, allN: calls.length, fadePct: pct(fadeUp, fade.length), allPct: pct(allUp, calls.length),
    mult: ar ? Math.round((fr / ar) * 10) / 10 : 0, coverPct: pct(graded.filter((c) => c.cover).length, graded.length),
  };
}

export async function getEdge(): Promise<Edge | null> {
  try { const r = await getRecord(); return edgeFrom(r.year, r.calls); } catch { return null; }
}

// Model Lab: the same graded games, run through different FADE rules, so changes are judged on identical data.
// Every signal here is known before kickoff, so nothing from the result leaks into the pick.
export type LabRow = { name: string; rule: string; n: number; upset: number; cover: number };
const SCHEDULE = ["Look-ahead", "Letdown", "Sandwich", "Short week", "Road night game", "Road favorite", "Dog off a bye"];
const MARKET = ["Line sliding to dog", "Live number"];

export function lab(calls: Call[]): LabRow[] {
  const row = (name: string, rule: string, f: (c: Call) => boolean): LabRow => {
    const l = calls.filter(f), g = l.filter((c) => c.cover !== null);
    return { name, rule, n: l.length, upset: pct(l.filter((c) => c.upset).length, l.length), cover: pct(g.filter((c) => c.cover).length, g.length) };
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
    return { label, n: l.length, upset: pct(l.filter((c) => c.upset).length, l.length) };
  });
}
