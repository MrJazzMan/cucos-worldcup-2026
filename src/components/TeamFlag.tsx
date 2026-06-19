import { CircleFlag } from "@/components/CircleFlag";
import { getTeamFlagCode } from "@/lib/team-flag-codes";

interface TeamFlagProps {
  name: string;
  teamId?: number;
  size?: number;
  className?: string;
}

export function TeamFlag({
  name,
  teamId,
  size = 48,
  className,
}: TeamFlagProps) {
  const code = getTeamFlagCode(name, teamId);

  if (code) {
    return (
      <CircleFlag code={code} size={size} className={className} title={name} />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-muted ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-label={name}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
