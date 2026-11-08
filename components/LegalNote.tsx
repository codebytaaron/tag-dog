import { DISCLAIMER, HELP } from "@/lib/legal";

// Short disclaimer shown next to predictions, upset chances and picks.
export default function LegalNote({ className = "" }: { className?: string }) {
  return <p className={`legalnote ${className}`}>{DISCLAIMER} {HELP}</p>;
}
