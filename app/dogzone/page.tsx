import Link from "next/link";
export const metadata = { title: "Dog Zone — TapeDog Plus" };

const PERKS = [
  ["Early fade alerts", "Get pinged when a game crosses 50 on the tape — before the number moves."],
  ["Season trap tracker", "Every flagged fade, graded against the final score, all year."],
  ["Film-room archive", "Every AI scouting brief, searchable by team and spot."],
  ["Custom weights", "Tune the playbook. Care more about weather than rest? Your call."],
  ["Line-move history", "Open-to-kick charts across every book we track."],
  ["The kennel", "A members-only group chat for game-day talk."],
];

export default function DogZone() {
  return (
    <main className="wrap soon dz">
      <div className="eyebrow mono">TAPEDOG PLUS · COMING SOON</div>
      <h1 className="mega">The Dog <span className="c-tape">Zone.</span></h1>
      <p className="muted lead2">TapeDog stays free. Dog Zone is an optional paid tier with alerts, tracking and extra tools.</p>
      <div className="perks">
        {PERKS.map(([t, d], k) => (
          <div key={t} className="perk"><span className="mono num">{String(k + 1).padStart(2, "0")}</span><b>{t}</b><p>{d}</p></div>
        ))}
      </div>
      <div className="plan">
        <div><span className="mono muted">PLUS</span><b>Pricing TBA</b><small>Launching later this season</small></div>
        <button className="btn primary" disabled>Coming soon</button>
      </div>
      <Link href="/board" className="btn ghost">Back to the free board →</Link>
    </main>
  );
}
