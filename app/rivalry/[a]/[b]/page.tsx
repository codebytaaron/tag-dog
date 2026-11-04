import Link from "next/link";
import { notFound } from "next/navigation";
import { getH2H } from "@/lib/h2h";

export const revalidate = 21600;
export const maxDuration = 60;

export async function generateMetadata({ params }: { params: Promise<{ a: string; b: string }> }) {
  const { a, b } = await params;
  const { A, B } = await getH2H(a, b);
  return { title: A && B ? `${A.short} vs ${B.short}: head-to-head | TapeDog` : "Head-to-head | TapeDog" };
}

export default async function Rivalry({ params }: { params: Promise<{ a: string; b: string }> }) {
  const { a, b } = await params;
  if (!/^\d+$/.test(a) || !/^\d+$/.test(b) || a === b) notFound();
  const { A, B, meets } = await getH2H(a, b);
  if (!A || !B) notFound();
  const aw = meets.filter((m) => m.aScore > m.bScore).length, bw = meets.filter((m) => m.bScore > m.aScore).length, ties = meets.length - aw - bw;
  let streak = 0; const leader = meets[0] ? (meets[0].aScore > meets[0].bScore ? "a" : meets[0].bScore > meets[0].aScore ? "b" : null) : null;
  for (const m of meets) { const w = m.aScore > m.bScore ? "a" : m.bScore > m.aScore ? "b" : null; if (w && w === leader) streak++; else break; }
  const margin = (m: (typeof meets)[0]) => Math.abs(m.aScore - m.bScore);
  const closest = [...meets].sort((x, y) => margin(x) - margin(y)).slice(0, 3);
  const bigA = [...meets].filter((m) => m.aScore > m.bScore).sort((x, y) => margin(y) - margin(x))[0];
  const bigB = [...meets].filter((m) => m.bScore > m.aScore).sort((x, y) => margin(y) - margin(x))[0];
  const avg = meets.length ? Math.round(meets.reduce((s, m) => s + m.aScore + m.bScore, 0) / meets.length) : 0;
  const Score = ({ m }: { m: (typeof meets)[0] }) => (
    <span className="h2-sc"><b className={m.aScore > m.bScore ? "" : "dim"}>{A.abbr} {m.aScore}</b><span>,</span><b className={m.bScore > m.aScore ? "" : "dim"}>{B.abbr} {m.bScore}</b></span>
  );

  return (
    <main className="wrap board">
      <div className="eyebrow mono">HEAD-TO-HEAD</div>
      <div className="h2-hero">
        <Link href={`/team/${A.id}`} className="h2-t"><img src={A.logo} alt="" /><b>{A.short}</b><span className="h2-w">{aw}</span></Link>
        <div className="h2-mid"><span>All-time since 2004</span><b>{aw}-{bw}{ties ? `-${ties}` : ""}</b><small>{meets.length} meetings</small></div>
        <Link href={`/team/${B.id}`} className="h2-t r"><img src={B.logo} alt="" /><b>{B.short}</b><span className="h2-w">{bw}</span></Link>
      </div>

      {meets.length === 0 ? (
        <div className="empty">These teams haven't played each other since 2004.</div>
      ) : (
        <>
          <div className="h2-facts">
            <div><span>Last meeting</span><b>{meets[0].season}</b><Score m={meets[0]} /></div>
            <div><span>Current streak</span><b>{leader ? `${leader === "a" ? A.short : B.short} ${streak}` : "Tied last game"}</b><small>{streak > 1 ? "in a row" : streak === 1 ? "straight" : ""}</small></div>
            <div><span>Average total points</span><b>{avg}</b><small>per game</small></div>
            {bigA && <div><span>Biggest {A.short} win</span><b>{margin(bigA)} pts</b><small>{bigA.season}</small></div>}
            {bigB && <div><span>Biggest {B.short} win</span><b>{margin(bigB)} pts</b><small>{bigB.season}</small></div>}
          </div>

          <section className="card">
            <div className="cardh"><h3>Closest games</h3></div>
            <div className="h2-list">{closest.map((m) => (
              <Link key={m.id} href={`/game/${m.id}`} className="h2-row"><span className="h2-yr">{m.season}</span><Score m={m} /><span className="muted">{m.note || (m.post ? "Postseason" : m.neutral ? "Neutral site" : m.aHome ? `at ${A.short}` : `at ${B.short}`)}</span><span className="h2-go">Recap ›</span></Link>
            ))}</div>
          </section>

          <section className="card" style={{ marginTop: 16 }}>
            <div className="cardh"><h3>Every meeting</h3></div>
            <div className="h2-list">{meets.map((m) => (
              <Link key={m.id} href={`/game/${m.id}`} className="h2-row"><span className="h2-yr">{m.season}</span><Score m={m} /><span className="muted">{m.note || (m.post ? "Postseason" : m.neutral ? "Neutral site" : m.aHome ? `at ${A.short}` : `at ${B.short}`)}</span><span className="h2-go">Recap ›</span></Link>
            ))}</div>
          </section>
        </>
      )}
      <p className="muted small srcnote">Results from ESPN, 2004 to today. Tap any game for its recap.</p>
    </main>
  );
}
