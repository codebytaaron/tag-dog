import Link from "next/link";
import { getEdge } from "@/lib/edge";
import EdgeStat from "@/components/EdgeStat";
import AppNotify from "@/components/AppNotify";

export const revalidate = 1800;
export const maxDuration = 60;
export const metadata = {
  title: "TapeDog for iPhone",
  description: "Live scores, upset alerts, Lock Screen scoreboards and a daily AI brief for every FBS game. TapeDog for iPhone.",
};

const SHOTS = [
  { src: "/app/home.jpg", cap: "Your teams, ranked by what matters right now" },
  { src: "/app/game.jpg", cap: "Every game: why the favorite is flagged" },
  { src: "/app/scores.jpg", cap: "Every FBS score, live" },
  { src: "/app/record.jpg", cap: "Our record, out in the open" },
  { src: "/app/you.jpg", cap: "Picks, streaks and badges" },
  { src: "/app/onboard.jpg", cap: "Set up in under a minute" },
];

const FEATURES = [
  ["Live on your Lock Screen", "Scores, possession and win chance on your Lock Screen and in the Dynamic Island. In the car too, on CarPlay."],
  ["Alerts that matter", "Top 25 upset alerts, one-score 4th quarters, overtime and final drives. Plus every score for your teams."],
  ["The Tape Room", "A 60-second read every morning: the shakiest favorite, why, and your team's game. Written on your phone by Apple Intelligence."],
  ["Three views, one screen", "Sportsbooks, the Kalshi market and our model side by side, with a timeline of why the line moved."],
  ["Call it. Prove it.", "Swipe through Quick Picks, build a streak, unlock badges and share the card when you nail an upset."],
  ["Hate-follow your rival", "Pick a rival and get a ping every time they lose. You're welcome."],
];

const STEPS = [
  ["Pick your teams", "Follow as many as you want. Their games go to the top of everything."],
  ["Check the board", "Games are ranked by how shaky the favorite is. Tap any game for the why."],
  ["Make your calls", "Quick Picks takes a minute. We grade them after the final."],
  ["Let it ping you", "Turn on alerts and put your game on the Lock Screen. You'll never miss the upset."],
];

export default async function AppPage() {
  const edge = await getEdge();
  return (
    <main className="apppage">
      <section className="wrap ap-hero">
        <div className="ap-copy">
          <div className="eyebrow mono">TAPEDOG FOR IPHONE · COMING SOON</div>
          <h1 className="ap-title">Every upset.<br /><span className="c-tape">In your pocket.</span></h1>
          <p className="ap-lede">Live scores, upset alerts and your team's whole season, in one app built to find the favorites worth fading.</p>
          <div className="ap-ctas"><AppNotify big /><Link href="/board" className="btn ghost">Use the web version</Link></div>
          <p className="muted small">Free. No account needed. Your profile and picks stay on your phone.</p>
        </div>
        <div className="ap-phones" aria-hidden>
          <img src="/app/home.jpg" alt="" className="ap-ph p1" />
          <img src="/app/game.jpg" alt="" className="ap-ph p2" />
        </div>
      </section>

      <section className="wrap ap-shots">
        <div className="ap-strip">
          {SHOTS.map((s) => (
            <figure key={s.src}><img src={s.src} alt={s.cap} loading="lazy" /><figcaption>{s.cap}</figcaption></figure>
          ))}
        </div>
      </section>

      {edge && <section className="wrap ap-edge"><EdgeStat e={edge} /></section>}

      <section className="wrap ap-quote">
        <blockquote>
          <p>“The best way to keep track of every aspect of your favorite team. I've tried many apps. This one let me delete every other app.”</p>
          <cite>Beta tester</cite>
        </blockquote>
      </section>

      <section className="wrap ap-feats">
        <h2 className="h2">Built for game day</h2>
        <div className="ap-grid">
          {FEATURES.map(([t, d]) => <div key={t} className="ap-feat"><b>{t}</b><p className="muted">{d}</p></div>)}
        </div>
      </section>

      <section className="wrap ap-how">
        <h2 className="h2">How to use it</h2>
        <ol className="ap-steps">
          {STEPS.map(([t, d], i) => <li key={t}><span className="mono">{String(i + 1).padStart(2, "0")}</span><div><b>{t}</b><p className="muted">{d}</p></div></li>)}
        </ol>
      </section>

      <section className="wrap ap-final">
        <h2 className="h2">Be first in line.</h2>
        <AppNotify big />
        <p className="muted small">For entertainment only. TapeDog doesn't take bets. 17+. Gambling problem? Call 1-800-GAMBLER. <Link href="/privacy" className="textlink">Privacy</Link> <Link href="/terms" className="textlink">Terms</Link></p>
      </section>

      <div className="ap-sticky"><AppNotify /></div>
    </main>
  );
}
