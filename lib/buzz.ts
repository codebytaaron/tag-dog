// Public chatter for a matchup: Bluesky posts (free public API) + Google News headlines (RSS).
export type Post = { handle: string; name: string; avatar: string; text: string; likes: number; url: string; at: string };
export type Headline = { title: string; url: string; source: string; at: string };
export type Buzz = { posts: Post[]; news: Headline[] };

const decode = (s: string) => s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;/g, "\x27").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

async function bluesky(q: string, sort: "top" | "latest") {
  const r = await fetch(`https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=15&sort=${sort}&lang=en`, { next: { revalidate: 900 } });
  if (!r.ok) return [];
  const d = await r.json();
  return (d.posts || []).map((p: any): Post => ({
    handle: p.author?.handle || "", name: p.author?.displayName || p.author?.handle || "",
    avatar: p.author?.avatar || "", text: String(p.record?.text || "").slice(0, 300),
    likes: p.likeCount || 0, at: p.record?.createdAt || p.indexedAt,
    url: `https://bsky.app/profile/${p.author?.handle}/post/${String(p.uri).split("/").pop()}`,
  }));
}

async function news(q: string): Promise<Headline[]> {
  const r = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`, { next: { revalidate: 1800 } });
  if (!r.ok) return [];
  const xml = await r.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 4).map((m) => {
    const it = m[1];
    const pick = (tag: string) => decode((it.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)) || [])[1] || "");
    const source = pick("source");
    return { title: pick("title").replace(new RegExp(`\\s-\\s${source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), ""), url: pick("link"), source, at: pick("pubDate") };
  });
}

export async function getBuzz(a: string, b: string): Promise<Buzz> {
  const q = `${a} ${b}`;
  const [top, latest, headlines] = await Promise.all([
    bluesky(q, "top").catch(() => []), bluesky(q, "latest").catch(() => []), news(`"${a}" "${b}" football`).catch(() => []),
  ]);
  const seen = new Set<string>();
  const week = Date.now() - 10 * 86400000;
  const posts = [...top, ...latest].filter((p) => {
    if (seen.has(p.url) || Date.parse(p.at) < week || p.text.length < 25) return false;
    seen.add(p.url);
    return true;
  }).slice(0, 8);
  return { posts, news: headlines };
}
