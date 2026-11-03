export const metadata = { title: "Privacy | TapeDog" };

export default function Privacy() {
  return (
    <main className="wrap legalpg">
      <div className="eyebrow mono">LAST UPDATED NOVEMBER 2026</div>
      <h1 className="big">Privacy</h1>
      <h2>The short version</h2>
      <p>TapeDog has no accounts, no sign-in and no email list. We don't sell or share personal information.</p>
      <h2>What stays on your device</h2>
      <p>Your profile name and team, picks, saved games, followed teams, Dog Zone reminder and last-visit time are saved in your browser's local storage. They never leave your device and you can erase them anytime from your profile or by clearing site data.</p>
      <h2>Analytics</h2>
      <p>We use Vercel Web Analytics and Speed Insights to count page views and measure load speed. They don't use cookies and don't identify you personally.</p>
      <h2>Content from other services</h2>
      <p>Some things load directly from other services: team logos and highlight videos from ESPN, avatars from Bluesky, and links to sportsbooks and Kalshi. Those services may see your IP address when your browser loads their content, under their own privacy policies.</p>
      <h2>AI breakdowns</h2>
      <p>When you generate an AI breakdown, game data (not anything about you) is sent to Google's Gemini API to write it.</p>
      <h2>Kids</h2>
      <p>TapeDog is not directed at children under 13 and does not knowingly collect information from them.</p>
    </main>
  );
}
