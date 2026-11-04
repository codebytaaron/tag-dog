import Link from "next/link";

const TEAMS: Record<string, string> = { "251": "Texas", "87": "Notre Dame", "349": "Army", "201": "Oklahoma" };

// "Roots for" row: team logos that link to each team's TapeDog page.
export default function RootsFor({ ids, link = true }: { ids: string[]; link?: boolean }) {
  return (
    <div className="roots">
      <span>Roots for</span>
      {ids.map((id) => {
        const inner = <><img src={`https://a.espncdn.com/i/teamlogos/ncaa/500-dark/${id}.png`} alt="" />{TEAMS[id]}</>;
        return link ? <Link key={id} href={`/team/${id}`} className="root">{inner}</Link> : <span key={id} className="root">{inner}</span>;
      })}
    </div>
  );
}
