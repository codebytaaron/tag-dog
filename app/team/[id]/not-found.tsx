import Link from "next/link";
export default function NotFound() {
  return (
    <main className="wrap soon">
      <div className="eyebrow mono">404 · NO TEAM</div>
      <h1 className="btitle">We couldn't find that team.</h1>
      <Link href="/board" className="btn primary">Back to the board →</Link>
    </main>
  );
}
