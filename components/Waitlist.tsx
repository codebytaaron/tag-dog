"use client";
import { useEffect, useState } from "react";

const KEY = "tapedog.dogzone";

// No email collection yet: a launch reminder saved on this device, shown again when Dog Zone opens.
export default function Waitlist() {
  const [on, setOn] = useState(false);
  useEffect(() => { try { setOn(localStorage.getItem(KEY) === "1"); } catch {} }, []);
  const toggle = () => {
    const next = !on;
    try { next ? localStorage.setItem(KEY, "1") : localStorage.removeItem(KEY); } catch {}
    setOn(next);
  };
  return (
    <div className="wl">
      {on ? (
        <div className="wldone">
          <b>Reminder set.</b>
          <span className="muted">When Dog Zone opens, you'll see it first right here on TapeDog.</span>
          <button className="linkbtn small" onClick={toggle}>Undo</button>
        </div>
      ) : (
        <button className="btn primary" onClick={toggle}>Remind me when it launches</button>
      )}
      <p className="muted small wlnote">Saved on this device. We don't collect emails yet.</p>
    </div>
  );
}
