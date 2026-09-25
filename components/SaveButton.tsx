"use client";
import { useEffect, useState } from "react";

const KEY = "tapedog.saved";
export function readSaved(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function useSaved() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setIds(readSaved());
    sync();
    window.addEventListener("tapedog-saved", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("tapedog-saved", sync); window.removeEventListener("storage", sync); };
  }, []);
  const toggle = (id: string) => {
    const cur = readSaved();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    window.dispatchEvent(new Event("tapedog-saved"));
  };
  return { ids, toggle };
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
