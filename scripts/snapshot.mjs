// Forward test: save TapeDog's call on every game before kickoff, so it can be graded honestly afterward.
// Runs on a schedule (GitHub Actions) and writes picks.json on the "data" branch. A game's call is frozen
// once it kicks off: nothing after kickoff can change it.
import fs from "node:fs";

const FILE = process.argv[2] || "picks.json";
const db = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : { since: new Date().toISOString(), picks: {} };

const r = await fetch("https://tapedog.vercel.app/api/slate", { headers: { "user-agent": "TapeDog snapshot" } });
if (!r.ok) { console.log("slate unavailable", r.status); process.exit(0); }
const s = await r.json();
const now = Date.now();
let changed = 0;
for (const g of s.games || []) {
  const kick = Date.parse(g.date);
  if (g.state !== "pre" || kick <= now) continue;          // frozen at kickoff
  if (kick - now > 6 * 86400000) continue;                  // only this week's slate
  const fav = g[g.favorite], dog = g[g.favorite === "home" ? "away" : "home"];
  const row = {
    id: g.id, date: g.date, week: s.week, season: s.season, favHome: g.favorite === "home",
    fav: { id: fav.id, short: fav.short, abbr: fav.abbr, logo: fav.logo }, dog: { id: dog.id, short: dog.short, abbr: dog.abbr, logo: dog.logo },
    line: g.line, spread: g.spread, score: g.score, tier: g.tier, upsetPct: g.upsetPct, savedAt: new Date().toISOString(),
  };
  const old = db.picks[g.id];
  if (!old || old.score !== row.score || old.tier !== row.tier || old.line !== row.line || old.upsetPct !== row.upsetPct) {
    db.picks[g.id] = row; changed++;
  }
}
if (changed) fs.writeFileSync(FILE, JSON.stringify(db, null, 1));
console.log(`updated ${changed} picks, ${Object.keys(db.picks).length} total`);
