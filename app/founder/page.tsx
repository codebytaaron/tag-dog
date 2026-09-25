import Link from "next/link";

export const metadata = { title: "Founder | TapeDog" };

const logo = (id: string) => `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;

const GAMES = [
  { tag: "Favorite in-person game", top: true, title: "Texas 24, Ohio State 23", when: "2026 · Week 2 · Austin, TX", note: "The comeback. I was there.", a: "251", b: "194", url: "https://www.youtube.com/watch?v=Jv78FCb9KM8" },
  { tag: "Favorite TV game", top: true, title: "Ohio State 27, Penn State 26", when: "Sept. 29, 2018", note: "Penn State led 26–14 in the fourth. Ohio State scored the last 13.", a: "194", b: "213", url: "https://www.youtube.com/results?search_query=Ohio+State+Penn+State+2018+highlights+27-26" },
  { tag: "More favorites", title: "Alabama 41, Georgia 34", when: "2024", note: "Alabama led 28–0, Georgia took the lead late, Alabama answered right away.", a: "333", b: "61", url: "https://www.youtube.com/watch?v=q8xeg3bSw4U" },
  { tag: "More favorites", title: "Texas A&M 41, Notre Dame 40", when: "Sept. 13, 2025", note: "One-point game in South Bend. 9.7/10.", a: "245", b: "87", url: "https://www.youtube.com/watch?v=dSObucpzf8k" },
  { tag: "More favorites", title: "Indiana 27, Miami 21", when: "2026 CFP title game", note: "Miami had the ball late with a chance to win.", a: "84", b: "2390", url: "https://www.youtube.com/watch?v=cH4usFsdUKo" },
];

export default function Founder() {
  return (
    <main className="wrap founderpg">
      <section className="fhero">
        <div className="ghostTA" aria-hidden>TA</div>
        <div className="eyebrow mono">THE FOUNDER</div>
        <h1 className="mega">Teddy A.</h1>
        <p className="lead2">I've loved college football since I was a little kid. I've always cared more about the spot than the matchup: who's looking ahead, who just got punched in the mouth, who's traveling across the country for a noon kick.</p>
        <p className="lead2 muted">So I built TapeDog: the tool I wanted every Saturday.</p>
      </section>

      <section className="sect0">
        <div className="eyebrow mono">FAVORITE GAMES · TAP FOR HIGHLIGHTS</div>
        <div className="fglist">
          {GAMES.map((g) => (
            <a key={g.title} href={g.url} target="_blank" rel="noreferrer" className={`fg ${g.top ? "top" : ""}`}>
              <span className="fglogos"><img src={logo(g.a)} alt="" /><img src={logo(g.b)} alt="" /></span>
              <span className="fgtxt">
                <span className={`mono fgtag ${g.top ? "c-tape" : "muted"}`}>{g.tag.toUpperCase()}</span>
                <b>{g.title}</b>
                <span className="mono muted small">{g.when}</span>
                <span className="fgnote">{g.note}</span>
              </span>
              <span className="play mono">▶ HIGHLIGHTS</span>
            </a>
          ))}
        </div>
      </section>

      <section className="sect0 aboutcta">
        <Link href="/board" className="btn primary">Open the Fade Board →</Link>
        <Link href="/about" className="btn ghost">How TapeDog works</Link>
      </section>
    </main>
  );
}
