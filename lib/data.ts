// TapeDog data layer. Every source here is free and keyless:
// ESPN (scoreboard, schedules, FPI, news), Action Network (multi-book lines, bet counts),
// Kalshi (prediction-market prices), Open-Meteo (geocoding + kickoff forecast).
import { unstable_cache } from "next/cache";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";
const AN_URL = "https://api.actionnetwork.com/web/v1/scoreboard/ncaaf?period=game&division=FBS&bookIds=15,30,68,69,71,75,79,123";
const KALSHI_URL = "https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXNCAAFGAME&status=open&limit=200&with_nested_markets=true";
const UA = { "user-agent": "Mozilla/5.0 (compatible; TapeDog/1.0)" };
const BOOKS: Record<number, string> = { 68: "DraftKings", 69: "FanDuel", 75: "BetMGM", 123: "Caesars", 79: "bet365", 71: "BetRivers" };
const NATIONAL = ["ABC", "CBS", "FOX", "NBC", "ESPN"];
const DAY = 86400000;

export type Team = {
  id: string; name: string; short: string; location: string; abbr: string; logo: string;
  color: string; alt: string; rank: number | null; record: string; nick: string;
};
export type BookLine = { book: string; spreadHome: number | null; total: number | null; mlHome: number | null; mlAway: number | null };
export type Factor = { key: string; label: string; detail: string; points: number };
export type Weather = { tempF: number; windMph: number; precipPct: number; summary: string } | null;
export type Tier = "FADE" | "WATCH" | "HOLD";
export type Game = {
  id: string; date: string; state: string; status: string;
  venue: { name: string; city: string; state: string; indoor: boolean };
  home: Team; away: Team; favorite: "home" | "away"; spread: number | null; line: string; total: number | null;
  network: string | null; books: BookLine[]; openFav: number | null; nowFav: number | null; bets: number;
  bookFavProb: number | null; kalshi: { home: number; away: number; volume: number; tickers?: { home: string; away: string } } | null;
  fpi: { home: number; away: number } | null; weather: Weather;
  favPrev: string | null; favNext: string | null; favRest: number | null; dogRest: number | null;
  factors: Factor[]; score: number; tier: Tier; heat: number; watch: number;
};
export type Slate = { season: number | null; week: number | null; updated: string; games: Game[] };

async function j(url: string, revalidate = 900, headers?: Record<string, string>) {
  const r = await fetch(url, { next: { revalidate }, headers });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return darkJson(r);
}
async function safe<T>(p: Promise<T>, fb: T): Promise<T> {
  try { return await p; } catch { return fb; }
}
export async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}
const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z]/g, "");
const pct = (rec: string) => { const [w, l] = rec.split("-").map(Number); return w + l ? w / (w + l) : 0.5; };
export const implied = (ml: number | null) => (ml == null ? null : ml < 0 ? -ml / (-ml + 100) : 100 / (ml + 100));
export const fmtSpread = (n: number | null) => (n == null ? "–" : n === 0 ? "PK" : (n > 0 ? "+" : "") + n);
export const fmtML = (n: number | null) => (n == null ? "–" : (n > 0 ? "+" : "") + n);

function toTeam(c: any): Team {
  const t = c?.team || {};
  const rk = c?.curatedRank?.current;
  return {
    id: t.id, name: t.displayName || "TBD", short: t.shortDisplayName || t.name || "TBD",
    location: t.location || t.shortDisplayName || "", nick: t.name || "", abbr: t.abbreviation || "",
    logo: t.logo || t.logos?.[0]?.href || "", color: readable("#" + (t.color || "3a3a3a"), t.alternateColor ? "#" + t.alternateColor : undefined), alt: "#" + (t.alternateColor || "1a1a1a"),
    rank: rk && rk <= 25 ? rk : null, record: c?.records?.[0]?.summary || "0-0",
  };
}

type Sched = { date: number; oppName: string; oppRank: number | null }[];
async function schedule(teamId: string): Promise<Sched> {
  const d = await safe(j(`${ESPN}/teams/${teamId}/schedule`, 3600), { events: [] });
  return (d.events || []).map((e: any) => {
    const opp = e.competitions?.[0]?.competitors?.find((x: any) => x.team?.id !== teamId);
    const rk = opp?.curatedRank?.current;
    return { date: Date.parse(e.date), oppName: opp?.team?.shortDisplayName || "TBD", oppRank: rk && rk <= 25 ? rk : null };
  }).sort((a: any, b: any) => a.date - b.date);
}

const STATES: Record<string, string> = { AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia" };

async function weather(date: string, v: Game["venue"]): Promise<Weather> {
  if (v.indoor || !v.city) return null;
  try {
    const geo = await j(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(v.city)}&count=10&country_code=US`, 86400);
    const want = STATES[v.state] || v.state;
    const hit = (geo.results || []).find((r: any) => r.admin1 === want) || geo.results?.[0];
    if (!hit) return null;
    const day = date.slice(0, 10);
    const w = await j(`https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}` +
      `&hourly=temperature_2m,precipitation_probability,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph` +
      `&timezone=GMT&start_date=${day}&end_date=${day}`, 3600);
    const h = new Date(date).getUTCHours();
    const tempF = Math.round(w.hourly.temperature_2m[h]);
    const windMph = Math.round(w.hourly.wind_speed_10m[h]);
    const precipPct = w.hourly.precipitation_probability?.[h] ?? 0;
    if (Number.isNaN(tempF)) return null;
    return { tempF, windMph, precipPct, summary: `${tempF}°F · ${windMph} mph · ${precipPct}% rain` };
  } catch { return null; }
}

function matchAN(list: any[], b: any) {
  const kick = Date.parse(b.date);
  const near = list.filter((a) => Math.abs(Date.parse(a.start_time) - kick) < 8 * 3600000);
  const team = (a: any, id: number) => a.teams?.find((t: any) => t.id === id);
  const hit = (t: any, x: Team) => !!t && (norm(t.full_name) === norm(x.name) || t.abbr === x.abbr ||
    norm(t.display_name) === norm(x.short) || norm(t.location) === norm(x.location));
  return near.find((a) => hit(team(a, a.home_team_id), b.home) && hit(team(a, a.away_team_id), b.away)) || null;
}

type KEvent = { markets: { team: string; price: number; vol: number; ticker: string }[] };
function matchKalshi(evs: KEvent[], b: any) {
  const h = [norm(b.home.location), norm(b.home.short)], a = [norm(b.away.location), norm(b.away.short)];
  for (const e of evs) {
    const mh = e.markets.find((m) => h.includes(m.team)), ma = e.markets.find((m) => a.includes(m.team));
    if (mh && ma && mh.price + ma.price > 0) {
      const s = mh.price + ma.price;
      return { home: mh.price / s, away: ma.price / s, volume: Math.round(mh.vol + ma.vol), tickers: { home: mh.ticker, away: ma.ticker } };
    }
  }
  return null;
}

function parseEvent(e: any) {
  const c = e.competitions[0];
  return {
    id: e.id, date: e.date, state: e.status?.type?.state || "pre", status: e.status?.type?.shortDetail || "",
    venue: { name: c.venue?.fullName || "", city: c.venue?.address?.city || "", state: c.venue?.address?.state || "", indoor: !!c.venue?.indoor },
    home: toTeam(c.competitors.find((x: any) => x.homeAway === "home")),
    away: toTeam(c.competitors.find((x: any) => x.homeAway === "away")),
    network: c.broadcasts?.[0]?.names?.[0] || null,
    espnLine: c.odds?.[0]?.details || null, espnTotal: c.odds?.[0]?.overUnder ?? null,
  };
}

async function enrich(b: any, an: any[], ks: KEvent[]): Promise<Game> {
  const ag = matchAN(an, b);
  const books: BookLine[] = [];
  let openH: number | null = null, consH: number | null = null, total: number | null = b.espnTotal, ml: [number | null, number | null] = [null, null];
  for (const o of ag?.odds || []) {
    if (o.type && o.type !== "game") continue;
    const l: BookLine = { book: BOOKS[o.book_id], spreadHome: o.spread_home ?? null, total: o.total ?? null, mlHome: o.ml_home ?? null, mlAway: o.ml_away ?? null };
    if (o.book_id === 30) openH = l.spreadHome;
    else if (o.book_id === 15) { consH = l.spreadHome; total = l.total ?? total; ml = [l.mlHome, l.mlAway]; }
    else if (l.book) books.push(l);
  }
  if (consH == null && books.length) { consH = books[0].spreadHome; total = books[0].total ?? total; ml = [books[0].mlHome, books[0].mlAway]; }

  let favorite: "home" | "away" = "home";
  let spread: number | null = null;
  if (consH != null && consH !== 0) { favorite = consH < 0 ? "home" : "away"; spread = Math.abs(consH); }
  else if (ml[0] != null && ml[1] != null) { favorite = ml[0] <= ml[1] ? "home" : "away"; spread = consH === 0 ? 0 : null; }
  else {
    const m = b.espnLine?.match(/^([A-Z&]+)\s+(-?\d+(\.\d+)?)/);
    if (m) { favorite = m[1] === b.away.abbr ? "away" : "home"; spread = Math.abs(parseFloat(m[2])); }
    else if (b.home.rank || b.away.rank) favorite = (b.away.rank ?? 99) < (b.home.rank ?? 99) ? "away" : "home";
    else if (pct(b.away.record) > pct(b.home.record) + 0.2) favorite = "away";
  }
  const fav: Team = b[favorite], dog: Team = b[favorite === "home" ? "away" : "home"];
  const kick = Date.parse(b.date);

  const [fs, ds, wx, sum] = await Promise.all([
    schedule(fav.id), schedule(dog.id), weather(b.date, b.venue), safe(j(`${ESPN}/summary?event=${b.id}`, 1800), null),
  ]);
  let fpi: Game["fpi"] = null;
  const p = sum?.predictor;
  if (p?.homeTeam?.gameProjection) {
    const hp = parseFloat(p.homeTeam.gameProjection), ap = parseFloat(p.awayTeam?.gameProjection);
    if (!Number.isNaN(hp) && !Number.isNaN(ap)) fpi = p.homeTeam.id === b.home.id ? { home: hp, away: ap } : { home: ap, away: hp };
  }
  const kalshi = matchKalshi(ks, b);
  const favML = favorite === "home" ? ml[0] : ml[1], dogML = favorite === "home" ? ml[1] : ml[0];
  const pf = implied(favML), pd = implied(dogML);
  const bookFavProb = pf != null && pd != null ? pf / (pf + pd) : null;

  const prev = fs.filter((s) => s.date < kick - DAY / 2).at(-1);
  const next = fs.find((s) => s.date > kick + DAY / 2);
  const dprev = ds.filter((s) => s.date < kick - DAY / 2).at(-1);
  const favRest = prev ? Math.round((kick - prev.date) / DAY) : null;
  const dogRest = dprev ? Math.round((kick - dprev.date) / DAY) : null;
  const toFav = (h: number | null) => (h == null ? null : favorite === "home" ? h : -h);
  const openFav = toFav(openH), nowFav = toFav(consH);

  const f: Factor[] = [];
  const add = (key: string, label: string, points: number, detail: string) => f.push({ key, label, points, detail });
  if (next?.oppRank) add("lookahead", "Look-ahead", 20, `${fav.short} sees #${next.oppRank} ${next.oppName} next week`);
  if (prev?.oppRank) add("letdown", "Letdown", 14, `${fav.short} is coming off #${prev.oppRank} ${prev.oppName}`);
  if (prev?.oppRank && next?.oppRank) add("sandwich", "Sandwich", 10, "Ranked opponent on both sides of this one");
  if (favorite === "away") add("road", "Road favorite", 10, `${fav.short} has to win in ${b.venue.city || "a road building"}`);
  const etHour = (new Date(kick).getUTCHours() + 20) % 24;
  if (favorite === "away" && etHour >= 19) add("night", "Road night game", 5, "Night kick in someone else's stadium");
  if (favRest != null && favRest < 6) add("shortrest", "Short week", 8, `${fav.short} on ${favRest} days rest`);
  if (dogRest != null && dogRest >= 12) add("dogbye", "Dog off a bye", 8, `${dog.short} has had ${dogRest} days to prep`);
  if (wx && (wx.windMph >= 15 || wx.precipPct >= 50 || wx.tempF <= 35)) add("weather", "Chaos weather", 10, `${wx.summary} at kickoff`);
  if (openFav != null && nowFav != null) {
    const move = nowFav - openFav;
    if (move >= 1.5) add("steam", "Line sliding to dog", 12, `Opened ${fav.abbr} ${fmtSpread(openFav)}, now ${fmtSpread(nowFav)}`);
    else if (move <= -2) add("favsteam", "Money on the fav", -6, `Opened ${fav.abbr} ${fmtSpread(openFav)}, now ${fmtSpread(nowFav)}`);
  }
  if (kalshi && bookFavProb != null && bookFavProb - kalshi[favorite] >= 0.05)
    add("kalshi", "Market doubt", 8, `Kalshi has ${fav.short} at ${Math.round(kalshi[favorite] * 100)}%, books imply ${Math.round(bookFavProb * 100)}%`);
  if (fpi) {
    const ff = fpi[favorite];
    if (ff < 50) add("fpi", "Model dissent", 16, `ESPN FPI actually likes ${dog.short} (${Math.round(100 - ff)}%)`);
    else if (ff < 62 && (spread ?? 0) >= 7) add("fpi", "Model says closer", 7, `FPI only ${Math.round(ff)}% on ${fav.short} despite a ${spread}-pt line`);
  }
  if (spread != null) {
    if (spread >= 3 && spread <= 14) add("spread", "Live number", 8, `${spread} points is within one bad quarter`);
    else if (spread >= 24) add("spread", "Big cushion", -12, `${spread} points is a lot of room`);
  }
  if (!dog.rank && dog.record !== "0-0" && pct(dog.record) >= 0.66) add("hotdog", "Live dog", 6, `${dog.short} is ${dog.record} and flying under the radar`);

  const score = Math.max(0, Math.min(99, f.reduce((s, x) => s + x.points, 5)));
  const tier: Tier = score >= 50 ? "FADE" : score >= 28 ? "WATCH" : "HOLD";
  const bets = ag?.num_bets || 0;
  const heat = bets / 800 + (kalshi?.volume || 0) / 25000 + (b.home.rank ? 12 : 0) + (b.away.rank ? 12 : 0) +
    (b.home.rank && b.away.rank ? 10 : 0) + (NATIONAL.includes(b.network) ? 8 : 0) + (spread != null && spread < 7 ? 5 : 0);
  const line = spread == null ? "No line" : spread === 0 ? "PK" : `${fav.abbr} -${spread}`;
  const tag = (s: any) => (s ? `${s.oppRank ? "#" + s.oppRank + " " : ""}${s.oppName}` : null);

  return {
    id: b.id, date: b.date, state: b.state, status: b.status, venue: b.venue, home: b.home, away: b.away,
    favorite, spread, line, total, network: b.network, books, openFav, nowFav, bets, bookFavProb, kalshi, fpi,
    weather: wx, favPrev: tag(prev), favNext: tag(next), favRest, dogRest,
    factors: f.sort((a, c) => c.points - a.points), score, tier, heat, watch: 0,
  };
}

async function buildSlate(): Promise<Slate> {
  const [sb, an, ks] = await Promise.all([
    j(`${ESPN}/scoreboard?groups=80&limit=300`, 600),
    safe(j(AN_URL, 600, UA), { games: [] }),
    safe(j(KALSHI_URL, 600), { events: [] }),
  ]);
  const kev: KEvent[] = (ks.events || []).map((e: any) => ({
    markets: (e.markets || []).map((m: any) => ({
      team: norm(m.yes_sub_title), ticker: m.ticker || "", price: parseFloat(m.last_price_dollars || m.yes_bid_dollars || "0") || 0, vol: parseFloat(m.volume_fp || "0") || 0,
    })),
  }));
  const games = await pool((sb.events || []).map(parseEvent), 12, (b) => enrich(b, an.games || [], kev));
  const max = Math.max(1, ...games.map((g) => g.heat));
  games.forEach((g) => { g.heat = Math.round((g.heat / max) * 100); });
  // Watchability: close line + big names + buzz + upset potential.
  games.forEach((g) => {
    const close = g.spread == null ? 0.35 : Math.max(0, 1 - g.spread / 24);
    const ranked = (g.home.rank ? 1 : 0) + (g.away.rank ? 1 : 0);
    g.watch = Math.min(99, Math.round(close * 45 + g.heat * 0.3 + ranked * 8 + (g.tier === "FADE" ? 8 : g.tier === "WATCH" ? 4 : 0)));
  });
  return { season: sb.season?.year ?? null, week: sb.week?.number ?? null, updated: new Date().toISOString(), games };
}

function parseK(ks: any): KEvent[] {
  return (ks.events || []).map((e: any) => ({
    markets: (e.markets || []).map((m: any) => ({
      team: norm(m.yes_sub_title), ticker: m.ticker || "", price: parseFloat(m.last_price_dollars || m.yes_bid_dollars || "0") || 0, vol: parseFloat(m.volume_fp || "0") || 0,
    })),
  }));
}

// Fresh odds for one game (20s cache): every book, consensus, opener and Kalshi.
export async function getLiveOdds(g: Game) {
  const [an, ks] = await Promise.all([safe(j(AN_URL, 20, UA), { games: [] }), safe(j(KALSHI_URL, 20), { events: [] })]);
  const ag = matchAN(an.games || [], g);
  const books: BookLine[] = [];
  let openH: number | null = null, consH: number | null = null, total: number | null = g.total, ml: [number | null, number | null] = [null, null];
  for (const o of ag?.odds || []) {
    if (o.type && o.type !== "game") continue;
    const l: BookLine = { book: BOOKS[o.book_id], spreadHome: o.spread_home ?? null, total: o.total ?? null, mlHome: o.ml_home ?? null, mlAway: o.ml_away ?? null };
    if (o.book_id === 30) openH = l.spreadHome;
    else if (o.book_id === 15) { consH = l.spreadHome; total = l.total ?? total; ml = [l.mlHome, l.mlAway]; }
    else if (l.book) books.push(l);
  }
  if (consH == null && books.length) { consH = books[0].spreadHome; total = books[0].total ?? total; ml = [books[0].mlHome, books[0].mlAway]; }
  return { books: books.length ? books : g.books, openH, consH, total, ml, kalshi: matchKalshi(parseK(ks), g) || g.kalshi, bets: ag?.num_bets || g.bets, at: new Date().toISOString() };
}

const cachedSlate = unstable_cache(buildSlate, ["tapedog-slate-v3"], { revalidate: 900 });
export async function getSlate(): Promise<Slate> {
  return safe(cachedSlate(), { season: null, week: null, updated: new Date().toISOString(), games: [] });
}

export type News = { headline: string; description: string; url: string | null; published: string | null };
export async function getGameDetail(id: string) {
  const slate = await getSlate();
  const game = slate.games.find((g) => g.id === id);
  if (!game) return null;
  const sum = await safe(j(`${ESPN}/summary?event=${id}`, 1800), null);
  const news: News[] = (sum?.news?.articles || []).slice(0, 5).map((a: any) => ({
    headline: a.headline, description: a.description || "", url: a.links?.web?.href || null, published: a.published || null,
  }));
  return { game, news, week: slate.week, season: slate.season };
}

// Slim shape for list views so pages stay light.
export type LiteGame = Pick<Game, "id" | "date" | "state" | "status" | "home" | "away" | "favorite" | "line" | "spread" | "total" | "network" | "score" | "tier" | "heat" | "bets" | "kalshi" | "watch" | "factors"> & { signals: string[]; keys: string[] };
export const lite = (g: Game): LiteGame => ({
  id: g.id, date: g.date, state: g.state, status: g.status, home: g.home, away: g.away, favorite: g.favorite,
  line: g.line, spread: g.spread, total: g.total, network: g.network, score: g.score, tier: g.tier, heat: g.heat,
  bets: g.bets, kalshi: g.kalshi, watch: g.watch, factors: g.factors, keys: g.factors.filter((x) => x.points > 0).map((x) => x.key), signals: g.factors.filter((x) => x.points > 0).slice(0, 3).map((x) => x.label),
});
