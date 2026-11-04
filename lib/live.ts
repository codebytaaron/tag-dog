// Live scores from ESPN's scoreboard (server side, cached ~15s). Browsers poll ESPN directly via liveParse.
import { darkJson } from "./espn";
import { parseScoreboard, SCOREBOARD, type Live } from "./liveParse";
import { getRanks } from "./ranks";

export type { Live, LT } from "./liveParse";

export async function getLive(): Promise<Record<string, Live>> {
  try {
    const [r, ranks] = await Promise.all([fetch(SCOREBOARD, { next: { revalidate: 15 } }), getRanks()]);
    if (!r.ok) return {};
    return parseScoreboard(await darkJson(r), ranks);
  } catch { return {}; }
}
