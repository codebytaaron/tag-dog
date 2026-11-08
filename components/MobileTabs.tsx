"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

// Phones only: the same bottom tab bar as the iPhone app.
const I = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  scores: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M12 6v12M2 10h3v4H2M22 10h-3v4h3" /></>,
  board: <path d="M12 2c1 4-3 5-3 9a3 3 0 0 0 6 0c0-1-.5-2-1-3 3 1 5 4 5 7a7 7 0 0 1-14 0c0-5 5-8 7-13z" />,
  reels: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9 5 3-5 3z" /></>,
  rank: <path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1" />,
};

export default function MobileTabs() {
  const path = usePathname();
  const tab = useSearchParams().get("tab");
  const items = [
    { href: "/", label: "Home", icon: I.home, on: path === "/" },
    { href: "/board?tab=scores", label: "Scores", icon: I.scores, on: path === "/board" && tab === "scores" },
    { href: "/board", label: "Board", icon: I.board, on: (path === "/board" && tab !== "scores") || path.startsWith("/game") },
    { href: "/reels", label: "Reels", icon: I.reels, on: path === "/reels" },
    { href: "/rankings", label: "Rankings", icon: I.rank, on: path === "/rankings" || path.startsWith("/team") },
  ];
  if (path === "/reels") return null;
  return (
    <nav className="mtabs" aria-label="Sections">
      {items.map((t) => (
        <Link key={t.label} href={t.href} className={t.on ? "on" : ""}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{t.icon}</svg>
          <span>{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}
