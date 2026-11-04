import "./globals.css";
import type { ReactNode } from "react";
import { Suspense } from "react";
import Nav from "@/components/Nav";
import Link from "next/link";
import Logo from "@/components/Logo";
import ScoreAlerts from "@/components/ScoreAlerts";
import AppBanner from "@/components/AppBanner";
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
  description: "See which college football favorites are most likely to lose this week, with live scores, highlights, rankings and playoff odds.",
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
        <AppBanner />
        <ScoreAlerts />
        {children}
        <footer className="foot">
          <div className="wrap fcols">
            <div className="fbrand2">
              <span className="fb-logo"><Logo size={24} /><b>TAPEDOG</b></span>
              <p className="muted">See which college football favorites are most likely to lose, and follow every game live.</p>
            </div>
            <div className="fcol"><b>Games</b><Link href="/board">Fade Board</Link><Link href="/board?tab=scores">Live scores</Link><Link href="/tracker">Score Tracker</Link><Link href="/reels">Reels</Link></div>
            <div className="fcol"><b>Season</b><Link href="/rankings">Rankings & odds</Link><Link href="/playoff">Playoff bracket</Link><Link href="/record">Track record</Link><Link href="/replay">Past results</Link></div>
            <div className="fcol"><b>TapeDog</b><Link href="/about">How it works</Link><Link href="/our-team">Our team</Link><Link href="/app">iPhone app</Link><Link href="/dogzone">Dog Zone</Link><Link href="/profile">Your profile</Link></div>
          </div>
          <div className="wrap fnote">
            <p>For entertainment and information only. Not betting advice. Not affiliated with ESPN, the NCAA, any school, conference, sportsbook or Kalshi. Team names and logos belong to their owners. Highlights play from ESPN.</p>
            <p>21+ where sports betting is legal, and not available in every state. Gambling problem? Call 1-800-GAMBLER.</p>
            <p className="legal"><Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · © {new Date().getFullYear()} TapeDog</p>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
