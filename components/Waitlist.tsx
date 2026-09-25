"use client";
import { useState } from "react";

const TAKEN = 150, TOTAL = 500;

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr("Enter a valid email."); return; }
    setErr(""); setDone(true);
  };
  return (
    <div className="wl">
      <div className="wlcount">
        <div className="mono"><b>{TAKEN}</b> / {TOTAL} <span className="muted">EARLY SPOTS CLAIMED</span></div>
        <div className="bar"><i style={{ width: `${(TAKEN / TOTAL) * 100}%` }} /></div>
      </div>
      {done ? (
        <div className="wldone"><b>You're on the list.</b><span className="muted">We'll email {email} before early rollout.</span></div>
      ) : (
        <form onSubmit={submit} className="wlform">
          <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
          <button className="btn primary" type="submit">Join early rollout</button>
        </form>
      )}
      {err && <p className="errtxt small">{err}</p>}
    </div>
  );
}
