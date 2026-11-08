import Link from "next/link";
import TeamProfile, { type FavGame } from "@/components/TeamProfile";

export const metadata = { title: "Parker T. | TapeDog" };

const yt = (t: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${t} highlights`)}`;
const GAMES: FavGame[] = ([
            { tag: "All-time favorite", top: true, title: "Michigan 27, Alabama 20 (OT)", when: "Rose Bowl, CFP semifinal · Jan 1, 2024", note: "Overtime in Pasadena with a title game on the line.", a: "130", b: "333", url: "" },
            { tag: "More favorites", title: "Oklahoma 27, Texas 24", when: "Red River Rivalry · Oct 10, 2026", note: "A three-point win over Texas at the Cotton Bowl.", a: "201", b: "251", url: "" },
            { tag: "More favorites", title: "Alabama 41, Georgia 34", when: "2024", note: "Alabama led 28-0, Georgia came all the way back, Alabama answered.", a: "333", b: "61", url: "" },
            { tag: "More favorites", title: "Miami 31, Ole Miss 27", when: "Fiesta Bowl, CFP semifinal · Jan 9, 2026", note: "A four-point playoff semifinal.", a: "2390", b: "145", url: "" },
            { tag: "More favorites", title: "Indiana 27, Miami 21", when: "CFP national championship · Jan 2026", note: "Miami had the ball late with a chance to win.", a: "84", b: "2390", url: "" },
          ] as FavGame[]).map((g) => ({ ...g, url: yt(g.title) }));

export default function Parker() {
  return (
    <TeamProfile role="Head of Business Development" name="Parker T." initials="PT" color="#841617" teams={["201"]} games={GAMES}
      bio={[
        "Parker leads business development at TapeDog, from partnerships to growth. He studies economics at Dartmouth College (Class of 2030) and is focused on finance, valuation and how businesses scale.",
        "He joined TapeDog in November 2026.",
      ]}
      cta={<Link href="/our-team" className="btn ghost">Back to the team</Link>} />
  );
}
