import Link from "next/link";
import { getFutures } from "@/lib/pulse";

export const revalidate = 900;
export const maxDuration = 60;
export const metadata = { title: "Playoff bracket | TapeDog" };

type Row = { id: string; name: string; logo: string; make: number; qf: number | null; sf: number | null; fin: number | null; win: number | null };
const pc = (x: number | null) => (x == null ? "–" : x >= 0.995 ? ">99%" : x < 0.01 ? "<1%" : `${Math.round(x * 100)}%`);

export default async function PlayoffPage() {
  const f = await getFutures();
  const get = (s: any, id: string) => s?.markets?.find((m: any) => m.team?.id === id)?.p ?? null;
  const rows: Row[] = (f.playoff?.markets || []).filter((m) => m.team).map((m) => ({
    id: m.team!.id, name: m.label, logo: m.team!.logo, make: m.p, qf: get(f.qf, m.team!.id), sf: get(f.sf, m.team!.id), fin: get(f.final, m.team!.id), win: get(f.title, m.team!.id),
  }));
  const table = [...rows].sort((a, b) => (b.win ?? 0) - (a.win ?? 0) || b.make - a.make).slice(0, 25);
  // Projected field: the 12 likeliest to make it, seeded by how the market rates them to win it all.
  const field = [...rows].sort((a, b) => b.make - a.make).slice(0, 12).sort((a, b) => (b.win ?? 0) - (a.win ?? 0) || b.make - a.make);
  const seed = (i: number) => ({ ...field[i - 1], seed: i });
  const by = (k: keyof Row) => (x: any, y: any) => ((x[k] ?? 0) >= (y[k] ?? 0) ? x : y);
  const fr = [[8, 9], [5, 12], [7, 10], [6, 11]].map(([a, b]) => [seed(a), seed(b)]);
  const frW = fr.map(([a, b]) => by("qf")(a, b));
  const qf = [[seed(1), frW[0]], [seed(4), frW[1]], [seed(2), frW[2]], [seed(3), frW[3]]];
  const qfW = qf.map(([a, b]) => by("sf")(a, b));
  const sf = [[qfW[0], qfW[1]], [qfW[2], qfW[3]]];
  const sfW = sf.map(([a, b]) => by("fin")(a, b));
  const champ = by("win")(sfW[0], sfW[1]);
  const Slot = ({ t, k, win }: { t: any; k: keyof Row; win?: boolean }) => !t?.id ? <div className="pb-slot muted">TBD</div> : (
    <Link href={`/team/${t.id}`} className={`pb-slot ${win ? "w" : ""}`}><em>{t.seed}</em>{t.logo && <img src={t.logo} alt="" />}<span>{t.name}</span><b>{pc(t[k])}</b></Link>
  );
  const Game = ({ a, b, k, w }: { a: any; b: any; k: keyof Row; w: any }) => (
    <div className="pb-game"><Slot t={a} k={k} win={w?.id === a?.id} /><Slot t={b} k={k} win={w?.id === b?.id} /></div>
  );

  return (
    <main className="wrap board">
      <div className="eyebrow mono">COLLEGE FOOTBALL PLAYOFF</div>
      <h1 className="btitle">Playoff bracket</h1>
      <p className="muted">A projected 12-team field and every team's chances, round by round, from live prediction-market prices. Not the official seeding.</p>

      {field.length === 12 ? (
        <div className="pb">
          <div className="pb-col"><h3>First round</h3>{fr.map(([a, b], i) => <Game key={i} a={a} b={b} k="qf" w={frW[i]} />)}</div>
          <div className="pb-col"><h3>Quarterfinals</h3>{qf.map(([a, b], i) => <Game key={i} a={a} b={b} k="sf" w={qfW[i]} />)}</div>
          <div className="pb-col"><h3>Semifinals</h3>{sf.map(([a, b], i) => <Game key={i} a={a} b={b} k="fin" w={sfW[i]} />)}</div>
          <div className="pb-col"><h3>Final</h3><Game a={sfW[0]} b={sfW[1]} k="win" w={champ} />
            <div className="pb-champ"><span>Projected champion</span>{champ?.logo && <img src={champ.logo} alt="" />}<b>{champ?.name}</b><small>{pc(champ?.win)} to win it all</small></div>
          </div>
        </div>
      ) : <p className="muted">Playoff markets aren't open right now.</p>}
      <p className="muted small srcnote">Percentages in each round are the chance to reach the next round. Seeds 1 to 4 get first-round byes.</p>

      <section className="card pb-table">
        <div className="cardh"><h3>Round-by-round odds</h3></div>
        <div className="pbt-row pbt-head"><span>Team</span><span>Make CFP</span><span>Quarters</span><span>Semis</span><span>Final</span><span>Title</span></div>
        {table.map((r) => (
          <Link key={r.id} href={`/team/${r.id}`} className="pbt-row">
            <span className="pbt-team">{r.logo && <img src={r.logo} alt="" />}{r.name}</span>
            <span>{pc(r.make)}</span><span>{pc(r.qf)}</span><span>{pc(r.sf)}</span><span>{pc(r.fin)}</span><b>{pc(r.win)}</b>
          </Link>
        ))}
        <p className="muted small srcnote">Source: Kalshi prediction markets, updated through the day.</p>
      </section>
    </main>
  );
}
