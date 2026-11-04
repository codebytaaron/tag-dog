"use client";
import { useState } from "react";

export default function ShareButton({ title }: { title: string }) {
  const [done, setDone] = useState(false);
  const share = async () => {
    const url = window.location.href.split("#")[0];
    try {
      if (navigator.share) { await navigator.share({ title, url }); return; }
      await navigator.clipboard.writeText(url);
      setDone(true); setTimeout(() => setDone(false), 1800);
    } catch {}
  };
  return (
    <button className="save big share" onClick={share} aria-label="Share game">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" /></svg>
      <span>{done ? "Link copied" : "Share"}</span>
    </button>
  );
}
