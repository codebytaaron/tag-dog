import Link from "next/link";
import RootsFor from "@/components/RootsFor";
import DogAvatar from "@/components/DogAvatar";

export const metadata = { title: "Meet the team | TapeDog" };

const TEAM = [
  { slug: "teddy", name: "Teddy A.", role: "Founder & CEO", initials: "TA", color: "#bf5700", note: "Building TapeDog since 2026", teams: ["251", "87", "349"],
    bio: "Builder and lifelong college football fan. Has built products used by thousands of people while still in high school." },
  { slug: "parker", name: "Parker T.", role: "Head of Business Development", initials: "PT", color: "#841617", note: "Dartmouth College ’30", teams: ["201"],
    bio: "Leads partnerships and business development. Joined TapeDog in November 2026." },
];

export default function OurTeam() {
  return (
    <main className="wrap teampg">
      <div className="eyebrow mono">OUR TEAM</div>
      <h1 className="btitle">Meet the team</h1>
      <p className="lead2 muted">The two people building TapeDog.</p>
      <div className="tm-grid">
        {TEAM.map((p) => (
          <Link key={p.slug} href={`/our-team/${p.slug}`} className="tm-card">
            <div className="tm-top">
              <DogAvatar initials={p.initials} color={p.color} size={56} />
              <div><div className="tm-name">{p.name}</div><div className="tm-role">{p.role}</div></div>
            </div>
            <p className="tm-bio">{p.bio}</p>
            <div className="tm-foot"><RootsFor ids={p.teams} link={false} /><span className="tm-more">Learn more ›</span></div>
          </Link>
        ))}
      </div>
    </main>
  );
}
