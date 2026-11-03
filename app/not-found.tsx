import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap soon">
      <div className="eyebrow mono">404</div>
      <h1 className="big">That page isn't here.</h1>
      <p className="muted">It may have moved, or the game may be from another season.</p>
      <div className="aboutcta">
        <Link href="/board" className="btn primary">Open the Fade Board</Link>
        <Link href="/" className="btn ghost">Home</Link>
      </div>
    </main>
  );
}
