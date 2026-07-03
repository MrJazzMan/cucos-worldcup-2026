function WCTrophy({ size = 92 }: { size?: number }) {
  const height = Math.round(size * 1.72);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/world-cup-trophy.svg"
      alt=""
      width={size}
      height={height}
      className="object-contain"
      style={{ width: size, height }}
      aria-hidden
      decoding="async"
    />
  );
}

export { WCTrophy };
