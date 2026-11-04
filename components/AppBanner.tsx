"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const KEY = "tapedog.appbanner";

// Phones only: a slim, dismissible banner pointing to the iOS app.
export default function AppBanner() {
  const path = usePathname();
  const [show, setShow] = useState(false);
  useEffect(() => { try { setShow(localStorage.getItem(KEY) !== "1"); } catch { setShow(true); } }, []);
  if (!show || path === "/app") return null;
  return (
    <div className="appbanner">
      <Link href="/app" className="ab-main">
        <span className="ab-icon"><Logo size={22} /></span>
        <span className="ab-txt"><b>TapeDog for iPhone</b><small>Live scores on your Lock Screen. Upset alerts.</small></span>
        <span className="ab-cta">See it</span>
      </Link>
      <button className="ab-x" aria-label="Dismiss" onClick={() => { try { localStorage.setItem(KEY, "1"); } catch {} setShow(false); }}>×</button>
    </div>
  );
}
