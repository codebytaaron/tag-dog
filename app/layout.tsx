import "./globals.css";
import type { ReactNode } from "react";
import Nav from "@/components/Nav";

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
        <Nav />
        {children}
        <footer className="foot">
          <div className="wrap footin">
            <span className="mono">TAPEDOG · EST. 2026 · BUILT BY TA</span>
            <span className="muted">Data: ESPN · Action Network · Kalshi · Open-Meteo · AI: Gemini. Not betting advice. Just tape.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
