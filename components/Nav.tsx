"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import Search from "./Search";

const LINKS = [
  { href: "/board", label: "Fade Board" },
  { href: "/board?tab=scores", label: "Scores" },
  { href: "/board?tab=heat", label: "Biggest Games" },
  { href: "/board?tab=saved", label: "Saved" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className={`nav ${path === "/" ? "nav-float" : ""}`}>
      <div className="wrap navin">
        <Link href="/" className="brand"><Logo /> <span>TAPEDOG</span></Link>
        <nav className="links">
          {LINKS.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
          <Link href="/dogzone" className={`dz ${path === "/dogzone" ? "on" : ""}`}>Dog Zone <em>PLUS</em></Link>
        </nav>
        <Search />
        <Link href="/profile" className="avatar" title="Profile">TA</Link>
      </div>
    </header>
  );
}
