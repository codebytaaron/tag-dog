import Link from "next/link";
export default function NotFound() {
  return (
    <main className="wrap soon">
      <div className="eyebrow mono">404 · NO TAPE</div>
      <h1 className="btitle">That game isn't on this week's tape.</h1>
      <Link href="/board" className="btn primary">Back to the board →</Link>
    </main>
  );
}
