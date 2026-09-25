"use client";
import { useEffect, useState } from "react";

// Renders in the viewer's timezone after mount to avoid SSR mismatch.
export default function Kickoff({ date, long = false }: { date: string; long?: boolean }) {
  const [s, setS] = useState("");
  useEffect(() => {
    setS(new Date(date).toLocaleString([], long
      ? { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
      : { weekday: "short", hour: "numeric", minute: "2-digit" }));
  }, [date, long]);
  return <span suppressHydrationWarning>{s || " "}</span>;
}
