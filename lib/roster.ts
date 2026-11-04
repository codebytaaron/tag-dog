// Team roster and injury list from ESPN (free, no key).
import { darkJson } from "./espn";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";
export type Player = { id: string; name: string; jersey: string; pos: string; cls: string; ht: string; wt: string; photo: string; status: string };
export type RosterData = { groups: { key: string; label: string; players: Player[] }[]; out: Player[]; coach: string | null };
const LABEL: Record<string, string> = { offense: "Offense", defense: "Defense", specialTeam: "Special teams" };

export async function getRoster(id: string): Promise<RosterData | null> {
  try {
    const r = await fetch(`${ESPN}/teams/${id}/roster`, { next: { revalidate: 21600 } });
    if (!r.ok) return null;
    const d = await darkJson(r);
    const map = (a: any): Player => ({
      id: String(a.id), name: a.fullName || a.displayName || "", jersey: a.jersey || "", pos: a.position?.abbreviation || "",
      cls: a.experience?.abbreviation || "", ht: a.displayHeight || "", wt: a.displayWeight || "", photo: a.headshot?.href || "",
      status: a.injuries?.[0]?.status || "",
    });
    const groups = (d.athletes || []).filter((g: any) => LABEL[g.position]).map((g: any) => ({ key: g.position, label: LABEL[g.position], players: (g.items || []).map(map) }));
    const out = (d.athletes || []).filter((g: any) => g.position === "injuredReserveOrOut" || g.position === "suspended")
      .flatMap((g: any) => (g.items || []).map((a: any) => ({ ...map(a), status: g.position === "suspended" ? "Suspended" : a.injuries?.[0]?.status || "Out" })));
    const c = d.coach?.[0];
    return { groups, out, coach: c ? `${c.firstName} ${c.lastName}` : null };
  } catch { return null; }
}
