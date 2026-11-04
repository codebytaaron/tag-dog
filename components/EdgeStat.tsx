import Link from "next/link";
import type { Edge } from "@/lib/edge";

// "2.5×": the headline stat, with the honest footnote every time it's shown.
export default function EdgeStat({ e, link = true }: { e: Edge; link?: boolean }) {
  const body = (
    <>
      <b className="edge-x">{e.mult.toFixed(1)}×</b>
      <div className="edge-t">
        <strong>the average favorite upset rate</strong>
        <span>{e.fadePct}% of TapeDog's flagged favorites lost, compared with {e.allPct}% across all {e.allN} games analyzed.</span>
        <small className="mono">{e.year} historical backtest · {e.fadeN} flagged games · not live predictions</small>
      </div>
    </>
  );
  return link ? <Link href="/record" className="edge">{body}</Link> : <div className="edge">{body}</div>;
}
