"use client";
import Link from "next/link";
import { usePicks, type Side } from "./SaveButton";
import { useLive } from "./useLive";

type T = { abbr: string; short: string; logo: string; color: string };

export default function PickBar({ id, date, state, fav, line, away, home }: { id: string; date: string; state: string; fav: Side; line: string; away: T; home: T }) {
  const { list, set, remove } = usePicks();
  const lv = useLive()[id];
  const mine = list.find((p) => p.id === id);
  const locked = (lv?.state ?? state) !== "pre" || Date.parse(date) < Date.now();

  const choose = (side: Side) => {
    if (locked) return;
    if (mine?.pick === side) { remove(id); return; }
    set({ id, date, pick: side, fav, line, madeAt: new Date().toISOString(),
      away: { abbr: away.abbr, short: away.short, logo: away.logo }, home: { abbr: home.abbr, short: home.short, logo: home.logo } });
  };
  const Btn = ({ side, t }: { side: Side; t: T }) => (
    <button className={`pbtn ${mine?.pick === side ? "on" : ""}`} style={{ ["--c" as any]: t.color }} onClick={() => choose(side)} disabled={locked}>
      {t.logo && <img src={t.logo} alt="" />}
      <span><b>{t.short} wins</b><small className="mono">{fav === side ? "FAVORITE" : "UNDERDOG"}</small></span>
    </button>
  );

  return (
    <section className="card pickbar">
      <div className="cardh"><h3>Make your call</h3><span className="mono muted">{locked ? "CALLS CLOSED" : "WHO WINS STRAIGHT UP?"}</span></div>
      <div className="pbtns"><Btn side="away" t={away} /><Btn side="home" t={home} /></div>
      <p className="muted small pnote">
        {mine ? <>Locked in on your <Link href="/profile" className="c-tape">profile</Link>. {!locked && "Tap again to undo."}</>
          : locked ? "This game has kicked off." : <>Your record is graded automatically on your <Link href="/profile" className="c-tape">profile</Link>.</>}
      </p>
    </section>
  );
}
