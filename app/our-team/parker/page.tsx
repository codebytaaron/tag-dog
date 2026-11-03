import Link from "next/link";

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
        <div className="eyebrow mono">HEAD OF STRATEGY & GROWTH</div>
        <h1 className="mega">Parker Tichio</h1>
        <p className="lead2">Parker leads strategy and growth at TapeDog. He studies economics at Dartmouth College (Class of 2030) and is focused on finance, valuation and how businesses scale.</p>
        <p className="lead2 muted">He joined TapeDog in November 2026.</p>
      </section>

      <section className="sect0">
        <div className="eyebrow mono">BACKGROUND</div>
        <div className="bglist">
          {BACKGROUND.map((b) => (
            <div key={b.org} className="bgrow"><b>{b.org}</b><span className="muted">{b.role}</span><p>{b.note}</p></div>
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
