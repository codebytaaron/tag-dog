// Current Top 25 from ESPN's rankings feed: CFP rankings once they exist, otherwise the AP poll.
// Used whenever game data comes back without ranks (ESPN drops them between poll releases).
const URL = "https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings";

export function parseRanks(d: any): Record<string, number> {
  const polls = d?.rankings || [];
  const poll = polls.find((r: any) => /playoff|cfp/i.test(r.name || "")) || polls.find((r: any) => /^AP/i.test(r.name || "")) || polls[0];
  const out: Record<string, number> = {};
  for (const x of poll?.ranks || []) if (x.team?.id && x.current <= 25) out[x.team.id] = x.current;
  return out;
}

export async function getRanks(): Promise<Record<string, number>> {
  try {
    const r = await fetch(URL, { next: { revalidate: 1800 } });
    return r.ok ? parseRanks(await r.json()) : {};
  } catch { return {}; }
}

// Browser: fetched once per visit, straight from ESPN.
let client: Promise<Record<string, number>> | null = null;
export function getRanksClient() {
  return (client ||= fetch(URL).then((r) => (r.ok ? r.json() : {})).then(parseRanks).catch(() => ({})));
}
