import type { Game } from "./data";
import { fmtSpread } from "./data";

// Free-tier Gemini; busy or retired models fall through to the next.
const MODELS = [
  ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
  "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.8-flash-lite", "gemini-flash-lite-latest",
];

export type Brief = {
  headline: string; verdict: "FADE" | "WATCH" | "HOLD"; upsetChance: number; take: string;
  why: string[]; dogCase: string; xFactor: string; coachSpeak: string;
};

export function briefPrompt(g: Game) {
  const fav = g[g.favorite], dog = g[g.favorite === "home" ? "away" : "home"];
  const facts = {
    matchup: `${g.away.name} (${g.away.record}${g.away.rank ? ", #" + g.away.rank : ""}) at ${g.home.name} (${g.home.record}${g.home.rank ? ", #" + g.home.rank : ""})`,
    favorite: fav.name, underdog: dog.name, consensusLine: g.line, total: g.total,
    openingFavSpread: fmtSpread(g.openFav), currentFavSpread: fmtSpread(g.nowFav),
    booksTracked: g.books.map((b) => b.book), betsTracked: g.bets,
    booksImpliedFavWin: g.bookFavProb != null ? Math.round(g.bookFavProb * 100) + "%" : null,
    kalshiFavWin: g.kalshi ? Math.round(g.kalshi[g.favorite] * 100) + "%" : null,
    espnFpiFavWin: g.fpi ? Math.round(g.fpi[g.favorite]) + "%" : null,
    venue: `${g.venue.name}, ${g.venue.city} ${g.venue.state}`, kickoffUTC: g.date, tv: g.network,
    weather: g.weather?.summary || (g.venue.indoor ? "indoors" : "unknown"),
    favoriteLastWeek: g.favPrev, favoriteNextWeek: g.favNext, favoriteRestDays: g.favRest, underdogRestDays: g.dogRest,
    tapeScore: g.score, signals: g.factors.map((f) => `${f.label}: ${f.detail} (${f.points > 0 ? "+" : ""}${f.points})`),
  };
  return `You are TapeDog, a college football film-room analyst who hunts for favorites worth fading. Voice: confident, dry, a little funny, never corny. No emojis.

Situational data (JSON):
${JSON.stringify(facts, null, 2)}

Use only these facts plus widely known college football context. Do not invent injuries, stats, or quotes. Respond with ONLY this JSON object:
{
  "headline": "6-10 word headline",
  "verdict": "FADE" | "WATCH" | "HOLD",
  "upsetChance": integer 1-60,
  "take": "2-3 sentence core read",
  "why": ["exactly 3 short reasons tied to the data"],
  "dogCase": "one sentence: the path for the underdog",
  "xFactor": "one thing that flips the game",
  "coachSpeak": "one-line warning the favorite's coach should give the locker room"
}`;
}

export async function gemini(prompt: string): Promise<Brief> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("AI briefs are offline: GEMINI_API_KEY is not set.");
  let lastErr = "AI request failed";
  for (const model of MODELS) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.7, maxOutputTokens: 4096 },
      }),
      cache: "no-store",
    });
    const body = await r.json().catch(() => ({}));
    if (r.ok) {
      const text: string = (body.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("");
      return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    }
    lastErr = body.error?.message || lastErr;
    if (![404, 429, 500, 503].includes(r.status)) break;
  }
  throw new Error(lastErr);
}
