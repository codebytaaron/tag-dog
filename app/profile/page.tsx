import Link from "next/link";
export const metadata = { title: "Profile — TapeDog" };

export default function Profile() {
  return (
    <main className="wrap soon">
      <div className="pcard">
        <div className="pav">TA</div>
        <div>
          <div className="eyebrow mono">PROFILE · COMING SOON</div>
          <h1 className="big">Your tape, your record.</h1>
          <p className="muted">Accounts are on the way: track the fades you follow, see your hit rate, and sync saved games across devices.</p>
        </div>
      </div>
      <div className="locked">
        {[["Fades followed", "—"], ["Hit rate", "—%"], ["Best call", "—"], ["Streak", "—"]].map(([l, v]) => (
          <div key={l} className="lk"><span className="mono muted">{l}</span><b>{v}</b></div>
        ))}
        <div className="lockover mono">LOCKED UNTIL LAUNCH</div>
      </div>
      <Link href="/board?tab=saved" className="btn ghost">View saved games on this device →</Link>
    </main>
  );
}
