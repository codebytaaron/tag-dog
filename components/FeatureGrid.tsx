import Link from "next/link";

const FEATURES: [string, string, string][] = [
  ["Fade Board", "/board", "Every game ranked by upset risk, with one-tap views like Upset watch and Must-watch."],
  ["Live scores", "/board?tab=scores", "Scores, down and distance and a weekly fade report, updating on their own."],
  ["Live odds", "/board", "Six sportsbooks plus Kalshi prices and a price chart on every game, refreshing every 30 seconds."],
  ["Rankings & odds", "/rankings", "AP and Coaches polls, standings, and live national title, playoff, Heisman and hot-seat odds."],
  ["Replay", "/replay", "Every result by week with highlights, recaps and play-by-play win odds."],
  ["Reels", "/reels", "Swipe through the latest highlights, one clip at a time, with the score and recap a tap away."],
  ["AI breakdown", "/board", "A short scouting report for any game, written only from TapeDog's data."],
  ["Team hubs", "/team/333", "Press ⌘K for any team: latest highlights, full schedule and this week's spot."],
  ["Your profile", "/profile", "Make picks, follow teams, earn badges and track your record."],
];

export default function FeatureGrid() {
  return (
    <div className="fgrid">
      {FEATURES.map(([t, href, d], k) => (
        <Link key={t} href={href} className="ftile">
          <span className="mono ftn">{String(k + 1).padStart(2, "0")}</span>
          <b>{t}</b>
          <p>{d}</p>
          <i>→</i>
        </Link>
      ))}
    </div>
  );
}
