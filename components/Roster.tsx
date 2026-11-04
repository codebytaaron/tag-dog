"use client";
import { useMemo, useState } from "react";
import type { RosterData } from "@/lib/roster";

export default function Roster({ data }: { data: RosterData }) {
  const [g, setG] = useState(data.groups[0]?.key || "");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const ps = data.groups.find((x) => x.key === g)?.players || [];
    const s = q.trim().toLowerCase();
    return s ? data.groups.flatMap((x) => x.players).filter((p) => `${p.name} ${p.pos} ${p.jersey}`.toLowerCase().includes(s)) : ps;
  }, [data, g, q]);
  return (
    <div className="ros">
      <div className="ros-ctl">
        <div className="ros-tabs">{data.groups.map((x) => <button key={x.key} className={g === x.key && !q ? "on" : ""} onClick={() => { setG(x.key); setQ(""); }}>{x.label} <span>{x.players.length}</span></button>)}</div>
        <input className="search" placeholder="Find a player" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="ros-grid">
        {list.map((p) => (
          <div key={p.id} className="ros-p">
            {p.photo ? <img src={p.photo} alt="" loading="lazy" /> : <span className="ros-ph" />}
            <div><b>{p.name}</b><small>{[p.jersey && `#${p.jersey}`, p.pos, p.cls, p.ht, p.wt].filter(Boolean).join(" · ")}</small></div>
          </div>
        ))}
        {list.length === 0 && <p className="muted">No players found.</p>}
      </div>
    </div>
  );
}
