"use client";
import { useEffect, useState } from "react";

// Tiny localStorage store with a same-tab change event.
// Falls back to memory when the browser blocks storage (private mode, strict settings).
const mem: Record<string, string> = {};
function store<T>(key: string, evt: string) {
  const read = (): T[] => {
    let raw: string | null = null;
    try { raw = localStorage.getItem(key); } catch {}
    if (raw == null) raw = mem[key] ?? null;
    try { return JSON.parse(raw || "[]"); } catch { return []; }
  };
  const write = (v: T[]) => {
    const s = JSON.stringify(v);
    mem[key] = s;
    try { localStorage.setItem(key, s); } catch {}
    window.dispatchEvent(new Event(evt));
  };
  function useStore() {
    const [v, setV] = useState<T[]>([]);
    const [ready, setReady] = useState(false);
    useEffect(() => {
      const s = () => { setV(read()); setReady(true); };
      s();
      window.addEventListener(evt, s); window.addEventListener("storage", s);
      return () => { window.removeEventListener(evt, s); window.removeEventListener("storage", s); };
    }, []);
    return [v, ready] as const;
  }
  return { read, write, useStore };
}

const games = store<string>("tapedog.saved", "tapedog-saved");
export type FollowedTeam = { id: string; name: string; logo: string };
const teams = store<FollowedTeam>("tapedog.teams", "tapedog-teams");
export type Profile = { name: string; teamId: string; teamName: string; teamLogo: string; color: string; since: string };
const profiles = store<Profile>("tapedog.profile", "tapedog-profile");
export type Side = "home" | "away";
export type Pick = {
  id: string; date: string; pick: Side; fav: Side; line: string; madeAt: string;
  away: { abbr: string; short: string; logo: string }; home: { abbr: string; short: string; logo: string };
};
const picks = store<Pick>("tapedog.picks", "tapedog-picks");

export const readSaved = games.read;
export function useSaved() {
  const [ids] = games.useStore();
  const toggle = (id: string) => { const c = games.read(); games.write(c.includes(id) ? c.filter((x) => x !== id) : [...c, id]); };
  return { ids, toggle };
}
export function useFollow() {
  const [list] = teams.useStore();
  const toggle = (t: FollowedTeam) => { const c = teams.read(); teams.write(c.some((x) => x.id === t.id) ? c.filter((x) => x.id !== t.id) : [...c, t]); };
  return { ids: list.map((t) => t.id), list, toggle };
}
export function useProfile() {
  const [v, ready] = profiles.useStore();
  return { profile: v[0] || null, ready, save: (p: Profile) => profiles.write([p]) };
}
export function usePicks() {
  const [list] = picks.useStore();
  return {
    list,
    set: (p: Pick) => picks.write([...picks.read().filter((x) => x.id !== p.id), p]),
    remove: (id: string) => picks.write(picks.read().filter((x) => x.id !== id)),
  };
}
export function resetAll() {
  for (const k of ["profile", "picks", "saved", "teams"]) {
    try { localStorage.removeItem(`tapedog.${k}`); } catch {}
    window.dispatchEvent(new Event(`tapedog-${k}`));
  }
}

export function FollowButton({ team }: { team: FollowedTeam }) {
  const { ids, toggle } = useFollow();
  const on = ids.includes(team.id);
  return <button className={`follow ${on ? "on" : ""}`} onClick={() => toggle(team)}>{on ? "★ Following" : "☆ Follow team"}</button>;
}

export default function SaveButton({ id, big = false }: { id: string; big?: boolean }) {
  const { ids, toggle } = useSaved();
  const on = ids.includes(id);
  return (
    <button
      className={`save ${on ? "on" : ""} ${big ? "big" : ""}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); }}
      aria-label={on ? "Remove from saved" : "Save game"}
    >
      <svg viewBox="0 0 24 24" width={big ? 18 : 16} height={big ? 18 : 16}><path d="M6 3h12v18l-6-4-6 4z" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
      {big && <span>{on ? "Saved" : "Save game"}</span>}
    </button>
  );
}
