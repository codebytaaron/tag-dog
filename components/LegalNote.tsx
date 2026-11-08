// Short disclaimer shown next to odds, upset chances and picks.
export default function LegalNote({ className = "" }: { className?: string }) {
  return (
    <p className={`legalnote ${className}`}>
      Estimates for entertainment and information only, not predictions or betting advice. TapeDog doesn't take bets and isn't responsible for decisions you make. Odds and scores can be delayed or wrong. 18+. Gambling problem? Call 1-800-GAMBLER.
    </p>
  );
}
