"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Logo from "./Logo";
import Search from "./Search";
import ThemeToggle from "./ThemeToggle";
import { useProfile } from "./SaveButton";

function Me() {
  const { profile } = useProfile();
  const ini = profile ? profile.name.trim().split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase() : "ME";
  return (
    <Link href="/profile" className={`avatar ${profile ? "has" : ""}`} title="Your profile" style={profile ? { background: profile.color } : undefined}>{ini}</Link>
  );
}

export default function Nav() {
  const path = usePathname();
  const tab = useSearchParams().get("tab");
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path, tab]);

  const scores = (path === "/board" && tab === "scores") || path === "/replay";
  const LINKS = [
    { href: "/board", label: "Board", on: (path === "/board" && tab !== "scores") || path.startsWith("/game") },
    { href: "/board?tab=scores", label: "Scores", on: scores },
    { href: "/reels", label: "Reels", on: path === "/reels" },
    { href: "/tracker", label: "Tracker", on: path === "/tracker" },
    { href: "/rankings", label: "Rankings", on: path === "/rankings" || path.startsWith("/team") },
  ];

  return (
    <header className="nav">
      <div className="wrap navin">
        <Link href="/" className="brand"><Logo /> <span>TAPEDOG</span></Link>
        <nav className="links">
          {LINKS.map((l) => <Link key={l.href} href={l.href} className={l.on ? "on" : ""}>{l.label}</Link>)}
          <Link href="/app" className={`navapp ${path === "/app" ? "on" : ""}`}>Get the app</Link>
        </nav>
        <ThemeToggle />
        <Search />
        <Me />
        <button className="burger" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          <span className={open ? "x" : ""} />
        </button>
      </div>
      {open && (
        <div className="mnav">
          <Link href="/app" className="mapp">TapeDog for iPhone <em>New</em></Link>
          <span className="mgroup">Games</span>
          {LINKS.map((l) => <Link key={l.href} href={l.href} className={l.on ? "on" : ""}>{l.label}</Link>)}
          <span className="mgroup">Season</span>
          <Link href="/playoff" className={path === "/playoff" ? "on" : ""}>Playoff bracket</Link>
          <Link href="/record" className={path === "/record" ? "on" : ""}>Track record</Link>
          <Link href="/replay" className={path === "/replay" ? "on" : ""}>Past results</Link>
          <span className="mgroup">You</span>
          <Link href="/board?tab=saved" className={tab === "saved" ? "on" : ""}>Saved</Link>
          <Link href="/profile" className={path === "/profile" ? "on" : ""}>Your profile</Link>
          <Link href="/dogzone" className={path === "/dogzone" ? "on" : ""}>Dog Zone</Link>
          <Link href="/about" className={path === "/about" ? "on" : ""}>How it works</Link>
        </div>
      )}
    </header>
  );
}
