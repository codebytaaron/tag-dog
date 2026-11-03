"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Reel } from "@/lib/reels";
import { useFollow, useProfile, useSaved } from "./SaveButton";

type F = "foryou" | "top25" | "upsets" | "close" | "liked";
const FILTERS: [F, string][] = [["foryou", "For you"], ["top25", "Top 25"], ["upsets", "Upsets"], ["close", "Close games"], ["liked", "Liked"]];
const SPEEDS = [1, 1.5, 2];
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

// ---- local stores (this device only) ----
const load = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || "") ?? d; } catch { return d; } };
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const AFF = "tapedog.reelaff", SEEN = "tapedog.reelseen", LIKES = "tapedog.reellikes", DAY = "tapedog.reelday";

// Big-play words: these clips tend to get watched all the way through.
const BIG = /touchdown|\btd\b|game-?winn|walk-?off|pick-?six|hail mary|interception|one-?handed|blocked|kick return|punt return|fumble|scores?|sack|overtime|go-ahead|record/i;
const keysOf = (r: Reel) => [...r.tags.map((t) => `tag:${t}`), `team:${r.home.id}`, `team:${r.away.id}`, r.duration <= 35 ? "len:short" : "len:long", BIG.test(r.title) ? "kind:bigplay" : "kind:other"];

// Taste model: how much of a clip you watch, how long you stay, likes and quick skips move these weights.
function learn(r: Reel, watched: number, seconds: number, liked = false) {
  const delta = liked ? 2 : watched >= 0.9 ? 1.2 : watched >= 0.6 ? 0.6 : seconds < 2.5 ? -0.6 : 0;
  if (!delta) return;
  const a = load<Record<string, number>>(AFF, {});
  for (const k of keysOf(r)) a[k] = Math.max(-4, Math.min(8, (a[k] || 0) + delta));
  save(AFF, a);
}

// Ranking: importance x randomness x your taste x novelty, hook-first, with wildcard slots for discovery.
function order(clips: Reel[], mine: Set<string>, opening: boolean): Reel[] {
  const a = load<Record<string, number>>(AFF, {});
  const seen = load<Record<string, number>>(SEEN, {});
  const scored = clips.map((c) => {
    let s = c.score * (0.55 + Math.random() * 0.9);
    for (const k of keysOf(c)) s *= 1 + (a[k] || 0) * 0.12;
    if (mine.has(c.home.id) || mine.has(c.away.id)) s *= 1.8;
    if (BIG.test(c.title)) s *= 1.3;
    if (opening && c.duration && c.duration <= 35) s *= 1.25;
    if (seen[c.key]) s *= 0.15;
    return { c, s };
  }).sort((x, y) => y.s - x.s).map((x) => x.c);
  const out: Reel[] = [];
  while (scored.length) {
    let i = out.length % 6 === 5 && scored.length > 8 ? Math.floor(scored.length / 2 + Math.random() * (scored.length / 2)) : -1;
    if (i < 0 || out.slice(-3).some((o) => o.gameId === scored[i].gameId)) i = scored.findIndex((c) => !out.slice(-3).some((o) => o.gameId === c.gameId));
    out.push(scored.splice(i < 0 ? 0 : i, 1)[0]);
  }
  return out;
}

const Icon = {
  heart: (on: boolean) => <svg width="24" height="24" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg>,
  share: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" /></svg>,
  link: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>,
  save: (on: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M6 3h12v18l-6-4-6 4z" /></svg>,
  recap: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h10" /></svg>,
};

export default function Reels({ initial, nextWeek, first }: { initial: Reel[]; nextWeek: number; first: string | null }) {
  const feed = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Reel[]>([]);
  const [f, setF] = useState<F>("foryou");
  const [team, setTeam] = useState<string | null>(null);
  const [teamOpen, setTeamOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [vol, setVol] = useState(0.8);
  const [speed, setSpeed] = useState(1);
  const [auto, setAuto] = useState(true);
  const [paused, setPaused] = useState(false);
  const [prog, setProg] = useState(0);
  const [toast, setToast] = useState("");
  const [likes, setLikes] = useState<string[]>([]);
  const [burst, setBurst] = useState<string | null>(null);
  const [today, setToday] = useState(0);
  const week = useRef(nextWeek);
  const busy = useRef(false);
  const active = useRef<{ i: number; key: string; start: number } | null>(null);
  const tapTimer = useRef<any>(null);
  const { ids } = useFollow();
  const { profile } = useProfile();
  const { ids: saved, toggle: toggleSave } = useSaved();
  const mineKey = [...ids, profile?.teamId || ""].join(",");
  const mine = () => new Set(mineKey.split(",").filter(Boolean));

  useEffect(() => {
    let list = order(initial, mine(), true);
    if (first) { const c = list.find((x) => x.key === first); if (c) list = [c, ...list.filter((x) => x !== c)]; }
    setItems(list);
    setMuted(load<string>("tapedog.reelsound", "off") !== "on");
    setVol(load<number>("tapedog.reelvol", 0.8));
    setAuto(load<boolean>("tapedog.reelauto", true));
    setLikes(load<string[]>(LIKES, []));
    const d = load<{ day: string; n: number }>(DAY, { day: "", n: 0 });
    setToday(d.day === new Date().toDateString() ? d.n : 0);
    const seen = load<Record<string, number>>(SEEN, {});
    save(SEEN, Object.fromEntries(Object.entries(seen).filter(([, t]) => Date.now() - t < 7 * 864e5).slice(-1500)));
  }, []); // eslint-disable-line

  // Teams that appear in the feed, most clips first, for the team picker.
  const teams = useMemo(() => {
    const m = new Map<string, { id: string; short: string; logo: string; n: number }>();
    for (const r of items) for (const t of [r.home, r.away]) { const e = m.get(t.id) || { id: t.id, short: t.short, logo: t.logo, n: 0 }; e.n++; m.set(t.id, e); }
    return [...m.values()].sort((a, b) => b.n - a.n || a.short.localeCompare(b.short));
  }, [items]);
  const teamName = teams.find((t) => t.id === team)?.short;

  const view = useMemo(() => {
    let l = items;
    if (team) l = l.filter((r) => r.home.id === team || r.away.id === team);
    if (f === "top25") return l.filter((r) => r.home.rank || r.away.rank);
    if (f === "upsets") return l.filter((r) => r.tags.includes("Upset"));
    if (f === "close") return l.filter((r) => r.tags.includes("One-score game") || r.tags.includes("Overtime"));
    if (f === "liked") return l.filter((r) => likes.includes(r.key));
    return l;
  }, [items, f, likes, team]);

  const more = useCallback(async () => {
    if (busy.current || week.current < 1) return;
    busy.current = true;
    try {
      const d = await (await fetch(`/api/reels?week=${week.current}`)).json();
      week.current -= 1;
      setItems((cur) => {
        const have = new Set(cur.map((c) => c.key));
        return [...cur, ...order((d.clips || []).filter((c: Reel) => !have.has(c.key)).map((c: Reel) => ({ ...c, score: c.score * 0.5 })), mine(), false)];
      });
    } catch {}
    busy.current = false;
  }, [mineKey]); // eslint-disable-line

  useEffect(() => { feed.current?.scrollTo({ top: 0 }); setIdx(0); active.current = null; }, [f, team]);

  const settle = (vids: HTMLVideoElement[]) => {
    const a = active.current;
    if (!a) return;
    const r = view[a.i], v = vids[a.i];
    if (!r || !v) return;
    learn(r, v.duration ? v.currentTime / v.duration : 0, (Date.now() - a.start) / 1000);
    const d = load<{ day: string; n: number }>(DAY, { day: "", n: 0 });
    const n = (d.day === new Date().toDateString() ? d.n : 0) + 1;
    save(DAY, { day: new Date().toDateString(), n }); setToday(n);
    if (f === "foryou" && !team) {
      const keep = a.i + 3;
      setItems((cur) => cur.length > keep + 4 ? [...cur.slice(0, keep), ...order(cur.slice(keep), mine(), false)] : cur);
    }
  };

  useEffect(() => {
    const root = feed.current;
    if (!root) return;
    const vids = [...root.querySelectorAll<HTMLVideoElement>("video")];
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target as HTMLVideoElement, i = Number(v.dataset.i);
        if (e.isIntersecting) {
          if (active.current?.key === v.dataset.k) continue;
          settle(vids);
          active.current = { i, key: v.dataset.k || "", start: Date.now() };
          if (v.dataset.k) { const seen = load<Record<string, number>>(SEEN, {}); seen[v.dataset.k] = Date.now(); save(SEEN, seen); }
          setIdx(i); setProg(0); setPaused(false);
          v.volume = vol; v.playbackRate = speed; v.preload = "auto";
          v.play().catch(() => setPaused(true));
          for (const n of [i + 1, i + 2]) if (vids[n]) vids[n].preload = "auto";
          if (i >= view.length - 5) more();
        } else if (!v.paused) v.pause();
      }
    }, { root, threshold: 0.65 });
    vids.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [view, more]); // eslint-disable-line

  useEffect(() => {
    feed.current?.querySelectorAll("video").forEach((v) => { const el = v as HTMLVideoElement; el.muted = muted || vol === 0; el.volume = vol; el.playbackRate = speed; });
  }, [muted, vol, speed]);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 1600); };
  const go = (i: number) => { const el = feed.current?.querySelectorAll<HTMLElement>(".rl-slide")[i]; if (el) feed.current!.scrollTo({ top: el.offsetTop, behavior: "smooth" }); };
  const cur = () => feed.current?.querySelectorAll("video")[idx] as HTMLVideoElement | undefined;
  const togglePlay = () => { const v = cur(); if (!v) return; if (v.paused) { v.play(); setPaused(false); } else { v.pause(); setPaused(true); } };
  const setSound = (on: boolean) => { setMuted(!on); save("tapedog.reelsound", on ? "on" : "off"); };
  const changeVol = (x: number) => { setVol(x); save("tapedog.reelvol", x); if (x > 0 && muted) setSound(true); if (x === 0) setSound(false); };
  const toggleAuto = () => { const a = !auto; setAuto(a); save("tapedog.reelauto", a); flash(a ? "Autoplay next: on" : "Autoplay next: off"); };
  const nextSpeed = () => { const s = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]; setSpeed(s); flash(`Speed ${s}×`); };
  const toggleLike = (r: Reel, from: "tap" | "button") => {
    const has = likes.includes(r.key);
    if (has && from === "tap") { setBurst(r.key); setTimeout(() => setBurst(null), 700); return; }
    const next = has ? likes.filter((k) => k !== r.key) : [...likes, r.key];
    setLikes(next); save(LIKES, next);
    if (!has) { learn(r, 1, 99, true); setBurst(r.key); setTimeout(() => setBurst(null), 700); }
  };
  const onTap = (r: Reel) => {
    if (tapTimer.current) { clearTimeout(tapTimer.current); tapTimer.current = null; toggleLike(r, "tap"); return; }
    tapTimer.current = setTimeout(() => { tapTimer.current = null; togglePlay(); }, 260);
  };
  const link = (r: Reel) => `${location.origin}/reels?clip=${encodeURIComponent(r.key)}`;
  const copy = async (r: Reel) => { try { await navigator.clipboard.writeText(link(r)); flash("Link copied"); } catch { flash("Couldn't copy"); } };
  const share = async (r: Reel) => {
    try { if (navigator.share) { await navigator.share({ title: r.title, url: link(r) }); return; } await navigator.clipboard.writeText(link(r)); flash("Link copied"); } catch {}
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input,textarea,select")) return;
      if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); go(Math.min(idx + 1, view.length - 1)); }
      if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); go(Math.max(idx - 1, 0)); }
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      if (e.key === "m") setSound(muted);
      if (e.key === "l" && view[idx]) toggleLike(view[idx], "button");
      if (e.key === "Escape") setTeamOpen(false);
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  });

  return (
    <div className="rl">
      <div className="rl-bar">
        <div className="rl-chips">
          {FILTERS.map(([k, l]) => <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{l}{k === "liked" && likes.length ? <span>{likes.length}</span> : null}</button>)}
          <span className="rl-sep" />
          <button className={`rl-teambtn ${team ? "on" : ""}`} onClick={() => setTeamOpen(!teamOpen)}>{teamName || "All teams"} ▾</button>
          {team && <button className="rl-clear" onClick={() => setTeam(null)} aria-label="Clear team">×</button>}
        </div>
        <div className="rl-vol">
          <button onClick={() => setSound(muted)} aria-label={muted ? "Turn sound on" : "Mute"}>
            {muted || vol === 0
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6" /></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>}
          </button>
          <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : vol} onChange={(e) => changeVol(Number(e.target.value))} aria-label="Volume" />
        </div>
      </div>

      {teamOpen && (
        <div className="rl-teams" onClick={() => setTeamOpen(false)}>
          <div className="rl-teamlist" onClick={(e) => e.stopPropagation()}>
            <div className="rl-teamhead"><b>Watch one team</b><button onClick={() => setTeamOpen(false)} aria-label="Close">×</button></div>
            <div className="rl-teamgrid">
              <button className={!team ? "on" : ""} onClick={() => { setTeam(null); setTeamOpen(false); }}>All teams</button>
              {teams.map((t) => (
                <button key={t.id} className={team === t.id ? "on" : ""} onClick={() => { setTeam(t.id); setTeamOpen(false); }}>
                  {t.logo && <img src={t.logo} alt="" />}<span>{t.short}</span><em>{t.n}</em>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rl-feed" ref={feed}>
        {view.length === 0 && <div className="rl-empty">{f === "liked" ? "Double-tap a clip to like it. Your likes show up here." : items.length ? "No clips here yet. Try another filter." : "Loading clips…"}</div>}
        {view.map((r, i) => {
          const liked = likes.includes(r.key), isSaved = saved.includes(r.gameId), next = view[i + 1];
          return (
            <section key={r.key} className="rl-slide" style={{ ["--thumb" as any]: `url(${r.thumb})` }}>
              <div className="rl-ambient" aria-hidden />
              <div className="rl-inner">
                <div className="rl-main">
                  <div className="rl-video">
                    <video data-i={i} data-k={r.key} src={r.mp4} poster={r.thumb} muted={muted} playsInline preload={i < 2 ? "auto" : "none"}
                      onClick={() => onTap(r)}
                      onTimeUpdate={(e) => { if (i === idx) { const v = e.currentTarget; setProg(v.duration ? v.currentTime / v.duration : 0); } }}
                      onEnded={(e) => { if (auto && i < view.length - 1) go(i + 1); else { e.currentTarget.currentTime = 0; e.currentTarget.play().catch(() => {}); } }} />
                    {i === idx && paused && <button className="rl-play" onClick={togglePlay} aria-label="Play"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></button>}
                    {i === idx && muted && !paused && <button className="rl-unmute" onClick={() => setSound(true)}>Tap for sound</button>}
                    {burst === r.key && <span className="rl-heart" aria-hidden>♥</span>}
                    <div className="rl-prog"><i style={{ width: `${i === idx ? prog * 100 : 0}%` }} /></div>
                  </div>
                  <div className="rl-cap">
                    <div className="rl-match">
                      {(["away", "home"] as const).map((s, k) => (
                        <Link key={s} href={`/team/${r[s].id}`} className={r[s].winner ? "w" : ""}>
                          {k === 1 && <span className="rl-at">at</span>}
                          {r[s].logo && <img src={r[s].logo} alt="" />}
                          <span>{r[s].rank ? <em>{r[s].rank}</em> : null}{r[s].short}</span>
                          <b>{r[s].score}</b>
                        </Link>
                      ))}
                    </div>
                    <h2>{r.title}</h2>
                    <div className="rl-sub">
                      {r.tags.map((t) => <span key={t} className={t === "Upset" ? "up" : ""}>{t}</span>)}
                      <span className="plain">Week {r.week} · {mmss(r.duration)}</span>
                      {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="plain">Video: ESPN ↗</a>}
                    </div>
                  </div>
                  {next && (
                    <button className="rl-next" onClick={() => go(i + 1)}>
                      {next.thumb && <img src={next.thumb} alt="" />}
                      <span><small>Up next</small><b>{next.title}</b></span>
                    </button>
                  )}
                </div>
                <div className="rl-rail">
                  <button className={liked ? "on like" : ""} onClick={() => toggleLike(r, "button")} aria-label={liked ? "Unlike" : "Like"}>{Icon.heart(liked)}<span>{liked ? "Liked" : "Like"}</span></button>
                  <button onClick={() => share(r)} aria-label="Share">{Icon.share}<span>Share</span></button>
                  <button onClick={() => copy(r)} aria-label="Copy link">{Icon.link}<span>Link</span></button>
                  <button className={isSaved ? "on" : ""} onClick={() => { toggleSave(r.gameId); flash(isSaved ? "Removed from saved" : "Game saved"); }} aria-label="Save game">{Icon.save(isSaved)}<span>{isSaved ? "Saved" : "Save"}</span></button>
                  <Link href={`/game/${r.gameId}`} aria-label="Full recap">{Icon.recap}<span>Recap</span></Link>
                  <button onClick={nextSpeed} aria-label="Playback speed"><b className="rl-speed">{speed}×</b><span>Speed</span></button>
                  <button className={auto ? "on" : ""} onClick={toggleAuto} aria-label="Autoplay next"><b className="rl-speed">{auto ? "On" : "Off"}</b><span>Autoplay</span></button>
                </div>
              </div>
            </section>
          );
        })}
        {view.length > 0 && f !== "liked" && !team && week.current >= 1 && <div className="rl-more">Loading more clips…</div>}
      </div>
      {today > 0 && <div className="rl-today">{today} watched today</div>}
      {toast && <div className="rl-toast">{toast}</div>}
    </div>
  );
}
