// Cidade / estádio dos jogos do Mundial 2026 (EUA, Canadá, México).

const HOST_COUNTRY: Record<string, { flag: string; labelPt: string; labelEn: string }> = {
  USA: { flag: "🇺🇸", labelPt: "EUA", labelEn: "USA" },
  Canada: { flag: "🇨🇦", labelPt: "Canadá", labelEn: "Canada" },
  Mexico: { flag: "🇲🇽", labelPt: "México", labelEn: "Mexico" },
};

/** Cidade → país anfitrião (heurística para estádios WC26). */
const CITY_COUNTRY: Record<string, keyof typeof HOST_COUNTRY> = {
  Atlanta: "USA",
  Boston: "USA",
  Dallas: "USA",
  Houston: "USA",
  Kansas: "USA",
  "Kansas City": "USA",
  "Los Angeles": "USA",
  Miami: "USA",
  "New York": "USA",
  "New York/New Jersey": "USA",
  Philadelphia: "USA",
  "San Francisco": "USA",
  "Bay Area": "USA",
  Seattle: "USA",
  Toronto: "Canada",
  Vancouver: "Canada",
  Guadalajara: "Mexico",
  "Mexico City": "Mexico",
  Monterrey: "Mexico",
};

export interface VenueDisplay {
  city: string | null;
  stadium: string | null;
  countryFlag: string | null;
  countryLabel: string | null;
}

/** Parse venue guardado como "Cidade · Estádio" ou só estadio. */
export function parseVenue(venue: string | null | undefined): VenueDisplay {
  if (!venue) {
    return { city: null, stadium: null, countryFlag: null, countryLabel: null };
  }

  const parts = venue.split(" · ").map((p) => p.trim());
  const city = parts.length >= 2 ? parts[0] : null;
  const stadium = parts.length >= 2 ? parts.slice(1).join(" · ") : venue;

  const hostKey = city ? CITY_COUNTRY[city] : null;
  const host = hostKey ? HOST_COUNTRY[hostKey] : null;

  return {
    city,
    stadium,
    countryFlag: host?.flag ?? null,
    countryLabel: host?.labelPt ?? null,
  };
}

export function venueCountryLabel(
  city: string | null,
  lang: "pt" | "en"
): string | null {
  if (!city) return null;
  const hostKey = CITY_COUNTRY[city];
  if (!hostKey) return null;
  const host = HOST_COUNTRY[hostKey];
  return lang === "pt" ? host.labelPt : host.labelEn;
}

export function formatVenueField(
  venue: { name: string | null; city: string | null } | null | undefined
): string | null {
  if (!venue) return null;
  const city = venue.city?.trim();
  const name = venue.name?.trim();
  if (city && name) return `${city} · ${name}`;
  return name ?? city ?? null;
}
