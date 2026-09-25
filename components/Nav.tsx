"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Logo from "./Logo";
import Search from "./Search";

const LINKS = [
  { href: "/board", label: "Fade Board", tab: null },
  { href: "/board?tab=scores", label: "Scores", tab: "scores" },
  { href: "/board?tab=saved", label: "Saved", tab: "saved" },
  { href: "/about", label: "About", tab: null },
];

export default function Nav() {
  const path = usePathname();
  const tab = useSearchParams().get("tab");
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path, tab]);

  const active = (l: (typeof LINKS)[number]) =>
    l.href === "/about" ? path === "/about" : path === "/board" && (l.tab ? tab === l.tab : !tab || tab === "heat");

  return (
    <header className={`nav ${path === "/" && !open ? "nav-float" : ""}`}>
      <div className="wrap navin">
        <Link href="/" className="brand"><Logo /> <span>TAPEDOG</span></Link>
        <nav className="links">
          {LINKS.map((l) => <Link key={l.href} href={l.href} className={active(l) ? "on" : ""}>{l.label}</Link>)}
          <Link href="/dogzone" className={`dz ${path === "/dogzone" ? "on" : ""}`}>Dog Zone <em>PLUS</em></Link>
        </nav>
        <Search />
        <Link href="/profile" className="avatar" title="Profile">TA</Link>
        <button className="burger" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          <span className={open ? "x" : ""} />
        </button>
      </div>
      {open && (
        <div className="mnav">
          {LINKS.map((l) => <Link key={l.href} href={l.href} className={active(l) ? "on" : ""}>{l.label}</Link>)}
          <Link href="/board?tab=heat">Biggest Games</Link>
          <Link href="/dogzone">Dog Zone <em className="plus">PLUS</em></Link>
          <Link href="/profile">Profile</Link>
        </div>
      )}
    </header>
  );
}
