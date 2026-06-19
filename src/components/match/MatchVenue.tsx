import { CircleFlag } from "@/components/CircleFlag";
import { parseVenue } from "@/lib/venues";

interface MatchVenueProps {
  venue: string | null | undefined;
}

export function MatchVenue({ venue }: MatchVenueProps) {
  const { city, stadium, hostCountryCode } = parseVenue(venue);

  if (!city && !stadium) return null;

  return (
    <div className="text-center text-[11px] leading-snug text-muted">
      {city && (
        <p className="flex items-center justify-center gap-1.5">
          <span>{city}</span>
          {hostCountryCode && (
            <CircleFlag code={hostCountryCode} size={14} className="opacity-90" />
          )}
        </p>
      )}
      {stadium && <p className="mt-0.5">{stadium}</p>}
    </div>
  );
}
