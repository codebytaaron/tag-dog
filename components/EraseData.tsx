"use client";
import { useState } from "react";

// Wipes everything TapeDog keeps in this browser (profile, picks, saved, follows, reels history, tracker, settings).
export default function EraseData() {
  const [done, setDone] = useState(false);
  const erase = () => {
    if (!confirm("Erase everything TapeDog has saved on this device? This can't be undone.")) return;
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("tapedog.")).forEach((k) => localStorage.removeItem(k));
      ["profile", "picks", "saved", "teams"].forEach((k) => window.dispatchEvent(new Event(`tapedog-${k}`)));
    } catch {}
    setDone(true);
  };
  return done
    ? <p className="erased">Done. Everything TapeDog stored on this device has been erased.</p>
    : <button className="btn ghost" onClick={erase}>Erase my TapeDog data on this device</button>;
}
