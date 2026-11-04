"use client";
import { useEffect, useState } from "react";

export default function Ago({ date }: { date: string }) {
  const [s, setS] = useState("");
  useEffect(() => {
    const m = Math.max(1, Math.round((Date.now() - Date.parse(date)) / 60000));
    setS(m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`);
  }, [date]);
  return <span suppressHydrationWarning>{s}</span>;
}
