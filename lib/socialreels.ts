// Highlight clips posted to Bluesky by outlets and reporters (free public API). They join Reels as a second source.
import type { Reel, ReelTeam } from "./reels";

const QUERIES = ["college football touchdown", "college football highlights", "CFB highlight", "touchdown", "pick six", "game-winning"];
const CFB = /college football|\bcfb\b|\bncaa|big ten|\bsec\b|\bacc\b|big 12|mountain west|sun belt|\bfbs\b|heisman/i;
const PLAY = /touchdown|\btd\b|field goal|pick.?six|interception|catch|run|sack|return|score|highlight|game-?winn/i;
const OTHER = /\bnfl\b|\bnba\b|\bmlb\b|\bnhl\b|premier league|soccer|basketball|baseball|hockey|chiefs|eagles|cowboys|patriots|packers|bills|steelers|49ers|ravens|lions|bears/i;
const blank: ReelTeam = { id: "", abbr: "", short: "", logo: "", rank: null, score: null, winner: false };

export async function getSocialReels(week: number): Promise<Reel[]> {
  const posts = (await Promise.all(QUERIES.flatMap((q) => ["top", "latest"].map(async (sort) => {
    try {
      const r = await fetch(`https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=50&sort=${sort}`, { next: { revalidate: 1800 } });
      return r.ok ? (await r.json()).posts || [] : [];
    } catch { return []; }
  })))).flat();
  const seen = new Set<string>(), out: Reel[] = [];
  for (const p of posts) {
    const e = p.embed || {};
    const vid = String(e.$type || "").startsWith("app.bsky.embed.video") ? e : String(e.media?.$type || "").startsWith("app.bsky.embed.video") ? e.media : null;
    if (!vid?.playlist || seen.has(p.uri)) continue;
    seen.add(p.uri);
    const text = String(p.record?.text || "").trim();
    const age = (Date.now() - Date.parse(p.indexedAt)) / 864e5;
    if (age > 14 || text.length < 20 || !CFB.test(text) || !PLAY.test(text) || OTHER.test(text)) continue;
    const rkey = String(p.uri).split("/").pop();
    const likes = (p.likeCount || 0) + 2 * (p.repostCount || 0);
    out.push({
      key: `bsky-${rkey}`, gameId: "", title: text.split("\n")[0].slice(0, 140), url: `https://bsky.app/profile/${p.author?.handle}/post/${rkey}`,
      mp4: vid.playlist, thumb: vid.thumbnail || "", duration: 0, away: blank, home: blank, week, tags: ["Social"],
      score: Math.max(5, 18 + Math.log1p(likes) * 6 - age * 1.5), source: "bluesky", handle: p.author?.handle || "",
    });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 30);
}
