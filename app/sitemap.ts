const BASE = "https://tapedog.vercel.app";

export default function sitemap() {
  return ["", "/board", "/reels", "/replay", "/rankings", "/about", "/dogzone", "/founder", "/terms", "/privacy"].map((p) => ({
    url: `${BASE}${p}`, lastModified: new Date(), changeFrequency: p === "" || p === "/board" ? "hourly" : "weekly", priority: p === "" ? 1 : 0.7,
  }));
}
