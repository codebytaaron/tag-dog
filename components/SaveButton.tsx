"use client";
import { useEffect, useState } from "react";

// Tiny localStorage store with a same-tab change event.
function store<T>(key: string, evt: string) {
  const read = (): T[] => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } };
  const write = (v: T[]) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} window.dispatchEvent(new Event(evt)); };
  function useStore() {
    const [v, setV] = useState<T[]>([]);
    useEffect(() => {
      const s = () => setV(read());
      s();
      window.addEventListener(evt, s); window.addEventListener("storage", s);
      return () => { window.removeEventListener(evt, s); window.removeEventListener("storage", s); };
    }, []);
    return v;
  }
  return { read, write, useStore };
}

const games = store<string>("tapedog.saved", "tapedog-saved");
export type FollowedTeam = { id: string; name: string; logo: string };
const teams = store<FollowedTeam>("tapedog.teams", "tapedog-teams");

export const readSaved = games.read;
export function useSaved() {
  const ids = games.useStore();
  const toggle = (id: string) => { const c = games.read(); games.write(c.includes(id) ? c.filter((x) => x !== id) : [...c, id]); };
  return { ids, toggle };
}
export function useFollow() {
  const list = teams.useStore();
  const toggle = (t: FollowedTeam) => { const c = teams.read(); teams.write(c.some((x) => x.id === t.id) ? c.filter((x) => x.id !== t.id) : [...c, t]); };
  return { ids: list.map((t) => t.id), list, toggle };
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
