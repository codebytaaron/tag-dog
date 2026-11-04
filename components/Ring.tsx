export default function Ring({ score, tier, size = 56 }: { score: number; tier: string; size?: number }) {
  const r = size / 2 - 4, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="ring" aria-label={`Tape score ${score}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line2)" strokeWidth="4" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={`var(--${tier.toLowerCase()})`} strokeWidth="4" fill="none"
        strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: size * 0.32 }}>{score}</text>
    </svg>
  );
}
