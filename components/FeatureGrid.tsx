import Link from "next/link";

const FEATURES: [string, string, string][] = [
  ["Fade Board", "/board", "Every game ranked by upset risk, with one-tap views like Upset watch and Must-watch."],
  ["Live scores", "/board?tab=scores", "Scores, down and distance and a weekly fade report, updating on their own."],
  ["Live odds", "/board", "Six sportsbooks plus Kalshi prices and a price chart on every game, refreshing every 30 seconds."],
  ["Replay", "/replay", "Every result by week with highlights, recaps and play-by-play win odds."],
  ["The buzz", "/board", "What fans and media are saying about each game, filtered to football only."],
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
