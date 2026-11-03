"use client";
import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="wrap soon">
      <div className="eyebrow mono">SOMETHING WENT WRONG</div>
      <h1 className="big">We couldn't load this page.</h1>
      <p className="muted">One of our data sources may be slow right now. Try again in a moment.</p>
      <div className="aboutcta">
        <button className="btn primary" onClick={reset}>Try again</button>
        <Link href="/" className="btn ghost">Home</Link>
      </div>
    </main>
  );
}
