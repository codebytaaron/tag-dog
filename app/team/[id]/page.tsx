import Link from "next/link";
import { notFound } from "next/navigation";
import { getSlate } from "@/lib/data";
import Kickoff from "@/components/Kickoff";
import Ring from "@/components/Ring";
import { FollowButton } from "@/components/SaveButton";

export const revalidate = 60;
export const maxDuration = 60;
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";

async function load(id: string) {
  const get = (u: string, rv: number) => fetch(u, { next: { revalidate: rv } }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const [t, s] = await Promise.all([get(`${ESPN}/teams/${id}`, 600), get(`${ESPN}/teams/${id}/schedule`, 60)]);
  if (!t?.team) return null;
  const team = t.team;
  const games = (s?.events || []).map((e: any) => {
    const c = e.competitions?.[0] || {};
    const us = c.competitors?.find((x: any) => x.team?.id === id) || {};
    const op = c.competitors?.find((x: any) => x.team?.id !== id) || {};
    const sc = (x: any) => (x?.score?.displayValue ?? x?.score ?? null);
    const rk = op.curatedRank?.current;
    return {
      id: e.id, date: e.date, state: c.status?.type?.state || "pre", detail: c.status?.type?.shortDetail || "",
      home: us.homeAway === "home", win: us.winner === true, loss: op.winner === true,
      us: sc(us), them: sc(op), tv: c.broadcasts?.[0]?.media?.shortName || null,
      opp: { id: op.team?.id, name: op.team?.shortDisplayName || op.team?.displayName || "TBD", logo: op.team?.logos?.[0]?.href || op.team?.logo || "", rank: rk && rk <= 25 ? rk : null },
    };
  });
  return { team, games };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const d = await load((await params).id);
  return { title: d ? `${d.team.displayName} | TapeDog` : "TapeDog" };
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [d, slate] = await Promise.all([load(id), getSlate()]);
  if (!d) notFound();
  const { team, games } = d;
  const color = "#" + (team.color || "444444");
  const record = team.record?.items?.[0]?.summary || "0-0";
  const rank = team.rank && team.rank <= 25 ? team.rank : null;
  const onSlate = slate.games.find((g) => g.home.id === id || g.away.id === id);
  const slateIds = new Set(slate.games.map((g) => g.id));
  const isFav = onSlate ? onSlate[onSlate.favorite].id === id : false;

  return (
    <main>
      <section className="teamhero" style={{ ["--c" as any]: color }}>
        <div className="wrap teamhead">
          <div className="tid">
            <img src={team.logos?.[0]?.href} alt="" />
            <div>
              <div className="eyebrow mono">{rank ? `#${rank} · ` : ""}{team.standingSummary || "College football"}</div>
              <h1 className="btitle">{team.location}</h1>
              <p className="muted">{team.name} · <span className="mono">{record}</span></p>
              <FollowButton team={{ id, name: team.location, logo: team.logos?.[0]?.href || "" }} />
            </div>
          </div>
          {onSlate && (
            <Link href={`/game/${onSlate.id}`} className="thisweek">
              <div className="mono muted">THIS WEEK ON TAPE</div>
              <div className="twrow">
                <Ring score={onSlate.score} tier={onSlate.tier} size={60} />
                <div>
                  <b>{onSlate.away.short} @ {onSlate.home.short}</b>
                  <small className="mono">{onSlate.line} · <Kickoff date={onSlate.date} /></small>
                  <small>{isFav ? `${team.location} is the favorite, ${onSlate.tier === "FADE" ? "and a fade" : onSlate.tier === "WATCH" ? "worth watching" : "in a clean spot"}` : `${team.location} is the underdog`}</small>
                </div>
              </div>
              <span className="go mono">OPEN FILE →</span>
            </Link>
          )}
        </div>
      </section>

      <div className="wrap board">
        <h2 className="gtitle mono">{games.length ? `${new Date().getFullYear()} SCHEDULE` : "SCHEDULE"}</h2>
        <div className="sched">
          {games.map((g: any) => {
            const inner = (
              <>
                <span className="sdate mono"><Kickoff date={g.date} day /></span>
                <span className="sopp">
                  <span className="mono muted">{g.home ? "vs" : "@"}</span>
                  {g.opp.logo ? <img src={g.opp.logo} alt="" /> : <span className="dotc" />}
                  <b>{g.opp.rank && <sup>{g.opp.rank}</sup>}{g.opp.name}</b>
                </span>
                <span className="sres mono">
                  {g.state === "post" ? <><em className={g.win ? "wl w" : g.loss ? "wl l" : "wl"}>{g.win ? "W" : g.loss ? "L" : "T"}</em> {g.us}–{g.them}</>
                    : g.state === "in" ? <span className="livetag"><i />LIVE {g.us}–{g.them}</span>
                    : <span className="muted">{g.tv || "TBA"}</span>}
                </span>
                <span className="sgo">{g.state === "post" ? <em className="mono rcp">▶ RECAP</em> : "→"}</span>
              </>
            );
            return <Link key={g.id} href={`/game/${g.id}`} className="srow link">{inner}</Link>;
          })}
          {games.length === 0 && <div className="empty">No schedule posted yet.</div>}
        </div>
      </div>
    </main>
  );
}
