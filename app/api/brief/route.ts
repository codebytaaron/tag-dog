import { NextResponse } from "next/server";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "Set GEMINI_API_KEY (free at aistudio.google.com) to unlock AI scouting briefs." }, { status: 503 });
  const g = await req.json();
  const fav = g[g.favorite], dog = g[g.favorite === "home" ? "away" : "home"];
  const facts = {
    matchup: `${g.away.name} (${g.away.record}${g.away.rank ? ", #" + g.away.rank : ""}) at ${g.home.name} (${g.home.record}${g.home.rank ? ", #" + g.home.rank : ""})`,
    favorite: fav.name, underdog: dog.name, line: g.line, venue: `${g.venue.name}, ${g.venue.city} ${g.venue.state}`,
    kickoff: g.date, weather: g.weather?.summary || (g.venue.indoor ? "indoors" : "unknown"),
    favoriteLastGame: g.favPrev, favoriteNextGame: g.favNext,
    trapScore: g.score, flaggedFactors: g.factors.map((f: any) => `${f.label}: ${f.detail} (${f.points > 0 ? "+" : ""}${f.points})`),
  };
  const prompt = `You are a sharp, slightly irreverent college football analyst who specializes in spotting trap games — spots where a favorite is set up to stumble because of scheduling, travel, weather, or motivation.

Here is the situational data our radar computed (JSON):
${JSON.stringify(facts, null, 2)}

Write a trap-game scouting brief. Only use the facts provided plus general, well-known college football context; do not invent injuries, stats, or quotes. Respond with ONLY a JSON object, no markdown fences:
{
  "headline": "punchy 6-10 word headline",
  "verdict": "TRAP" | "WATCH" | "SAFE",
  "upsetChance": integer 1-60 (your gut estimate of outright upset %),
  "take": "2-3 sentence core take",
  "why": ["3 short bullet reasons tied to the data"],
  "xFactor": "one thing that would flip the game",
  "coachSpeak": "a one-line fake-but-plausible warning the favorite's coach should give the locker room"
}`;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.7, maxOutputTokens: 4096 },
      }),
    });
    const d = await r.json();
    if (!r.ok) return NextResponse.json({ error: d.error?.message || "AI request failed" }, { status: 502 });
    const text: string = (d.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("");
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
