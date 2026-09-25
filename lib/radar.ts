// Trap Game Radar — scoring engine.
// Data: ESPN public scoreboard + team schedules, Open-Meteo geocoding + forecast.
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";
const REVALIDATE = 1800;

export type Team = {
  id: string; name: string; short: string; abbr: string; logo: string;
  color: string; rank: number | null; record: string;
};
export type Factor = { key: string; label: string; detail: string; points: number };
export type Weather = { tempF: number; windMph: number; precipPct: number; summary: string } | null;
export type Game = {
  id: string; date: string; status: string; name: string;
  venue: { name: string; city: string; state: string; indoor: boolean };
  home: Team; away: Team; line: string | null; spread: number | null;
  favorite: "home" | "away"; network: string | null;
};
export type RadarGame = Game & {
  score: number; tier: "TRAP" | "WATCH" | "SAFE"; factors: Factor[]; weather: Weather;
  favPrev: string | null; favNext: string | null;
};

async function j(url: string) {
  const r = await fetch(url, { next: { revalidate: REVALIDATE } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

function toTeam(c: any): Team {
  const t = c.team || {};
  const rk = c.curatedRank?.current;
  return {
    id: t.id, name: t.displayName, short: t.shortDisplayName || t.name, abbr: t.abbreviation,
    logo: t.logo || t.logos?.[0]?.href || "", color: "#" + (t.color || "444444"),
    rank: rk && rk <= 25 ? rk : null, record: c.records?.[0]?.summary || "0-0",
  };
}

const pct = (rec: string) => {
  const [w, l] = rec.split("-").map(Number);
  return w + l ? w / (w + l) : 0.5;
};

export async function getWeek(week?: string): Promise<{ week: number; season: number; games: Game[] }> {
  const d = await j(`${ESPN}/scoreboard?groups=80&limit=200${week ? `&week=${week}` : ""}`);
  const games: Game[] = (d.events || []).map((e: any) => {
    const c = e.competitions[0];
    const home = toTeam(c.competitors.find((x: any) => x.homeAway === "home"));
    const away = toTeam(c.competitors.find((x: any) => x.homeAway === "away"));
    const odds = c.odds?.[0];
    const line: string | null = odds?.details || null;
    let favorite: "home" | "away" = "home";
    let spread: number | null = null;
    const m = line?.match(/^([A-Z&]+)\s+(-?\d+(\.\d+)?)/);
    if (m) {
      favorite = m[1] === away.abbr ? "away" : "home";
      spread = Math.abs(parseFloat(m[2]));
    } else if (home.rank || away.rank) {
      favorite = (away.rank ?? 99) < (home.rank ?? 99) ? "away" : "home";
    } else if (pct(away.record) > pct(home.record) + 0.2) favorite = "away";
    return {
      id: e.id, date: e.date, status: e.status?.type?.shortDetail || "", name: e.shortName,
      venue: {
        name: c.venue?.fullName || "", city: c.venue?.address?.city || "",
        state: c.venue?.address?.state || "", indoor: !!c.venue?.indoor,
      },
      home, away, line, spread, favorite,
      network: c.broadcasts?.[0]?.names?.[0] || null,
    };
  });
  return { week: d.week?.number, season: d.season?.year, games };
}

type Sched = { date: number; oppName: string; oppRank: number | null }[];
async function schedule(teamId: string): Promise<Sched> {
  try {
    const d = await j(`${ESPN}/teams/${teamId}/schedule`);
    return (d.events || []).map((e: any) => {
      const opp = e.competitions[0].competitors.find((x: any) => x.team?.id !== teamId);
      const rk = opp?.curatedRank?.current;
      return { date: Date.parse(e.date), oppName: opp?.team?.shortDisplayName || "TBD", oppRank: rk && rk <= 25 ? rk : null };
    }).sort((a, b) => a.date - b.date);
  } catch { return []; }
}

async function weather(g: Game): Promise<Weather> {
  if (g.venue.indoor || !g.venue.city) return null;
  try {
    const geo = await j(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(g.venue.city)}&count=5&country_code=US`);
    const hit = (geo.results || []).find((r: any) => !g.venue.state || (r.admin1 || "").length > 0) || geo.results?.[0];
    if (!hit) return null;
    const day = g.date.slice(0, 10);
    const w = await j(`https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}` +
      `&hourly=temperature_2m,precipitation_probability,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph` +
      `&timezone=GMT&start_date=${day}&end_date=${day}`);
    const hour = new Date(g.date).getUTCHours();
    const tempF = Math.round(w.hourly.temperature_2m[hour]);
    const windMph = Math.round(w.hourly.wind_speed_10m[hour]);
    const precipPct = w.hourly.precipitation_probability?.[hour] ?? 0;
    const bits = [`${tempF}°F`, `${windMph} mph wind`, `${precipPct}% precip`];
    return { tempF, windMph, precipPct, summary: bits.join(" · ") };
  } catch { return null; }
}

const DAY = 86400000;

export async function scoreGame(g: Game): Promise<RadarGame> {
  const fav = g[g.favorite], dog = g[g.favorite === "home" ? "away" : "home"];
  const kick = Date.parse(g.date);
  const [fs, ds, wx] = await Promise.all([schedule(fav.id), schedule(dog.id), weather(g)]);
  const favPrevG = fs.filter(s => s.date < kick - DAY / 2).at(-1);
  const favNextG = fs.find(s => s.date > kick + DAY / 2);
  const dogPrevG = ds.filter(s => s.date < kick - DAY / 2).at(-1);
  const f: Factor[] = [];

  if (favNextG?.oppRank) f.push({ key: "lookahead", label: "Look-ahead", points: 22,
    detail: `${fav.short} gets #${favNextG.oppRank} ${favNextG.oppName} next week` });
  if (favPrevG?.oppRank) f.push({ key: "letdown", label: "Letdown", points: 15,
    detail: `Coming off #${favPrevG.oppRank} ${favPrevG.oppName}` });
  if (favPrevG?.oppRank && favNextG?.oppRank) f.push({ key: "sandwich", label: "Sandwich", points: 10,
    detail: "Stuck between two ranked opponents — classic trap" });
  if (g.favorite === "away") f.push({ key: "road", label: "Road favorite", points: 12,
    detail: `${fav.short} travels to ${g.venue.city || "a hostile venue"}` });
  const favRest = favPrevG ? Math.round((kick - favPrevG.date) / DAY) : null;
  const dogRest = dogPrevG ? Math.round((kick - dogPrevG.date) / DAY) : null;
  if (favRest !== null && favRest < 6) f.push({ key: "shortrest", label: "Short week", points: 10,
    detail: `${fav.short} on ${favRest} days rest` });
  if (dogRest !== null && dogRest >= 12) f.push({ key: "dogbye", label: "Underdog off bye", points: 10,
    detail: `${dog.short} has had ${dogRest} days to prepare` });
  if (!dogPrevG && fs.length && ds.length === 0) {/* no data */}
  if (wx && (wx.windMph >= 15 || wx.precipPct >= 50 || wx.tempF <= 35)) f.push({ key: "weather", label: "Chaos weather", points: 12,
    detail: `${wx.summary} — variance goes up, spreads shrink` });
  const kickHourET = (new Date(kick).getUTCHours() - 4 + 24) % 24;
  if (g.favorite === "away" && kickHourET >= 19) f.push({ key: "night", label: "Road night game", points: 6,
    detail: "Night kick in someone else's building" });
  if (g.spread !== null) {
    if (g.spread >= 3 && g.spread <= 14) f.push({ key: "spread", label: "Live spread", points: 10, detail: `Only ${g.spread} points — within striking distance` });
    else if (g.spread >= 24) f.push({ key: "spread", label: "Big number", points: -12, detail: `${g.spread}-point spread is a lot of cushion` });
  }
  if (!dog.rank && pct(dog.record) >= 0.66 && dog.record !== "0-0") f.push({ key: "hotdog", label: "Hot underdog", points: 8,
    detail: `${dog.short} is ${dog.record} and nobody's talking about it` });

  const score = Math.max(0, Math.min(100, f.reduce((s, x) => s + x.points, 8)));
  const tier = score >= 45 ? "TRAP" : score >= 25 ? "WATCH" : "SAFE";
  return {
    ...g, score, tier, factors: f.sort((a, b) => b.points - a.points), weather: wx,
    favPrev: favPrevG ? `${favPrevG.oppRank ? "#" + favPrevG.oppRank + " " : ""}${favPrevG.oppName}` : null,
    favNext: favNextG ? `${favNextG.oppRank ? "#" + favNextG.oppRank + " " : ""}${favNextG.oppName}` : null,
  };
}

export async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}
