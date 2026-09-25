"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFollow } from "./SaveButton";

type T = { id: string; name: string; short: string; abbr: string; loc: string; nick: string; logo: string; color: string };
const POPULAR = ["333", "61", "194", "251", "130", "87", "2483", "99", "228", "245"];
// Fan shorthand → ESPN team id.
const ALIAS: Record<string, string> = {
  bama: "333", roll: "333", tide: "333", uga: "61", dawgs: "61", osu: "194", buckeyes: "194", tosu: "194", horns: "251", ut: "251",
  um: "130", michigan: "130", nd: "87", irish: "87", ducks: "2483", lsu: "99", clemson: "228", aggies: "245", tamu: "245",
  usc: "30", trojans: "30", psu: "213", fsu: "52", noles: "52", uf: "57", gators: "57", ou: "201", sooners: "201",
  vols: "2633", tenn: "2633", auburn: "2", barn: "2", miami: "2390", canes: "2390", ole: "145", olemiss: "145", msu: "344",
  byu: "252", ucf: "2116", smu: "2567", tcu: "2628", wisky: "275", huskers: "158", neb: "158", uw: "264", cuse: "183",
};

export default function Search() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [teams, setTeams] = useState<T[] | null>(null);
  const [sel, setSel] = useState(0);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const { ids: followed } = useFollow();

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      else if (e.key === "/" && !(e.target as HTMLElement)?.closest?.("input,textarea")) { e.preventDefault(); setOpen(true); }
      else if (e.key === "Escape") setOpen(false);
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQ(""); setSel(0);
    setTimeout(() => input.current?.focus(), 20);
    if (!teams) fetch("/api/teams").then((r) => r.json()).then(setTeams).catch(() => setTeams([]));
  }, [open]); // eslint-disable-line

  const res = useMemo(() => {
    if (!teams) return [];
    const s = q.trim().toLowerCase();
    if (!s) {
      const pick = (list: string[]) => list.map((id) => teams.find((t) => t.id === id)).filter(Boolean) as T[];
      return [...pick(followed), ...pick(POPULAR.filter((id) => !followed.includes(id)))].slice(0, 10);
    }
    const alias = ALIAS[s.replace(/[^a-z]/g, "")];
    const rank = (t: T) => {
      if (t.id === alias) return -2;
      if (t.abbr.toLowerCase() === s) return 0;
      if (t.loc.toLowerCase().startsWith(s) || t.name.toLowerCase().startsWith(s)) return 1;
      if (t.nick.toLowerCase().startsWith(s)) return 2;
      if (`${t.name} ${t.abbr}`.toLowerCase().includes(s)) return 3;
      return 9;
    };
    const boost = (t: T) => (POPULAR.includes(t.id) ? -0.5 : 0);
    return teams.map((t) => [rank(t) + (rank(t) < 9 ? boost(t) : 0), t] as const).filter(([r]) => r < 9).sort((a, b) => a[0] - b[0]).slice(0, 8).map(([, t]) => t);
  }, [teams, q, followed]);

  const go = (t?: T) => { if (!t) return; setOpen(false); router.push(`/team/${t.id}`); };

  return (
    <>
      <button className="navsearch" onClick={() => setOpen(true)} aria-label="Search teams">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <span className="lbl">Search teams</span><kbd>⌘K</kbd>
      </button>
      {open && (
        <div className="palscrim" onClick={() => setOpen(false)}>
          <div className="pal" onClick={(e) => e.stopPropagation()}>
            <div className="palin">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input ref={input} value={q} placeholder="Search any team: Alabama, UGA, Ducks…" onChange={(e) => { setQ(e.target.value); setSel(0); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setSel((x) => Math.min(x + 1, res.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setSel((x) => Math.max(x - 1, 0)); }
                  if (e.key === "Enter") go(res[sel]);
                }} />
              <kbd onClick={() => setOpen(false)}>ESC</kbd>
            </div>
            <div className="pallabel mono">{q ? "TEAMS" : followed.length ? "YOUR TEAMS · POPULAR" : "POPULAR"}</div>
            <div className="palres">
              {!teams && <div className="palempty mono">Loading teams…</div>}
              {teams && res.length === 0 && <div className="palempty">No team matches “{q}”.</div>}
              {res.map((t, k) => (
                <button key={t.id} className={`palrow ${k === sel ? "on" : ""}`} onMouseEnter={() => setSel(k)} onClick={() => go(t)}>
                  <span className="palsw" style={{ background: t.color }} />
                  {t.logo ? <img src={t.logo} alt="" /> : <span className="palimg" />}
                  <span className="palname">{t.name}{followed.includes(t.id) && <em className="star"> ★</em>}</span>
                  <span className="mono muted">{t.abbr}</span>
                  <span className="palgo">↵</span>
                </button>
              ))}
            </div>
            <div className="palfoot mono"><span>↑↓ navigate</span><span>↵ open</span><span>esc close</span></div>
          </div>
        </div>
      )}
    </>
  );
}
