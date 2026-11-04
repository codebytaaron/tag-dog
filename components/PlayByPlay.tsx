"use client";
import { useEffect, useState } from "react";

// Drive chart and play-by-play, read straight from ESPN in the browser. Refreshes every 20 seconds during a game.
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";
type Play = { id: string; text: string; clock: string; period: number; down: string; scoring: boolean; away: number; home: number };
type Drive = { id: string; abbr: string; logo: string; result: string; desc: string; start: number; end: number; startText: string; period: number; clock: string; isScore: boolean; plays: Play[] };
const q = (n: number) => (n > 4 ? "OT" : `Q${n}`);

function parse(d: any): Drive[] {
  const list = [...(d?.drives?.previous || []), ...(d?.drives?.current ? [d.drives.current] : [])];
  const seen = new Set<string>();
  return list.filter((dr: any) => { if (seen.has(dr.id)) return false; seen.add(dr.id); return true; }).map((dr: any) => ({
    id: String(dr.id), abbr: dr.team?.abbreviation || "", logo: dr.team?.logos?.[0]?.href || dr.team?.logo || "",
    result: dr.displayResult || dr.result || "", desc: dr.description || "",
    start: 100 - (dr.start?.yardLine ?? 75), end: 100 - (dr.end?.yardLine ?? dr.start?.yardLine ?? 75), startText: dr.start?.text || "",
    period: dr.start?.period?.number || 0, clock: dr.start?.clock?.displayValue || "", isScore: !!dr.isScore,
    plays: (dr.plays || []).map((p: any) => ({
      id: String(p.id), text: p.text || "", clock: p.clock?.displayValue || "", period: p.period?.number || 0,
      down: p.start?.downDistanceText || "", scoring: !!p.scoringPlay, away: p.awayScore, home: p.homeScore,
    })),
  }));
}

export default function PlayByPlay({ id, live }: { id: string; live: boolean }) {
  const [drives, setDrives] = useState<Drive[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    let t: any;
    const load = async () => {
      try { const r = await fetch(`${ESPN}/summary?event=${id}`); if (r.ok) setDrives(parse(await r.json())); } catch { setDrives((d) => d || []); }
    };
    load();
    if (live) t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [id, live]);

  if (!drives) return <section className="card pbp"><p className="muted">Loading play-by-play…</p></section>;
  if (!drives.length) return <section className="card pbp"><p className="muted">Play-by-play shows up once the game starts.</p></section>;
  const latest = drives[drives.length - 1]?.id;
  const shown = live ? [...drives].reverse() : drives;

  return (
    <section className="card pbp">
      <div className="cardh"><h3>Drive chart</h3>{live && <span className="pbp-live"><i />Updating live</span>}</div>
      <div className="pbp-key"><span>Own goal line</span><span>Midfield</span><span>Opponent goal line</span></div>
      <div className="pbp-list">
        {shown.map((d) => {
          const lo = Math.max(0, Math.min(d.start, d.end)), hi = Math.min(100, Math.max(d.start, d.end));
          const isOpen = open === d.id || (live && !open && d.id === latest);
          return (
            <div key={d.id} className={`pbp-drive ${d.isScore ? "score" : ""} ${isOpen ? "open" : ""}`}>
              <button className="pbp-row" onClick={() => setOpen(isOpen ? "-" : d.id)} aria-expanded={isOpen}>
                <span className="pbp-team">{d.logo && <img src={d.logo} alt="" />}{d.abbr}</span>
                <span className="pbp-when">{q(d.period)} {d.clock}</span>
                <span className="pbp-field"><i className="mid" /><b style={{ left: `${lo}%`, width: `${Math.max(1.5, hi - lo)}%` }} className={d.end < d.start ? "neg" : ""} /></span>
                <span className="pbp-res">{d.result}</span>
                <span className="pbp-desc">{d.desc}</span>
              </button>
              {isOpen && (
                <ol className="pbp-plays">
                  {d.plays.map((p) => (
                    <li key={p.id} className={p.scoring ? "scoring" : ""}>
                      <span className="pbp-pclock">{q(p.period)} {p.clock}</span>
                      <span className="pbp-ptext">{p.down && <small>{p.down}</small>}{p.text}</span>
                      {p.scoring && <b className="pbp-pscore">{p.away}-{p.home}</b>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })}
      </div>
      <p className="muted small srcnote">Tap a drive to see every play. Data from ESPN.</p>
    </section>
  );
}
