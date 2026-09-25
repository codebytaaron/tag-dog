# 🎯 Trap Game Radar

**Which college football favorites are about to get got this Saturday?**

Every FBS game on the slate gets a **Trap Score (0–100)** built from the situational stuff sharps actually care about — then Claude writes a scouting brief for any game you tap.

## What it detects
| Factor | Signal |
|---|---|
| 👀 Look-ahead | Favorite plays a ranked team *next* week |
| 😮‍💨 Letdown | Favorite is coming off a ranked opponent |
| 🥪 Sandwich | Both of the above — the classic trap |
| ✈️ Road favorite / night game | Favored team is traveling, especially under the lights |
| 🛌 Rest edge | Favorite on a short week, or underdog off a bye |
| 🌧️ Chaos weather | Kickoff-hour wind, rain or cold from the live forecast |
| 📏 Live spread | Line is 3–14 (reachable) vs 24+ (cushion) |
| 🔥 Hot underdog | Unranked dog winning quietly |

## APIs
- **ESPN** scoreboard + team schedules (odds, ranks, venues, records)
- **Open-Meteo** geocoding + hourly forecast (kickoff-hour weather at the venue)
- **Anthropic Claude** — structured scouting brief (headline, upset %, reasons, x-factor, coach-speak)

## Run / deploy
```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm run dev
```
Deploy on Vercel: import the repo and add `ANTHROPIC_API_KEY` (optional `ANTHROPIC_MODEL`, defaults to `claude-sonnet-5`). The radar works without a key; only the AI brief needs it.

_Not betting advice. Just vibes with receipts._
