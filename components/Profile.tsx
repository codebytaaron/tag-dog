"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LiteGame } from "@/lib/data";
import { useProfile, usePicks, useSaved, useFollow, resetAll, type Profile as P } from "./SaveButton";
import Kickoff from "./Kickoff";

type TeamOpt = { id: string; name: string; loc: string; abbr: string; logo: string; color: string };
type Res = { state: string; home: number | null; away: number | null; winner: "home" | "away" | null };

function Setup({ initial, onDone }: { initial: P | null; onDone: (p: P) => void }) {
  const [name, setName] = useState(initial?.name || "");
  const [teams, setTeams] = useState<TeamOpt[]>([]);
  const [q, setQ] = useState("");
  const [team, setTeam] = useState<TeamOpt | null>(null);
  useEffect(() => { fetch("/api/teams").then((r) => r.json()).then((t) => { setTeams(t); if (initial) setTeam(t.find((x: TeamOpt) => x.id === initial.teamId) || null); }).catch(() => {}); }, []); // eslint-disable-line
  const res = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return teams.filter((t) => t.name.toLowerCase().includes(s) || t.abbr.toLowerCase() === s).slice(0, 6);
  }, [q, teams]);
  const ok = name.trim().length > 0 && team;
  return (
    <div className="setup">
      <div className="eyebrow mono">{initial ? "EDIT PROFILE" : "MAKE IT YOURS"}</div>
      <h1 className="h2">{initial ? "Update your profile" : "Set up your TapeDog profile"}</h1>
      <p className="muted">Pick a name and your team. Your picks, record and badges build from there.</p>
      <label className="fld"><span className="mono">YOUR NAME</span><input value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder="Teddy" /></label>
      <label className="fld"><span className="mono">YOUR TEAM</span>
        {team ? (
          <div className="picked" style={{ ["--c" as any]: team.color }}>{team.logo && <img src={team.logo} alt="" />}<b>{team.name}</b><button onClick={() => { setTeam(null); setQ(""); }}>Change</button></div>
        ) : (
          <>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: Texas, Ohio State, Bama…" />
            {res.length > 0 && <div className="opts">{res.map((t) => <button key={t.id} onClick={() => setTeam(t)}>{t.logo && <img src={t.logo} alt="" />}{t.name}</button>)}</div>}
          </>
        )}
      </label>
      <button className="btn primary" disabled={!ok} onClick={() => ok && onDone({ name: name.trim(), teamId: team!.id, teamName: team!.name, teamLogo: team!.logo, color: team!.color, since: initial?.since || new Date().toISOString() })}>
        {initial ? "Save changes" : "Create profile"}
      </button>
    </div>
  );
}

export default function Profile({ games }: { games: LiteGame[] }) {
  const { profile, ready, save } = useProfile();
  const { list: picks, remove } = usePicks();
  const { ids: saved } = useSaved();
  const { list: teams, ids: followIds } = useFollow();
  const [editing, setEditing] = useState(false);
  const [results, setResults] = useState<Record<string, Res>>({});

  useEffect(() => {
    if (!picks.length) return;
    fetch(`/api/results?ids=${picks.map((p) => p.id).join(",")}`).then((r) => r.json()).then(setResults).catch(() => {});
  }, [picks.length]); // eslint-disable-line

  const graded = useMemo(() => picks.map((p) => {
    const r = results[p.id];
    const outcome = r?.state === "post" && r.winner ? (r.winner === p.pick ? "W" : "L") : null;
    return { ...p, r, outcome, dog: p.pick !== p.fav };
  }).sort((a, b) => Date.parse(b.date) - Date.parse(a.date)), [picks, results]);

  const done = graded.filter((g) => g.outcome);
  const wins = done.filter((g) => g.outcome === "W").length, losses = done.length - wins;
  const dogHits = done.filter((g) => g.dog && g.outcome === "W").length, dogCalls = graded.filter((g) => g.dog).length;
  let streak = 0, streakType = "";
  for (const g of done) { if (!streakType) streakType = g.outcome!; if (g.outcome === streakType) streak++; else break; }
  const rate = done.length ? Math.round((wins / done.length) * 100) : null;

  const myIds = new Set([profile?.teamId, ...followIds].filter(Boolean) as string[]);
  const week = games.filter((g) => myIds.has(g.home.id) || myIds.has(g.away.id));
  const savedGames = games.filter((g) => saved.includes(g.id));

  const BADGES = [
    { n: "First Call", d: "Make your first pick", on: picks.length >= 1 },
    { n: "Dog Lover", d: "Pick 5 underdogs", on: dogCalls >= 5 },
    { n: "Called It", d: "Hit an underdog pick", on: dogHits >= 1 },
    { n: "Sharp", d: "60%+ over 10 graded picks", on: done.length >= 10 && (rate ?? 0) >= 60 },
    { n: "On Fire", d: "3-pick win streak", on: streakType === "W" && streak >= 3 },
    { n: "Loyal", d: "Follow 3 teams", on: teams.length >= 3 },
    { n: "Film Junkie", d: "Save 5 games", on: saved.length >= 5 },
    { n: "Rooted", d: "Set your team", on: !!profile },
  ];

  if (!ready) return <div className="wrap board"><div className="skelp" /></div>;
  if (!profile || editing) return <div className="wrap board"><Setup initial={profile} onDone={(p) => { save(p); setEditing(false); }} /></div>;

  const ini = profile.name.split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="prof">
      <section className="phero" style={{ ["--c" as any]: profile.color }}>
        <div className="wrap phin">
          <div className="pava">{profile.teamLogo ? <img src={profile.teamLogo} alt="" /> : null}<span>{ini}</span></div>
          <div className="pinfo">
            <div className="eyebrow mono">TAPEDOG PROFILE</div>
            <h1 className="btitle">{profile.name}</h1>
            <p className="muted">Fan of <Link href={`/team/${profile.teamId}`} className="c-tape">{profile.teamName}</Link> · member since {new Date(profile.since).toLocaleDateString([], { month: "short", year: "numeric" })}</p>
          </div>
          <button className="btn ghost" onClick={() => setEditing(true)}>Edit profile</button>
        </div>
      </section>

      <div className="wrap board">
        <div className="pstats">
          <div><b>{wins}-{losses}</b><span className="mono">RECORD</span></div>
          <div><b>{rate != null ? `${rate}%` : "–"}</b><span className="mono">HIT RATE</span></div>
          <div><b>{dogHits}/{dogCalls}</b><span className="mono">DOG CALLS HIT</span></div>
          <div><b className={streakType === "W" ? "c-ok" : streakType === "L" ? "c-fade" : ""}>{streak ? `${streakType}${streak}` : "–"}</b><span className="mono">STREAK</span></div>
        </div>

        <div className="pgrid">
          <div className="col">
            <section className="card">
              <div className="cardh"><h3>Your week</h3><span className="mono muted">YOUR TEAM + FOLLOWED</span></div>
              {week.length ? week.map((g) => (
                <Link key={g.id} href={`/game/${g.id}`} className="mini" style={{ ["--c" as any]: g[g.favorite].color }}>
                  <span className="mlogos">{g.away.logo && <img src={g.away.logo} alt="" />}{g.home.logo && <img src={g.home.logo} alt="" />}</span>
                  <span className="mtxt"><b>{g.away.short} @ {g.home.short}</b><small className="mono muted">{g.line} · <Kickoff date={g.date} /></small></span>
                  <span className={`tiny t-${g.tier}`}>{g.tier} {g.score}</span>
                </Link>
              )) : <p className="muted">None of your teams play this week. <Link href="/board" className="c-tape">Browse the board</Link> or follow more teams with ⌘K.</p>}
            </section>

            <section className="card">
              <div className="cardh"><h3>Your calls</h3><span className="mono muted">{graded.length} PICKS · GRADED AUTOMATICALLY</span></div>
              {graded.length ? (
                <ul className="calls">
                  {graded.map((p) => {
                    const t = p[p.pick];
                    return (
                      <li key={p.id}>
                        <Link href={`/game/${p.id}`} className="call">
                          <span className="mlogos">{p.away.logo && <img src={p.away.logo} alt="" />}{p.home.logo && <img src={p.home.logo} alt="" />}</span>
                          <span className="mtxt"><b>{p.away.short} @ {p.home.short}</b><small className="mono muted">You: {t.short}{p.dog ? " (dog)" : ""} · {p.line}</small></span>
                          {p.outcome ? <span className={`res ${p.outcome}`}>{p.outcome}{p.r?.away != null ? ` ${p.r.away}-${p.r.home}` : ""}</span>
                            : p.r?.state === "in" ? <span className="res live">LIVE</span> : <span className="res">PENDING</span>}
                        </Link>
                        {!p.outcome && p.r?.state !== "in" && <button className="rm" onClick={() => remove(p.id)} aria-label="Remove pick">×</button>}
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="muted">No picks yet. Open any game and hit <b>Make your call</b>.</p>}
            </section>
          </div>

          <div className="col">
            <section className="card">
              <div className="cardh"><h3>Badges</h3><span className="mono muted">{BADGES.filter((b) => b.on).length}/{BADGES.length} EARNED</span></div>
              <div className="badges">
                {BADGES.map((b) => <div key={b.n} className={`badge ${b.on ? "on" : ""}`}><i>{b.on ? "★" : "☆"}</i><b>{b.n}</b><small>{b.d}</small></div>)}
              </div>
            </section>

            <section className="card">
              <div className="cardh"><h3>Teams you follow</h3><span className="mono muted">{teams.length}</span></div>
              {teams.length ? <div className="myteams">{teams.map((t) => <Link key={t.id} href={`/team/${t.id}`} className="myteam">{t.logo && <img src={t.logo} alt="" />}<b>{t.name}</b></Link>)}</div>
                : <p className="muted">Follow teams from their page and they show up here.</p>}
            </section>

            <section className="card">
              <div className="cardh"><h3>Saved games</h3><span className="mono muted">{savedGames.length}</span></div>
              {savedGames.length ? savedGames.map((g) => (
                <Link key={g.id} href={`/game/${g.id}`} className="mini"><span className="mtxt"><b>{g.away.short} @ {g.home.short}</b><small className="mono muted">{g.line}</small></span><span className={`tiny t-${g.tier}`}>{g.tier} {g.score}</span></Link>
              )) : <p className="muted">Bookmark games on the board to keep them here.</p>}
            </section>
          </div>
        </div>
        <p className="hint mono">YOUR PROFILE LIVES ON THIS DEVICE · <button className="linkbtn" onClick={() => { if (confirm("Reset your profile, picks, saved games and followed teams?")) resetAll(); }}>RESET</button></p>
      </div>
    </div>
  );
}
