import "./globals.css";
import type { ReactNode } from "react";
import { Suspense } from "react";
import Nav from "@/components/Nav";
import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "TapeDog — Find the favorites worth fading",
  description: "College football trap-game radar. Every FBS favorite, graded on schedule spots, line movement, markets and weather.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Suspense fallback={<div className="nav" style={{ height: 64 }} />}><Nav /></Suspense>
        {children}
        <footer className="foot">
          <div className="wrap footin">
            <div className="fbrand"><Logo size={22} /><b>TAPEDOG</b><span className="muted">Finds the college football favorites worth fading.</span></div>
            <nav className="flinks">
              <Link href="/board">Fade Board</Link><Link href="/board?tab=scores">Scores</Link><Link href="/board?tab=saved">Saved</Link><Link href="/about">About</Link><Link href="/dogzone">Dog Zone</Link>
            </nav>
            <Link href="/about#founder" className="builtby">Built by <b>Teddy A.</b> <span>→</span></Link>
          </div>
          <div className="wrap fnote">Data from ESPN, sportsbooks via Action Network, Kalshi and Open-Meteo. AI summaries by Gemini. For entertainment, not betting advice.</div>
        </footer>
      </body>
    </html>
  );
}
