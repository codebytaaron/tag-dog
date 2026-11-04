import Link from "next/link";
import { CONTACT_EMAIL, CONTACT_FALLBACK } from "@/lib/site";

export const metadata = { title: "Terms | TapeDog" };

export default function Terms() {
  const contact = CONTACT_EMAIL ? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : <Link href={CONTACT_FALLBACK}>our team page</Link>;
  return (
    <main className="wrap legalpg">
      <div className="eyebrow mono">LAST UPDATED NOVEMBER 2026</div>
      <h1 className="btitle">Terms of use</h1>
      <p>By using TapeDog you agree to these terms. If you don't agree, please don't use the site.</p>

      <h2>What TapeDog is</h2>
      <p>TapeDog is a free college football website for entertainment and information. Scores, odds, ratings, rankings, weather, posts and other data come from third parties and may be delayed, incomplete or wrong. Tape Scores, upset chances and Watch scores are our own estimates, not predictions or guarantees.</p>

      <h2>Not betting advice</h2>
      <p>Nothing on TapeDog is betting, financial or legal advice. TapeDog does not take bets, is not a sportsbook or prediction market, and is not paid for links to them. Sportsbooks and prediction markets are not legal or available everywhere; if you choose to use them, you are responsible for being of legal age and following the laws where you live. If gambling stops being fun, call 1-800-GAMBLER.</p>

      <h2>Live scores and the Score Tracker</h2>
      <p>Live information can lag, pause or be corrected after the fact. The delay setting is a convenience and may not match your broadcast exactly. Don't rely on TapeDog for anything time-sensitive.</p>

      <h2>Markets about people</h2>
      <p>Odds about coaches, players and awards (for example the Hot seat and Heisman tabs) are prices from prediction markets. They are not reporting, rumors or statements of fact about anyone.</p>

      <h2>AI breakdowns</h2>
      <p>AI breakdowns are generated automatically from the data on each game page and can contain mistakes. Treat them as commentary.</p>

      <h2>Third-party content</h2>
      <p>Team names, logos, highlight videos and news belong to their owners. Videos play from ESPN and link back to it. Posts in The Buzz belong to their authors and link back to them. TapeDog is not affiliated with or endorsed by ESPN, the NCAA, any school or conference, any sportsbook, Kalshi, Polymarket, Bluesky or Google. If you own content shown here and want it removed or credited differently, contact us at {contact} and we will act promptly.</p>

      <h2>Sharing</h2>
      <p>You're welcome to share links to TapeDog pages and Reels. Please don't copy or redistribute the underlying videos or logos.</p>

      <h2>Your data and picks</h2>
      <p>Profiles, picks, saved games, followed teams and Reels history are stored only in your browser. Clearing your browser data, or using the erase button on the Privacy page, removes them. Picks are for fun and have no cash value.</p>

      <h2>The iPhone app</h2>
      <p>These terms cover the TapeDog iPhone app too. The app is free, is for entertainment and information only, and is rated 17+ because it shows betting lines and prediction-market prices. Picks, streaks and badges are just for fun: there is no money, prize or wager involved, and nothing in the app can be used to place a bet. Alerts and Lock Screen scores can be delayed or wrong; don't rely on them for anything important. Your use of the app is also subject to Apple's App Store terms.</p>

      <h2>Acceptable use</h2>
      <p>Don't overload, scrape at scale, attack or try to break the site, or use it for anything unlawful.</p>

      <h2>No warranty and limits on liability</h2>
      <p>TapeDog is provided as is and as available, without warranties of any kind. To the fullest extent allowed by law, TapeDog and its team are not liable for any loss arising from use of the site, including any wagering decisions.</p>

      <h2>Changes</h2>
      <p>We may update these terms as the site changes. The date at the top shows the latest version, and continuing to use TapeDog means you accept it.</p>
    </main>
  );
}
