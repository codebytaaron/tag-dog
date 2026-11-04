import Link from "next/link";
import RootsFor from "@/components/RootsFor";

export const metadata = { title: "Parker Tichio | TapeDog" };

const BACKGROUND = [
  { org: "Tangle News", role: "Student intern", note: "Audience growth and engagement strategy for student-facing work." },
  { org: "Scholar Saver", role: "Business strategy & development intern", note: "Built financial forecasts and growth analysis for a venture-backed fintech startup." },
  { org: "RoundUp4Good", role: "Founder", note: "Nonprofit platform connecting extra food with food-insecure students." },
];

export default function Parker() {
  return (
    <main className="wrap founderpg">
      <section className="fhero">
        <div className="ghostTA" aria-hidden>PT</div>
        <Link href="/our-team" className="back mono">← MEET THE TEAM</Link>
        <div className="eyebrow mono">HEAD OF BUSINESS DEVELOPMENT</div>
        <h1 className="mega">Parker Tichio</h1>
        <p className="lead2">Parker leads business development at TapeDog, from partnerships to growth. He studies economics at Dartmouth College (Class of 2030) and is focused on finance, valuation and how businesses scale.</p>
        <p className="lead2 muted">He joined TapeDog in November 2026.</p>
        <RootsFor ids={["201"]} />
      </section>

      <section className="sect0">
        <div className="eyebrow mono">BACKGROUND</div>
        <div className="bglist">
          {BACKGROUND.map((b) => (
            <div key={b.org} className="bgrow"><b>{b.org}</b><span className="muted">{b.role}</span><p>{b.note}</p></div>
          ))}
        </div>
      </section>

      <section className="sect0">
        <div className="eyebrow mono">FAVORITE GAMES · TAP FOR HIGHLIGHTS</div>
        <div className="fglist">
          {[
            { tag: "All-time favorite", top: true, title: "Michigan 27, Alabama 20 (OT)", when: "Rose Bowl, CFP semifinal · Jan 1, 2024", note: "Overtime in Pasadena with a title game on the line.", a: "130", b: "333" },
            { tag: "More favorites", title: "Oklahoma 27, Texas 24", when: "Red River Rivalry · Oct 10, 2026", note: "A three-point win over Texas at the Cotton Bowl.", a: "201", b: "251" },
            { tag: "More favorites", title: "Alabama 41, Georgia 34", when: "2024", note: "Alabama led 28-0, Georgia came all the way back, Alabama answered.", a: "333", b: "61" },
            { tag: "More favorites", title: "Miami 31, Ole Miss 27", when: "Fiesta Bowl, CFP semifinal · Jan 9, 2026", note: "A four-point playoff semifinal.", a: "2390", b: "145" },
            { tag: "More favorites", title: "Indiana 27, Miami 21", when: "CFP national championship · Jan 2026", note: "Miami had the ball late with a chance to win.", a: "84", b: "2390" },
          ].map((g) => (
            <a key={g.title} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${g.title} highlights`)}`} target="_blank" rel="noreferrer" className={`fg ${g.top ? "top" : ""}`}>
              <span className="fglogos"><img src={`https://a.espncdn.com/i/teamlogos/ncaa/500-dark/${g.a}.png`} alt="" /><img src={`https://a.espncdn.com/i/teamlogos/ncaa/500-dark/${g.b}.png`} alt="" /></span>
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
        <a href="https://www.linkedin.com/in/parker-tichio-27b9b2297/" target="_blank" rel="noopener noreferrer" className="btn ghost">LinkedIn ↗</a>
        <Link href="/our-team" className="btn ghost">Back to the team</Link>
      </section>
    </main>
  );
}
