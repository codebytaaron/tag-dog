"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const KEY = "tapedog.terms";
const VERSION = "1";

// One-time agreement before using the site, saved with the date it was accepted.
// The Terms and Privacy pages stay readable without agreeing.
export default function Consent() {
  const path = usePathname();
  const [show, setShow] = useState(false);
  const [age, setAge] = useState(false);
  const [agree, setAgree] = useState(false);
  useEffect(() => {
    try { setShow(JSON.parse(localStorage.getItem(KEY) || "{}").v !== VERSION); } catch { setShow(true); }
  }, []);
  useEffect(() => { document.documentElement.style.overflow = show && !free ? "hidden" : ""; });
  const free = path === "/terms" || path === "/privacy";
  if (!show || free) return null;
  const accept = () => {
    if (!age || !agree) return;
    try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, at: new Date().toISOString() })); } catch {}
    setShow(false);
  };
  return (
    <div className="consent" role="dialog" aria-modal="true" aria-labelledby="consent-h">
      <div className="consent-card">
        <h2 id="consent-h">Before you continue</h2>
        <ul>
          <li>TapeDog makes college football predictions for entertainment and information. Upset chances and TAPE scores are opinions, not guarantees.</li>
          <li>TapeDog is not a gambling service. Nothing here is betting, financial or legal advice. We don't take bets, link to sportsbooks or offer prizes.</li>
          <li>Scores, odds and other data come from third parties and can be late or wrong.</li>
          <li>You're solely responsible for your own decisions, including any betting. TapeDog isn't responsible for gambling losses or problems.</li>
          <li>If gambling is a problem for you or someone you know, call 1-800-GAMBLER.</li>
        </ul>
        <label><input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} /> I'm 18 or older.</label>
        <label><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I agree to the <Link href="/terms">Terms of Use</Link> and <Link href="/privacy">Privacy Policy</Link>.</label>
        <button className="btn primary" disabled={!age || !agree} onClick={accept}>Agree and continue</button>
      </div>
    </div>
  );
}
