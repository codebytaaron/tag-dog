import { NextResponse } from "next/server";
import { getSlate, getLiveOdds } from "@/lib/data";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function candles(ticker: string, live: boolean) {
  const now = Math.floor(Date.now() / 1000);
  const span = live ? 5 * 3600 : 5 * 86400, per = live ? 1 : 60;
  try {
    const r = await fetch(`https://api.elections.kalshi.com/trade-api/v2/series/KXNCAAFGAME/markets/${ticker}/candlesticks?start_ts=${now - span}&end_ts=${now}&period_interval=${per}`, { next: { revalidate: live ? 30 : 300 } });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.candlesticks || []).map((c: any) => {
      const close = parseFloat(c.price?.close_dollars ?? "");
      const mid = (parseFloat(c.yes_bid?.close_dollars ?? "") + parseFloat(c.yes_ask?.close_dollars ?? "")) / 2;
      return { t: c.end_period_ts * 1000, p: Number.isNaN(close) ? mid : close };
    }).filter((x: any) => !Number.isNaN(x.p) && x.p > 0 && x.p < 1);
  } catch { return []; }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = (await getSlate()).games.find((x) => x.id === id);
  if (!g) return NextResponse.json({ error: "Game not on this week's slate" }, { status: 404 });
  const odds = await getLiveOdds(g);
  const live = Date.now() > Date.parse(g.date);
  const tick = odds.kalshi?.tickers?.home || g.kalshi?.tickers?.home;
  const history = tick ? await candles(tick, live) : [];
  return NextResponse.json({ ...odds, history }, { headers: { "cache-control": "public, s-maxage=20, stale-while-revalidate=40" } });
}
