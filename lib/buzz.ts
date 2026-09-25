// Game chatter: Bluesky posts (free public API), strictly filtered to football posts about
// these two teams, plus Google News headlines. Cached 15–30 min.
import type { Team } from "./data";

export type Post = {
  handle: string; name: string; avatar: string; text: string; likes: number; reposts: number;
  url: string; at: string; side: "both" | "home" | "away";
};
export type Headline = { title: string; url: string; source: string; at: string };
export type Buzz = { posts: Post[]; news: Headline[]; volume: { away: number; home: number } };

const STRONG = /\b(football|cfb|kickoff|kick-off|touchdown|tds?|qb|quarterback|head coach|spread|upset|gameday|game day|top 25|ap poll|bowl|playoffs?|cfp|halftime|4th quarter|fourth quarter|field goal|interception|rushing|passing yards)\b/i;
const MATCHUP = /\b(vs\.?|versus|at|@|game|matchup|preview|prediction|picks?|beat|beats|win|wins|loss|lose|saturday|kickoff|week \d+)\b/i;
const OTHER = /\b(basketball|hoops|baseball|softball|volleyball|soccer|hockey|wrestling|golf|tennis|nba|mlb|nhl|wnba|nfl draft|gymnastics|track and field|election|senate|governor|legislature)\b/i;
const decode = (s: string) => s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;/g, "\x27").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const terms = (t: Team) => [t.location, t.nick, t.short].filter((x) => x && x.length >= 3).map((x) => x.toLowerCase());
const hits = (low: string, ts: string[]) => ts.some((x) => new RegExp(`(^|[^a-z])${x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(low));

async function bluesky(q: string, sort: "top" | "latest"): Promise<any[]> {
  try {
    const r = await fetch(`https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=40&sort=${sort}&lang=en`, { next: { revalidate: 900 } });
    return r.ok ? (await r.json()).posts || [] : [];
  } catch { return []; }
}

async function news(q: string): Promise<Headline[]> {
  try {
    const r = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}+when:7d&hl=en-US&gl=US&ceid=US:en`, { next: { revalidate: 1800 } });
    if (!r.ok) return [];
    const xml = await r.text();
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 8).map((m) => {
      const it = m[1];
      const pick = (tag: string) => decode((it.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)) || [])[1] || "");
      const source = pick("source");
      const title = pick("title");
      return { title: source && title.endsWith(` - ${source}`) ? title.slice(0, -(source.length + 3)) : title, url: pick("link"), source, at: pick("pubDate") };
    });
  } catch { return []; }
}

export async function getBuzz(away: Team, home: Team): Promise<Buzz> {
  const A = terms(away), H = terms(home);
  const qs: [string, "top" | "latest"][] = [
    [`${away.location} ${home.location}`, "top"], [`${away.location} ${home.location}`, "latest"],
    [`${away.location} ${home.location} football`, "latest"],
  ];
  if (away.nick && home.nick) qs.push([`${away.nick} ${home.nick}`, "latest"], [`${away.nick} ${home.nick}`, "top"]);
  if (away.nick) qs.push([`${away.location} ${away.nick}`, "latest"]);
  if (home.nick) qs.push([`${home.location} ${home.nick}`, "latest"]);

  const [raw, n1, n2, n3] = await Promise.all([
    Promise.all(qs.map(([q, s]) => bluesky(q, s))).then((x) => x.flat()),
    news(`"${away.location}" "${home.location}" football`),
    news(`"${away.location} ${away.nick}" football`),
    news(`"${home.location} ${home.nick}" football`),
  ]);

  const now = Date.now();
  const seen = new Set<string>();
  const posts: (Post & { rank: number })[] = [];
  for (const p of raw) {
    const text = String(p.record?.text || "").trim();
    const key = text.slice(0, 80).toLowerCase();
    const at = p.record?.createdAt || p.indexedAt;
    const age = (now - Date.parse(at)) / 3600000;
    if (!text || seen.has(key) || age > 24 * 6 || age < -1 || text.length < 30 || OTHER.test(text)) continue;
    if ((text.match(/#/g) || []).length > 5) continue;
    const low = text.toLowerCase();
    const a = hits(low, A), h = hits(low, H);
    const both = a && h;
    if (!(both ? STRONG.test(text) || MATCHUP.test(text) : (a || h) && STRONG.test(text) && MATCHUP.test(text))) continue;
    seen.add(key);
    const likes = p.likeCount || 0, reposts = p.repostCount || 0;
    posts.push({
      handle: p.author?.handle || "", name: p.author?.displayName || p.author?.handle || "", avatar: p.author?.avatar || "",
      text: text.slice(0, 320), likes, reposts, at,
      url: `https://bsky.app/profile/${p.author?.handle}/post/${String(p.uri).split("/").pop()}`,
      side: both ? "both" : a ? "away" : "home",
      rank: (both ? 3 : 1) * (1 + Math.log1p(likes + 2 * reposts + (p.replyCount || 0))) / (1 + Math.max(0, age) / 24),
    });
  }
  posts.sort((x, y) => y.rank - x.rank);
  const recent = posts.filter((p) => now - Date.parse(p.at) < 48 * 3600000);

  const tseen = new Set<string>();
  const both = [...A, ...H];
  const headlines = [...n1, ...n2, ...n3]
    .filter((n) => { const k = n.title.toLowerCase(); if (tseen.has(k) || !hits(k, both)) return false; tseen.add(k); return true; })
    .sort((x, y) => Date.parse(y.at) - Date.parse(x.at))
    .slice(0, 6);

  return {
    posts: posts.slice(0, 10).map(({ rank, ...p }) => p),
    news: headlines,
    volume: { away: recent.filter((p) => p.side !== "home").length, home: recent.filter((p) => p.side !== "away").length },
  };
}
