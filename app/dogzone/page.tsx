import FeatureLine from "@/components/FeatureLine";
import Waitlist from "@/components/Waitlist";

export const metadata = { title: "Dog Zone | TapeDog Plus" };

const PERKS = [
  ["Fade alerts", "A ping the moment a game crosses 50."],
  ["Season tracker", "Every flagged fade, graded against the final."],
  ["Breakdown archive", "Every AI breakdown, searchable."],
  ["Custom red flags", "Weight the checks your way."],
  ["Line history", "Open-to-kickoff moves across every book."],
  ["Members chat", "Game-day talk with other members."],
];

export default function DogZone() {
  return (
    <main className="dzpage">
      <section className="wrap dzhero">
        <div className="eyebrow mono">TAPEDOG PLUS · COMING 2027</div>
        <h1 className="mega">The Dog <span className="c-tape">Zone.</span></h1>
        <p className="lead2 muted">TapeDog stays free. Dog Zone adds alerts, tracking and extra tools.</p>
      </section>

      <FeatureLine />

      <section className="wrap dzgrid">
        <div className="price">
          <span className="mono muted">DOG ZONE</span>
          <div className="amt"><b>$15</b><span>/month</span></div>
          <span className="mono small c-tape">EARLY ROLLOUT 2027</span>
          <Waitlist />
        </div>
        <div className="perks2">
          {PERKS.map(([t, d], k) => (
            <div key={t} className="perk2" style={{ animationDelay: `${k * 0.08}s` }}>
              
              <div><b>{t}</b><p>{d}</p></div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
