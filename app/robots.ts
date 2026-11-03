export default function robots() {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }], sitemap: "https://tapedog.vercel.app/sitemap.xml" };
}
