type LivePulseDotProps = {
  size?: "sm" | "md";
  className?: string;
};

export function LivePulseDot({ size = "md", className }: LivePulseDotProps) {
  const sizeClass = size === "sm" ? "live-pulse--sm" : "live-pulse--md";

  return (
    <span
      className={`live-pulse ${sizeClass}${className ? ` ${className}` : ""}`}
      aria-hidden
    >
      <span className="live-pulse__ring" />
      <span className="live-pulse__dot" />
    </span>
  );
}
