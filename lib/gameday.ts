// Finds where ESPN College GameDay is this week by matching recent headlines
// (Google News RSS) against this week's games. No manual updates needed.
import type { Game } from "./data";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function getGameDayId(games: Game[]): Promise<string | null> {
  try {
    const r = await fetch("https://news.google.com/rss/search?q=%22College+GameDay%22+when:7d&hl=en-US&gl=US&ceid=US:en", { next: { revalidate: 3600 } });
    if (!r.ok) return null;
    const xml = await r.text();
    const titles = [...xml.matchAll(/<item><title>([\s\S]*?)<\/title>/g)]
      .map((m) => m[1].toLowerCase().replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "\x27"));
    const has = (s: string, terms: string[]) => terms.some((t) => t.length >= 4 && new RegExp(`(^|[^a-z])${esc(t)}([^a-z]|$)`).test(s));
    let best: { id: string; n: number } | null = null;
    for (const g of games) {
      if (g.state === "post") continue;
      const H = [g.home.location, g.home.nick, g.home.short, g.venue.city].map((x) => (x || "").toLowerCase());
      const A = [g.away.location, g.away.nick, g.away.short].map((x) => (x || "").toLowerCase());
      const n = titles.filter((t) => has(t, H) && has(t, A)).length;
      if (n >= 2 && (!best || n > best.n)) best = { id: g.id, n };
    }
    return best?.id ?? null;
  } catch { return null; }
}
