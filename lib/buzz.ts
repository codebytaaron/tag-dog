// Game chatter: Bluesky posts (free public API), strictly filtered to football posts about
// these two teams, plus Google News headlines. Cached 15–30 min.
import type { Team } from "./data";

export type Post = {
  handle: string; name: string; avatar: string; text: string; likes: number; reposts: number;
  url: string; at: string; side: "both" | "home" | "away"; role: string;
};
export type Headline = { title: string; url: string; source: string; at: string };
export type Buzz = { posts: Post[]; news: Headline[]; volume: { away: number; home: number } };

// Who counts as a pro: reporters, analysts, outlets. Checked against the author's Bluesky bio.
const PRO = /\b(reporter|writer|editor|analyst|insider|columnist|beat|covers?|covering|host|podcast|journalist|correspondent|recruiting|contributor|radio|broadcaster|anchor|newsroom|producer|espn|the athletic|247sports|247|on3|rivals|cbs ?sports|fox ?sports|usa today|sports illustrated|si\.com|yahoo|bleacher|sb ?nation|the ringer|associated press|gazette|times|tribune|herald|news|journal|chronicle|observer|dispatch|courier|daily)\b/i;

async function profiles(handles: string[]) {
  const out = new Map<string, { bio: string; followers: number }>();
  for (let i = 0; i < handles.length; i += 25) {
    const chunk = handles.slice(i, i + 25);
    try {
      const r = await fetch(`https://api.bsky.app/xrpc/app.bsky.actor.getProfiles?${chunk.map((h) => `actors=${encodeURIComponent(h)}`).join("&")}`, { next: { revalidate: 86400 } });
      if (!r.ok) continue;
      for (const p of (await r.json()).profiles || []) out.set(p.handle, { bio: p.description || "", followers: p.followersCount || 0 });
    } catch {}
  }
  return out;
}

const STRONG = /\b(football|cfb|kickoff|kick-off|touchdown|tds?|qb|quarterback|head coach|spread|upset|gameday|game day|top 25|ap poll|bowl|playoffs?|cfp|halftime|4th quarter|fourth quarter|field goal|interception|rushing|passing yards)\b/i;
const MATCHUP = /\b(vs\.?|versus|at|@|game|matchup|preview|prediction|picks?|beat|beats|win|wins|loss|lose|saturday|kickoff|week \d+)\b/i;
const JUNK = /\b(album|albums|song|songs|playlist|spotify|sponsor|sponsors|giveaway|recipe|concert|tickets for sale)\b/i;
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
  const year = new Date().getFullYear();
  const otherYear = new RegExp(`\\b(20\\d\\d)\\b`, "g");
  const seen = new Set<string>();
  const posts: (Post & { rank: number })[] = [];
  const vol = { away: new Set<string>(), home: new Set<string>() };
  for (const p of raw) {
    const text = String(p.record?.text || "").trim();
    const key = text.slice(0, 80).toLowerCase();
    const at = p.record?.createdAt || p.indexedAt;
    const age = (now - Date.parse(at)) / 3600000;
    if (!text || seen.has(key) || age > 24 * 5 || age < -1 || text.length < 30 || OTHER.test(text) || JUNK.test(text)) continue;
    if ([...text.matchAll(otherYear)].some((m) => Number(m[1]) !== year)) continue;
    if ((text.match(/#/g) || []).length > 5) continue;
    const low = text.toLowerCase();
    const a = hits(low, A), h = hits(low, H);
    const both = a && h;
    // Fan volume counts any football post about either team in the last 48h.
    if (age < 48 && STRONG.test(text)) { if (a) vol.away.add(key); if (h) vol.home.add(key); }
    // The feed only shows posts about THIS game: both teams named, football context.
    if (!both || !(STRONG.test(text) || MATCHUP.test(text))) continue;
    if (age < 48) { vol.away.add(key); vol.home.add(key); }
    seen.add(key);
    const likes = p.likeCount || 0, reposts = p.repostCount || 0;
    posts.push({
      handle: p.author?.handle || "", name: p.author?.displayName || p.author?.handle || "", avatar: p.author?.avatar || "",
      text: text.slice(0, 320), likes, reposts, at,
      url: `https://bsky.app/profile/${p.author?.handle}/post/${String(p.uri).split("/").pop()}`,
      side: both ? "both" : a ? "away" : "home", role: "",
      rank: (both ? 3 : 1) * (1 + Math.log1p(likes + 2 * reposts + (p.replyCount || 0))) / (1 + Math.max(0, age) / 24),
    });
  }
  posts.sort((x, y) => y.rank - x.rank);
  // Keep only pros: a real following plus a reporter/analyst/outlet bio (or an established custom-domain account).
  const prof = await profiles([...new Set(posts.map((p) => p.handle))]);
  const pros = posts.filter((p) => {
    const a = prof.get(p.handle);
    if (!a) return false;
    const custom = !p.handle.endsWith(".bsky.social");
    return a.followers >= 500 && (PRO.test(a.bio) || PRO.test(p.name) || (custom && a.followers >= 1500));
  }).map((p) => {
    const a = prof.get(p.handle)!;
    return { ...p, role: a.bio.split(/[\n|•·]/)[0].trim().slice(0, 80), rank: p.rank * (1 + Math.log10(1 + a.followers)) };
  }).sort((x, y) => y.rank - x.rank);

  const tseen = new Set<string>();
  const both = [...A, ...H];
  const headlines = [...n1, ...n2, ...n3]
    .filter((n) => { const k = n.title.toLowerCase(); if (tseen.has(k) || !hits(k, both)) return false; tseen.add(k); return true; })
    .sort((x, y) => Date.parse(y.at) - Date.parse(x.at))
    .slice(0, 6);

  return {
    posts: pros.slice(0, 10).map(({ rank, ...p }) => p),
    news: headlines,
    volume: { away: vol.away.size, home: vol.home.size },
  };
}
