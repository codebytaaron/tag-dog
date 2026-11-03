// Shared taste profile (this device only). Reels, game views and team views all feed it;
// the home page, Fade Board and related games read it. Keys look like "team:333" or "tag:Upset".
const AFF = "tapedog.reelaff", RECENT = "tapedog.recent";

export function taste(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(AFF) || "{}"); } catch { return {}; }
}

export function bump(keys: string[], d: number) {
  const a = taste();
  for (const k of keys) a[k] = Math.max(-4, Math.min(8, (a[k] || 0) + d));
  try { localStorage.setItem(AFF, JSON.stringify(a)); } catch {}
}

export function interest(teamIds: string[], tags: string[] = []): number {
  if (typeof window === "undefined") return 0;
  const a = taste();
  return teamIds.reduce((s, id) => s + (a[`team:${id}`] || 0), 0) + tags.reduce((s, t) => s + (a[`tag:${t}`] || 0) * 0.5, 0);
}

// Opening a game or team page is a light interest signal; game pages also go into "Recently viewed".
export function recordView(id: string | null, teams: string[]) {
  bump(teams.map((t) => `team:${t}`), 0.4);
  if (!id) return;
  try {
    const list = recent().filter((r) => r.id !== id);
    localStorage.setItem(RECENT, JSON.stringify([{ id, t: Date.now() }, ...list].slice(0, 20)));
  } catch {}
}

export function recent(): { id: string; t: number }[] {
  try { return JSON.parse(localStorage.getItem(RECENT) || "[]"); } catch { return []; }
}
