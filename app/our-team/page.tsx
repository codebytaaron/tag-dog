import Link from "next/link";

export const metadata = { title: "Meet the team | TapeDog" };

const TEAM = [
  { slug: "teddy", name: "Teddy A.", role: "Founder & CEO", line: "Built TapeDog from the ground up. Has loved college football since he was a kid.", initials: "TA" },
  { slug: "parker", name: "Parker Tichio", role: "Head of Business Development", line: "Leads partnerships and business development. Joined TapeDog in November 2026.", initials: "PT" },
];

export default function OurTeam() {
  return (
    <main className="wrap teampg">
      <div className="eyebrow mono">OUR TEAM</div>
      <h1 className="big">Meet the team</h1>
      <p className="lead2 muted">The people building TapeDog.</p>
      <div className="teamgrid2">
        {TEAM.map((p) => (
          <Link key={p.slug} href={`/our-team/${p.slug}`} className="tcard">
            <span className="tav">{p.initials}</span>
            <div>
              <b>{p.name}</b>
              <span className="trole">{p.role}</span>
              <p>{p.line}</p>
            </div>
            <span className="textlink">Learn more</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
