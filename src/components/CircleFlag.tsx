interface CircleFlagProps {
  code: string;
  size?: number;
  className?: string;
  title?: string;
}

export function CircleFlag({
  code,
  size = 48,
  className = "",
  title,
}: CircleFlagProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${code}.svg`}
      width={size}
      height={size}
      alt={title ?? ""}
      title={title}
      className={`shrink-0 rounded-full ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}
