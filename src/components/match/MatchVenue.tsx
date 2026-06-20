import { CircleFlag } from "@/components/CircleFlag";
import { parseVenue } from "@/lib/venues";

interface MatchVenueProps {
  venue: string | null | undefined;
  variant?: "card" | "featured";
}

export function MatchVenue({ venue, variant = "card" }: MatchVenueProps) {
  const { city, stadium, hostCountryCode } = parseVenue(venue);

  if (!city && !stadium) return null;

  const textSize = variant === "featured" ? "text-base" : "text-sm";
  const flagSize = variant === "featured" ? 18 : 16;

  return (
    <div className={`text-center ${textSize} leading-snug text-muted`}>
      {city && (
        <p className="flex items-center justify-center gap-1.5">
          <span>{city}</span>
          {hostCountryCode && (
            <CircleFlag code={hostCountryCode} size={flagSize} className="opacity-90" />
          )}
        </p>
      )}
      {stadium && <p className="mt-0.5">{stadium}</p>}
    </div>
  );
}
