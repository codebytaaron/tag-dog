// Team avatar: the TapeDog dog in each person's team color, with their initials on the collar.
export default function DogAvatar({ color = "var(--tape)", initials, size = 64 }: { color?: string; initials: string; size?: number }) {
  return (
    <span className="dogav" style={{ width: size, height: size, ["--dc" as any]: color }}>
      <svg viewBox="0 0 64 64" width={size * 0.78} height={size * 0.78} aria-hidden>
        <path d="M14 20 L20 8 L27 20Z M37 20 L44 8 L50 20Z" fill="var(--dc)" />
        <rect x="9" y="18" width="46" height="32" rx="7" fill="var(--dc)" />
        <circle cx="23" cy="32" r="6" fill="var(--bg)" /><circle cx="41" cy="32" r="6" fill="var(--bg)" />
        <circle cx="24.5" cy="30.5" r="2" fill="var(--ink)" /><circle cx="42.5" cy="30.5" r="2" fill="var(--ink)" />
        <rect x="19" y="43" width="26" height="9" rx="4.5" fill="var(--bg)" />
        <text x="32" y="50.2" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="var(--dc)" fontFamily="var(--mono)">{initials}</text>
      </svg>
    </span>
  );
}
