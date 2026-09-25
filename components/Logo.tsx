export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <path d="M14 20 L20 9 L26 20Z M38 20 L44 9 L50 20Z" fill="var(--tape)" />
      <rect x="9" y="19" width="46" height="31" rx="6" fill="var(--tape)" />
      <circle cx="23" cy="34" r="6" fill="var(--bg)" className="reel" />
      <circle cx="41" cy="34" r="6" fill="var(--bg)" className="reel" />
      <rect x="21" y="44" width="22" height="4" rx="2" fill="var(--bg)" />
    </svg>
  );
}
