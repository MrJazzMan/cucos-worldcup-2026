type LogoProps = {
  height?: number;
  textColor?: string;
  accentColor?: string;
  className?: string;
};

export default function Logo({
  height = 28,
  textColor = "#1B2A41",
  accentColor = "#F2522E",
  className,
}: LogoProps) {
  const width = (height * 130) / 48;
  return (
    <svg
      role="img"
      aria-label="WC26"
      width={width}
      height={height}
      viewBox="0 0 130 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <text
        x="65"
        y="33"
        textAnchor="middle"
        style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
        fontSize="36"
        fontWeight="700"
        letterSpacing="0.5"
        fill={textColor}
      >
        WC26
      </text>
      <rect x="39" y="40" width="52" height="5" rx="2.5" fill={accentColor} />
    </svg>
  );
}
