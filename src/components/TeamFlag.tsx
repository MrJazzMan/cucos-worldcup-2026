import Image from "next/image";

interface TeamFlagProps {
  name: string;
  logo: string | null;
  size?: number;
}

export function TeamFlag({ name, logo, size = 32 }: TeamFlagProps) {
  if (logo) {
    return (
      <Image
        src={logo}
        alt={`Bandeira ${name}`}
        width={size}
        height={size}
        className="rounded-full object-cover"
        unoptimized
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-muted"
      style={{ width: size, height: size }}
      aria-label={name}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
