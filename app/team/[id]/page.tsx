import Link from "next/link";
import { notFound } from "next/navigation";
import { getSlate } from "@/lib/data";
import Kickoff from "@/components/Kickoff";
import Ring from "@/components/Ring";
import Highlights from "@/components/Highlights";
import { getRecap } from "@/lib/recap";
import { getFutures, getPolls, getStandings, teamNews } from "@/lib/pulse";
import { FollowButton } from "@/components/SaveButton";
import { darkJson, readable } from "@/lib/espn";

export const revalidate = 60;
export const maxDuration = 60;
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";

async function load(id: string) {
  const get = (u: string, rv: number) => fetch(u, { next: { revalidate: rv } }).then((r) => (r.ok ? darkJson(r) : null)).catch(() => null);
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
  const color = readable("#" + (team.color || "444444"), team.alternateColor ? "#" + team.alternateColor : undefined);
  const record = team.record?.items?.[0]?.summary || "0-0";
  const rank = team.rank && team.rank <= 25 ? team.rank : null;
  const onSlate = slate.games.find((g) => g.home.id === id || g.away.id === id);
  const slateIds = new Set(slate.games.map((g) => g.id));
  const isFav = onSlate ? onSlate[onSlate.favorite].id === id : false;
  const last = [...games].reverse().find((g: any) => g.state === "post");
  const recap = last ? await getRecap(last.id) : null;
  const [fut, polls, stands, news] = await Promise.all([getFutures(), getPolls(), getStandings(), teamNews(id)]);
  const pct = (s: any) => { const m = s?.markets?.find((x: any) => x.team?.id === id); return m ? Math.round(m.p * 100) : null; };
  const apRow = polls[0]?.rows.find((r) => r.team.id === id);
  let standing: { conf: string; place: number; rec: string; streak: string } | null = null;
  for (const s of stands) { const i = s.rows.findIndex((r) => r.team.id === id); if (i >= 0) { standing = { conf: s.short, place: i + 1, rec: s.rows[i].conf, streak: s.rows[i].streak }; break; } }
  const confPct = Object.values(fut.conf).map(pct).find((v) => v != null) ?? null;
  const ord = (n: number) => `${n}${["th", "st", "nd", "rd"][((n % 100) - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th"}`;
  const outlook = [
    { l: "AP POLL", v: apRow ? `#${apRow.rank}` : "Unranked", s: apRow?.prev && apRow.prev !== apRow.rank ? `${apRow.prev > apRow.rank ? "▲" : "▼"} from #${apRow.prev}` : apRow ? "No change" : "" },
    { l: "NATIONAL TITLE", v: pct(fut.title) != null ? `${pct(fut.title)}%` : "–", s: "Kalshi" },
    { l: "MAKE THE PLAYOFF", v: pct(fut.playoff) != null ? `${pct(fut.playoff)}%` : "–", s: "Kalshi" },
    { l: "CONFERENCE TITLE", v: confPct != null ? `${confPct}%` : "–", s: standing?.conf?.toUpperCase() || "" },
    { l: "CONFERENCE", v: standing ? standing.rec : "–", s: standing ? `${ord(standing.place)} in ${standing.conf.toUpperCase()}` : "" },
    { l: "STREAK", v: standing?.streak || "–", s: "" },
  ];

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

      {recap && (
        <div className="wrap latest">
          <section className="card">
            <div className="cardh"><h3>Latest result</h3><Link href={`/game/${recap.id}`} className="mono c-tape small">FULL RECAP →</Link></div>
            <div className="lrgrid">
              <div className="lrl">
                <Link href={`/game/${recap.id}`} className="lrscore">
                  <span className={recap.away.winner ? "w" : ""}>{recap.away.logo && <img src={recap.away.logo} alt="" />}{recap.away.abbr} <b>{recap.away.score}</b></span>
                  <span className={recap.home.winner ? "w" : ""}>{recap.home.logo && <img src={recap.home.logo} alt="" />}{recap.home.abbr} <b>{recap.home.score}</b></span>
                </Link>
                <div className="mono muted small">FINAL{recap.upset ? " · " : ""}{recap.upset && <em className="upset-tag">UPSET</em>}{recap.ats ? ` · ${recap.ats.toUpperCase()}` : ""}</div>
                {recap.article && <p className="lrh">{recap.article.headline}</p>}
                {recap.leaders.filter((l) => recap[l.side].id === id).slice(0, 3).map((l) => (
                  <div key={l.cat} className="ld"><span className="mono muted">{l.cat.replace(/ yards/i, "").toUpperCase()}</span><b>{l.name}</b><small>{l.value}</small></div>
                ))}
              </div>
              <Highlights videos={recap.videos.slice(0, 5)} fallback={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${recap.away.name} vs ${recap.home.name} highlights`)}`} />
            </div>
          </section>
        </div>
      )}
      <div className="wrap latest">
        <section className="card">
          <div className="cardh"><h3>Season outlook</h3><Link href="/rankings" className="mono c-tape small">ALL RANKINGS & ODDS →</Link></div>
          <div className="outlook">
            {outlook.map((o) => <div key={o.l}><span className="mono">{o.l}</span><b>{o.v}</b>{o.s && <small className="mono">{o.s}</small>}</div>)}
          </div>
          {news.length > 0 && (
            <>
              <h4 className="gtitle mono">LATEST {team.location.toUpperCase()} NEWS</h4>
              <ul className="heads">
                {news.map((n: any) => <li key={n.url}><a href={n.url} target="_blank" rel="noreferrer"><b>{n.headline}</b><span className="mono muted">ESPN ↗</span></a></li>)}
              </ul>
            </>
          )}
        </section>
      </div>
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
