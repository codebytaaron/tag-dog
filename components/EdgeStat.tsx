import Link from "next/link";
import type { Edge } from "@/lib/edge";

// Our headline stat, compared with what the betting lines expected for the same games (not with all favorites,
// which would flatter us because flagged games tend to have closer spreads).
export default function EdgeStat({ e, link = true }: { e: Edge; link?: boolean }) {
  const body = (
    <>
      <div className="edge-nums">
        <div><b className="edge-x">{e.fadePct}%</b><span>of our flagged favorites lost</span></div>
        <div><b className="edge-y">{e.expPct}%</b><span>expected by the betting lines</span></div>
      </div>
      <p className="edge-t">
        {e.fadeN} games, {e.year} season. With a sample this small the true rate could be anywhere from {e.lo}% to {e.hi}%, so treat it as early evidence.
        Graded after the fact using only pregame information; our live record, frozen at kickoff, is building now.
      </p>
    </>
  );
  return link ? <Link href="/record" className="edge">{body}</Link> : <div className="edge">{body}</div>;
}
