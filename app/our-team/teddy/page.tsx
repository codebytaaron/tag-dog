import Link from "next/link";
import TeamProfile, { type FavGame } from "@/components/TeamProfile";

export const metadata = { title: "Teddy A. | TapeDog" };

const GAMES: FavGame[] = [
  { tag: "Favorite in-person game", top: true, title: "Texas 24, Ohio State 23", when: "2026 · Week 2 · Austin, TX", note: "The comeback. I was there.", a: "251", b: "194", url: "https://www.youtube.com/watch?v=Jv78FCb9KM8" },
  { tag: "Favorite TV game", top: true, title: "Ohio State 27, Penn State 26", when: "Sept. 29, 2018", note: "Penn State led 26–14 in the fourth. Ohio State scored the last 13.", a: "194", b: "213", url: "https://www.youtube.com/results?search_query=Ohio+State+Penn+State+2018+highlights+27-26" },
  { tag: "More favorites", title: "Alabama 41, Georgia 34", when: "2024", note: "Alabama led 28–0, Georgia took the lead late, Alabama answered right away.", a: "333", b: "61", url: "https://www.youtube.com/watch?v=q8xeg3bSw4U" },
  { tag: "More favorites", title: "Texas A&M 41, Notre Dame 40", when: "Sept. 13, 2025", note: "One-point game in South Bend. 9.7/10.", a: "245", b: "87", url: "https://www.youtube.com/watch?v=dSObucpzf8k" },
  { tag: "More favorites", title: "Indiana 27, Miami 21", when: "2026 CFP title game", note: "Miami had the ball late with a chance to win.", a: "84", b: "2390", url: "https://www.youtube.com/watch?v=cH4usFsdUKo" },
];

export default function Founder() {
  return (
    <TeamProfile role="Founder & CEO" name="Teddy A." initials="TA" color="#bf5700" teams={["251", "87", "349"]} games={GAMES}
      bio={[
        "Builder and lifelong college football fan who has built products used by thousands of people while still in high school. I've loved college football since I was a little kid. I've always cared more about the spot than the matchup: who's looking ahead, who just got punched in the mouth, who's traveling across the country for a noon kick.",
        "So I built TapeDog: the tool I wanted every Saturday.",
      ]}
      cta={<><Link href="/board" className="btn primary">Open the Fade Board →</Link><Link href="/about" className="btn ghost">How TapeDog works</Link></>} />
  );
}
