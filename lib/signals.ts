// Candidate signals: new ideas being tested in the Model Lab before they're allowed to move the TAPE score.
// Each one is rebuilt for past games from data known before kickoff, so it can be checked on two seasons.

const STATES: Record<string, string> = { AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia" };

export type Place = { lat: number; lon: number; tz: string };
export type Venue = { city: string; state: string; indoor: boolean };

const geoCache = new Map<string, Promise<Place | null>>();
export function geocode(city: string, state: string): Promise<Place | null> {
  const key = `${city}|${state}`;
  if (!city) return Promise.resolve(null);
  if (!geoCache.has(key)) {
    geoCache.set(key, fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&country_code=US`, { next: { revalidate: 2592000 } })
      .then((r) => (r.ok ? r.json() : { results: [] }))
      .then((g) => {
        const want = STATES[state] || state;
        const hit = (g.results || []).find((r: any) => r.admin1 === want) || g.results?.[0];
        return hit ? { lat: hit.latitude, lon: hit.longitude, tz: hit.timezone || "" } : null;
      })
      .catch(() => null));
  }
  return geoCache.get(key)!;
}

// Weather at kickoff, from Open-Meteo's archive of past forecasts (what was expected that day, not hindsight).
export async function kickoffWeather(date: string, v: Venue): Promise<{ windMph: number; rainMm: number; tempF: number } | null> {
  if (v.indoor) return null;
  const p = await geocode(v.city, v.state);
  if (!p) return null;
  try {
    const day = date.slice(0, 10);
    const r = await fetch(`https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}` +
      `&hourly=temperature_2m,precipitation,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=GMT&start_date=${day}&end_date=${day}`,
      { next: { revalidate: 2592000 } });
    if (!r.ok) return null;
    const w = await r.json();
    const h = new Date(date).getUTCHours();
    const tempF = w.hourly?.temperature_2m?.[h], windMph = w.hourly?.wind_speed_10m?.[h];
    if (tempF == null || windMph == null) return null;
    return { tempF, windMph, rainMm: w.hourly?.precipitation?.[h] ?? 0 };
  } catch { return null; }
}

export function miles(a: Place, b: Place) {
  const R = 3959, t = Math.PI / 180;
  const dLat = (b.lat - a.lat) * t, dLon = (b.lon - a.lon) * t;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Hours between two US time zones on a given date.
export function tzGap(a: string, b: string, date: string) {
  const off = (tz: string) => {
    try {
      const s = new Date(date).toLocaleString("en-US", { timeZone: tz, timeZoneName: "shortOffset" });
      const m = s.match(/GMT([+-]\d+)/);
      return m ? Number(m[1]) : 0;
    } catch { return 0; }
  };
  return Math.abs(off(a) - off(b));
}

// Traditional rivalries, by ESPN team location. Records and rankings matter less when these two meet.
const RIVALS: [string, string][] = [
  ["Alabama", "Auburn"], ["Ohio State", "Michigan"], ["Georgia", "Florida"], ["Georgia", "Georgia Tech"], ["Florida", "Florida State"],
  ["Florida State", "Miami"], ["Texas", "Oklahoma"], ["Texas", "Texas A&M"], ["USC", "UCLA"], ["USC", "Notre Dame"], ["Stanford", "California"],
  ["Oregon", "Oregon State"], ["Washington", "Washington State"], ["Utah", "BYU"], ["Arizona", "Arizona State"], ["Ole Miss", "Mississippi State"],
  ["LSU", "Alabama"], ["Tennessee", "Alabama"], ["Kentucky", "Louisville"], ["South Carolina", "Clemson"], ["North Carolina", "NC State"],
  ["North Carolina", "Duke"], ["Virginia", "Virginia Tech"], ["Michigan", "Michigan State"], ["Minnesota", "Wisconsin"], ["Iowa", "Iowa State"],
  ["Iowa", "Minnesota"], ["Indiana", "Purdue"], ["Illinois", "Northwestern"], ["Kansas", "Kansas State"], ["Oklahoma", "Oklahoma State"],
  ["Texas Tech", "TCU"], ["Baylor", "TCU"], ["Pittsburgh", "West Virginia"], ["Army", "Navy"], ["Air Force", "Army"], ["Air Force", "Navy"],
  ["Boise State", "Nevada"], ["Colorado", "Colorado State"], ["Penn State", "Pittsburgh"], ["Arkansas", "LSU"], ["Missouri", "Kansas"],
];
const key = (s: string) => (s || "").toLowerCase().replace(/[^a-z]/g, "");
const RIV = new Set(RIVALS.flatMap(([a, b]) => [`${key(a)}-${key(b)}`, `${key(b)}-${key(a)}`]));
export const isRivalry = (a: string, b: string) => RIV.has(`${key(a)}-${key(b)}`);

// Labels used in the Model Lab. None of these add points to the TAPE score yet.
export const CANDIDATES = {
  wind: "Wind 15+ mph",
  wet: "Rain at kickoff",
  cold: "Freezing kickoff",
  trip: "Long trip (1,200+ mi)",
  zones: "2+ time zones",
  rivalry: "Rivalry game",
} as const;
