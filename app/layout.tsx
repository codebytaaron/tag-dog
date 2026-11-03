import "./globals.css";
import type { ReactNode } from "react";
import { Suspense } from "react";
import Nav from "@/components/Nav";
import Link from "next/link";
import Logo from "@/components/Logo";
import ScoreAlerts from "@/components/ScoreAlerts";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Anton, Inter_Tight, JetBrains_Mono } from "next/font/google";

// Fonts are downloaded at build time and served from our own domain, so visitors never contact Google.
const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Inter_Tight({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ weight: ["400", "600"], subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata = {
  metadataBase: new URL("https://tapedog.vercel.app"),
  title: { default: "TapeDog | Find the favorites worth fading", template: "%s" },
  description: "Upset odds for every FBS college football game, built from six sportsbooks, prediction markets, schedule spots and weather. Plus live scores, highlights, polls and playoff odds.",
  openGraph: {
    title: "TapeDog | Find the favorites worth fading",
    description: "Upset odds, live scores, highlights and playoff odds for every FBS game.",
    url: "https://tapedog.vercel.app", siteName: "TapeDog", type: "website",
  },
  twitter: { card: "summary_large_image", title: "TapeDog", description: "Find the college football favorites worth fading." },
};
export const viewport = { themeColor: "#0a0a09" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "(function(){try{var t=localStorage.getItem('tapedog.theme');if(!t)t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark'}})()" }} />
      </head>
      <body>
        <Suspense fallback={<div className="nav" style={{ height: 64 }} />}><Nav /></Suspense>
        <ScoreAlerts />
        {children}
        <footer className="foot">
          <div className="wrap footin">
            <div className="fbrand"><Logo size={22} /><b>TAPEDOG</b><span className="muted">Finds the college football favorites worth fading.</span></div>
            <nav className="flinks">
              <Link href="/board">Board</Link><Link href="/board?tab=scores">Scores</Link><Link href="/replay">Past results</Link><Link href="/reels">Reels</Link><Link href="/tracker">Tracker</Link><Link href="/rankings">Rankings</Link><Link href="/about">How it works</Link><Link href="/dogzone">Dog Zone</Link><Link href="/profile">Profile</Link><Link href="/our-team">Our team</Link>
            </nav>
            <Link href="/our-team" className="builtby">Meet the <b>team</b> <span>→</span></Link>
          </div>
          <div className="wrap fnote">
            <p>For entertainment and information only. Not betting advice. TapeDog is not affiliated with ESPN, the NCAA, any school or conference, any sportsbook, or Kalshi. Team names and logos belong to their owners and are used only to identify teams. Highlights are ESPN's and play from ESPN.</p>
            <p>21+ where sports betting is legal. Sportsbooks and prediction markets are not available in every state. If you or someone you know has a gambling problem, call 1-800-GAMBLER.</p>
            <p className="legal"><Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · © {new Date().getFullYear()} TapeDog</p>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
