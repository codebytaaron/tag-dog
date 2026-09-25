import Link from "next/link";

export const metadata = { title: "Founder — TapeDog" };

const TV = [
  { title: "Ohio State 27, Penn State 26", when: "Sept. 29, 2018", note: "Penn State led 26–14 in the fourth. Ohio State scored the last 13.", fav: true },
  { title: "Alabama 41, Georgia 34", when: "2024", note: "Alabama led 28–0, Georgia took the lead late, Alabama answered right away." },
  { title: "Texas A&M 41, Notre Dame 40", when: "Sept. 13, 2025", note: "One-point game in South Bend. 9.7/10." },
  { title: "Indiana 27, Miami 21", when: "2026 CFP title game", note: "Miami had the ball late with a chance to win." },
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
        <div className="eyebrow mono">IN THE BUILDING</div>
        <div className="ticket">
          <div className="tmain">
            <span className="mono muted">ADMIT ONE · 2026 · AUSTIN, TX</span>
            <h2>Ohio State at Texas</h2>
            <p>The comeback. I was there.</p>
          </div>
          <div className="tstub mono"><span>SEC</span><b>2026</b><span>ROW —</span></div>
        </div>
      </section>

      <section className="sect0">
        <div className="eyebrow mono">ON TV</div>
        <div className="tvlist">
          {TV.map((g, k) => (
            <div key={g.title} className={`tvrow ${g.fav ? "top" : ""}`}>
              <span className="mono ch">CH {String(k + 1).padStart(2, "0")}</span>
              <div>
                <b>{g.title}</b> <span className="mono muted">· {g.when}</span>
                {g.fav && <em className="favbadge mono">ALL-TIME FAVORITE</em>}
                <p>{g.note}</p>
              </div>
            </div>
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
