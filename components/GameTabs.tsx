"use client";
import { useEffect, useState, type ReactNode } from "react";

// Real tabs for the game page: one section at a time, remembered in the URL hash.
export default function GameTabs({ tabs }: { tabs: { id: string; label: string; node: ReactNode }[] }) {
  const [t, setT] = useState(tabs[0].id);
  useEffect(() => { const h = location.hash.slice(1); if (tabs.some((x) => x.id === h)) setT(h); }, []); // eslint-disable-line
  const pick = (id: string) => { setT(id); history.replaceState(null, "", `#${id}`); };
  return (
    <>
      <nav className="gtabs" role="tablist">
        {tabs.map((x) => <button key={x.id} role="tab" aria-selected={t === x.id} className={t === x.id ? "on" : ""} onClick={() => pick(x.id)}>{x.label}</button>)}
      </nav>
      {tabs.map((x) => <div key={x.id} role="tabpanel" hidden={t !== x.id} className="gpanel">{x.node}</div>)}
    </>
  );
}
