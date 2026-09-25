# TapeDog

**Find the favorites worth fading.**

TapeDog is a college football trap-game radar. Every FBS favorite on the slate gets a **Tape Score (0–99)** built from the situational stuff box scores miss, then an AI film room writes the scouting report.

- **TA**: built by TA
- **Tape**: film study and scouting
- **Dog**: the underdog

## Pages
- `/`: animated landing page with live games flying across the screen
- `/board`: the Fade Board, Biggest Games (heat index) and Saved games (stored on-device)
- `/game/[id]`: game file with signals, line shop across six books, open-to-now line move, books vs Kalshi vs FPI, schedule runway, weather, ESPN wire and the AI brief
- `/dogzone`: TapeDog Plus (coming soon)
- `/profile`: accounts (coming soon)

## Free data sources (no paid keys)
| Source | Used for |
|---|---|
| ESPN public API | Slate, ranks, records, venues, TV, team schedules, FPI predictor, news |
| Action Network public API | DraftKings, FanDuel, BetMGM, Caesars, bet365, BetRivers lines, opener, consensus, bets tracked |
| Kalshi public API | Prediction-market win prices and volume |
| Open-Meteo | Geocoding and kickoff-hour forecast |
| Google Gemini (free tier) | Film-room scouting briefs |

Everything is cached server-side (slate 15 min, AI briefs 6 h per game), so it runs itself on Vercel's free plan without burning through the Gemini free quota.

## Setup
Vercel env: `GEMINI_API_KEY` (free at aistudio.google.com). Optional: `GEMINI_MODEL`.

_Not betting advice. Just tape._
