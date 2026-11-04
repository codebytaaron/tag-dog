"use client";
import { useEffect, useState } from "react";

const KEY = "tapedog.app";

// The iOS app isn't in the App Store yet. Save a reminder on this device (no email collected).
export default function AppNotify({ big = false }: { big?: boolean }) {
  const [on, setOn] = useState(false);
  useEffect(() => { try { setOn(localStorage.getItem(KEY) === "1"); } catch {} }, []);
  const toggle = () => {
    const next = !on;
    try { next ? localStorage.setItem(KEY, "1") : localStorage.removeItem(KEY); } catch {}
    setOn(next);
  };
  return on ? (
    <div className="appnote"><b>You're on the list.</b> <span className="muted">We'll show the App Store link here the day it's live.</span> <button className="linkbtn small" onClick={toggle}>Undo</button></div>
  ) : (
    <button className={`btn primary ${big ? "big" : ""}`} onClick={toggle}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.5-1-2.5-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" /></svg>
      Get it first on iPhone
    </button>
  );
}
