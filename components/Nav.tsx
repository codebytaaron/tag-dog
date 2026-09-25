"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Logo from "./Logo";
import Search from "./Search";
import { useProfile } from "./SaveButton";

function Me() {
  const { profile } = useProfile();
  const ini = profile ? profile.name.trim().split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase() : "ME";
  return (
    <Link href="/profile" className={`avatar ${profile ? "has" : ""}`} title="Your profile" style={profile ? { background: profile.color } : undefined}>{ini}</Link>
  );
}

const LINKS = [
  { href: "/board", label: "Fade Board" },
  { href: "/replay", label: "Replay" },
  { href: "/about", label: "How it works" },
];

export default function Nav() {
  const path = usePathname();
  const tab = useSearchParams().get("tab");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  useEffect(() => setOpen(false), [path, tab]);
  const on = (href: string) => path === href || (href === "/board" && (path.startsWith("/game") || path.startsWith("/team")));

  return (
    <header className={`nav ${path === "/" ? "nav-fixed" : ""} ${path === "/" && !open && !scrolled ? "nav-float" : ""}`}>
      <div className="wrap navin">
        <Link href="/" className="brand"><Logo /> <span>TAPEDOG</span></Link>
        <nav className="links">
          {LINKS.map((l) => <Link key={l.href} href={l.href} className={on(l.href) ? "on" : ""}>{l.label}</Link>)}
          <Link href="/dogzone" className={`dz ${path === "/dogzone" ? "on" : ""}`}>Dog Zone <em>PLUS</em></Link>
        </nav>
        <Search />
        <Me />
        <button className="burger" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          <span className={open ? "x" : ""} />
        </button>
      </div>
      {open && (
        <div className="mnav">
          <Link href="/board" className={path === "/board" && !tab ? "on" : ""}>Fade Board</Link>
          <Link href="/board?tab=scores" className={tab === "scores" ? "on" : ""}>Live scores</Link>
          <Link href="/replay" className={path === "/replay" ? "on" : ""}>Replay</Link>
          <Link href="/board?tab=saved" className={tab === "saved" ? "on" : ""}>Saved games</Link>
          <Link href="/about" className={path === "/about" ? "on" : ""}>How it works</Link>
          <Link href="/dogzone" className={path === "/dogzone" ? "on" : ""}>Dog Zone <em className="plus">PLUS</em></Link>
          <Link href="/founder" className={path === "/founder" ? "on" : ""}>Founder</Link>
          <Link href="/profile" className={path === "/profile" ? "on" : ""}>Your profile</Link>
        </div>
      )}
    </header>
  );
}
