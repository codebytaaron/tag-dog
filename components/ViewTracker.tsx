"use client";
import { useEffect } from "react";
import { recordView } from "@/lib/taste";

export default function ViewTracker({ id, teams }: { id: string | null; teams: string[] }) {
  useEffect(() => { recordView(id, teams); }, [id]); // eslint-disable-line
  return null;
}
