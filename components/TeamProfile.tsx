import Link from "next/link";
import RootsFor from "@/components/RootsFor";
import DogAvatar from "@/components/DogAvatar";

export type FavGame = { tag: string; top?: boolean; title: string; when: string; note: string; a: string; b: string; url: string };
const logo = (id: string) => `https://a.espncdn.com/i/teamlogos/ncaa/500-dark/${id}.png`;

export default function TeamProfile({ role, name, initials, color, bio, teams, games, cta }: {
  role: string; name: string; initials: string; color: string; bio: string[]; teams: string[]; games: FavGame[]; cta?: React.ReactNode;
}) {
  const top = games.filter((g) => g.top), rest = games.filter((g) => !g.top);
  const card = (g: FavGame, big: boolean) => (
    <a key={g.title} href={g.url} target="_blank" rel="noreferrer" className={`pf-game ${big ? "big" : ""}`}>
      <span className="pf-logos"><img src={logo(g.a)} alt="" /><img src={logo(g.b)} alt="" /></span>
      <span className="pf-tag">{g.tag}</span>
      <b>{g.title}</b>
      <span className="pf-when">{g.when}</span>
      <span className="pf-note">{g.note}</span>
      <span className="pf-play">▶ Highlights</span>
    </a>
  );
  return (
    <main className="wrap pf">
      <Link href="/our-team" className="pf-back">← Meet the team</Link>
      <section className="pf-hero">
        <DogAvatar color={color} initials={initials} size={112} />
        <div>
          <span className="pf-role">{role}</span>
          <h1>{name}</h1>
          <RootsFor ids={teams} />
        </div>
      </section>
      <section className="pf-bio">{bio.map((p, i) => <p key={i} className={i ? "muted" : ""}>{p}</p>)}</section>
      <section>
        <h2 className="pf-h">Favorite games</h2>
        {top.length > 0 && <div className="pf-top">{top.map((g) => card(g, true))}</div>}
        <div className="pf-rest">{rest.map((g) => card(g, false))}</div>
      </section>
      <section className="pf-cta">{cta}</section>
    </main>
  );
}
