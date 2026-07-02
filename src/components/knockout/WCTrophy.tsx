function WCTrophy({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 80"
      aria-hidden
      className="drop-shadow-[0_0_18px_rgba(232,200,114,0.55)]"
    >
      <defs>
        <linearGradient id="trophy-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4e4a6" />
          <stop offset="45%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#9a7b2d" />
        </linearGradient>
      </defs>
      <path
        d="M18 8h28l2 8H16l2-8zm-4 16h36c0 10-4 18-12 22v6h8l-4 18H22l-4-18h8v-6c-8-4-12-12-12-22z"
        fill="url(#trophy-gold)"
        stroke="#b89546"
        strokeWidth="1.2"
      />
      <ellipse cx="32" cy="8" rx="16" ry="4" fill="#e8c872" opacity="0.85" />
      <path
        d="M10 24c-4 0-6-2-6-5s2-5 6-5M54 24c4 0 6-2 6-5s-2-5-6-5"
        fill="none"
        stroke="#d4af37"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { WCTrophy };
