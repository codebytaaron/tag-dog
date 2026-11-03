import Link from "next/link";
import EraseData from "@/components/EraseData";
import { CONTACT_EMAIL, CONTACT_FALLBACK } from "@/lib/site";

export const metadata = { title: "Privacy | TapeDog" };

export default function Privacy() {
  const contact = CONTACT_EMAIL ? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : <Link href={CONTACT_FALLBACK}>our team page</Link>;
  return (
    <main className="wrap legalpg">
      <div className="eyebrow mono">LAST UPDATED NOVEMBER 2026</div>
      <h1 className="big">Privacy</h1>

      <h2>The short version</h2>
      <p>TapeDog has no accounts, no sign-in, no email list and no advertising trackers. We don't collect your name, email or location, and we don't sell or share personal information.</p>

      <h2>What stays on your device</h2>
      <p>These are saved only in your browser's local storage and never sent to us:</p>
      <ul>
        <li>Profile name and favorite team, picks, saved games and followed teams</li>
        <li>Reels likes, which clips you've seen, the taste settings that personalize your feed, and your daily watch count</li>
        <li>Score Tracker game picks and delay setting</li>
        <li>Light or dark mode, sound and volume, and your last visit time</li>
      </ul>
      <p>You can erase all of it at any time:</p>
      <div className="erasebox"><EraseData /></div>

      <h2>Analytics</h2>
      <p>We use Vercel Web Analytics and Speed Insights to count page views and measure load speed. They don't use cookies, don't follow you across websites and don't identify you personally. TapeDog does not set any cookies.</p>

      <h2>Services your browser talks to directly</h2>
      <p>To keep the site fast, some content loads straight from other services, which can see your IP address under their own privacy policies:</p>
      <ul>
        <li>ESPN: live scores, team logos and highlight videos</li>
        <li>Bluesky: avatars of the reporters shown in The Buzz</li>
        <li>Sportsbooks, Kalshi and Polymarket: only if you click a link to them</li>
      </ul>
      <p>Fonts are hosted by TapeDog itself, not loaded from Google.</p>

      <h2>AI breakdowns</h2>
      <p>When an AI breakdown is generated, game data (never anything about you) is sent to Google's Gemini API to write it.</p>

      <h2>Your rights</h2>
      <p>Because we don't hold personal information on our servers, there is nothing for us to access, correct or delete about you: your data lives in your browser and the button above erases it. We do not sell or share personal information, as defined by California and other state privacy laws. Questions or requests: {contact}.</p>

      <h2>Kids</h2>
      <p>TapeDog is not directed at children under 13 and does not knowingly collect information from them. Betting-related content is meant for adults of legal age.</p>

      <h2>Changes</h2>
      <p>If this policy changes, we'll update the date at the top of this page.</p>
    </main>
  );
}
