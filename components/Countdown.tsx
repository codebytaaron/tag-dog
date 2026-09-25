"use client";
import { useEffect, useState } from "react";

export default function Countdown({ date }: { date: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (now == null) return <span>&nbsp;</span>;
  const ms = Date.parse(date) - now;
  if (ms <= 0) return <span>Kicked off</span>;
  const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
  return <span suppressHydrationWarning>{d ? `${d}d ` : ""}{h}h {String(m).padStart(2, "0")}m {String(s).padStart(2, "0")}s</span>;
}
