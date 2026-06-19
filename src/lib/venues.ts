// Cidade / estádio dos jogos do Mundial 2026 (EUA, Canadá, México).

import type { Lang } from "@/lib/i18n";
import { usesPortugueseTeams } from "@/lib/i18n";

const HOST_COUNTRY: Record<string, { flag: string; labelPt: string; labelEn: string }> = {
  USA: { flag: "🇺🇸", labelPt: "EUA", labelEn: "USA" },
  Canada: { flag: "🇨🇦", labelPt: "Canadá", labelEn: "Canada" },
  Mexico: { flag: "🇲🇽", labelPt: "México", labelEn: "Mexico" },
};

const HOST_COUNTRY_CODE: Record<keyof typeof HOST_COUNTRY, string> = {
  USA: "us",
  Canada: "ca",
  Mexico: "mx",
};

type CityHostMeta = {
  country: keyof typeof HOST_COUNTRY;
  statePt: string;
  stateEn: string;
};

/** Cidade → anfitrião + estado/província (heurística para estádios WC26). */
const CITY_HOST: Record<string, CityHostMeta> = {
  Atlanta: { country: "USA", statePt: "GA", stateEn: "GA" },
  Boston: { country: "USA", statePt: "MA", stateEn: "MA" },
  Dallas: { country: "USA", statePt: "TX", stateEn: "TX" },
  Houston: { country: "USA", statePt: "TX", stateEn: "TX" },
  Inglewood: { country: "USA", statePt: "CA", stateEn: "CA" },
  "Kansas City": { country: "USA", statePt: "MO", stateEn: "MO" },
  "Los Angeles": { country: "USA", statePt: "CA", stateEn: "CA" },
  Miami: { country: "USA", statePt: "FL", stateEn: "FL" },
  "New York/New Jersey": { country: "USA", statePt: "NJ", stateEn: "NJ" },
  "East Rutherford": { country: "USA", statePt: "NJ", stateEn: "NJ" },
  Philadelphia: { country: "USA", statePt: "PA", stateEn: "PA" },
  "San Francisco": { country: "USA", statePt: "CA", stateEn: "CA" },
  "Santa Clara": { country: "USA", statePt: "CA", stateEn: "CA" },
  Seattle: { country: "USA", statePt: "WA", stateEn: "WA" },
  Toronto: { country: "Canada", statePt: "ON", stateEn: "ON" },
  Vancouver: { country: "Canada", statePt: "BC", stateEn: "BC" },
  Guadalajara: { country: "Mexico", statePt: "JAL", stateEn: "JAL" },
  "Mexico City": { country: "Mexico", statePt: "CDMX", stateEn: "CDMX" },
  Monterrey: { country: "Mexico", statePt: "NL", stateEn: "NL" },
};

export interface VenueDisplay {
  city: string | null;
  stadium: string | null;
  countryFlag: string | null;
  countryLabel: string | null;
  hostCountryCode: string | null;
}

/** Parse venue guardado como "Cidade · Estádio" ou só estadio. */
export function parseVenue(venue: string | null | undefined): VenueDisplay {
  if (!venue) {
    return {
      city: null,
      stadium: null,
      countryFlag: null,
      countryLabel: null,
      hostCountryCode: null,
    };
  }

  const parts = venue.split(" · ").map((p) => p.trim());
  const city = parts.length >= 2 ? parts[0] : null;
  const stadium = parts.length >= 2 ? parts.slice(1).join(" · ") : venue;

  const hostMeta = city ? CITY_HOST[city] : null;
  const host = hostMeta ? HOST_COUNTRY[hostMeta.country] : null;

  return {
    city,
    stadium,
    countryFlag: host?.flag ?? null,
    countryLabel: host?.labelPt ?? null,
    hostCountryCode: hostMeta ? HOST_COUNTRY_CODE[hostMeta.country] : null,
  };
}

export function venueCountryLabel(
  city: string | null,
  lang: Lang
): string | null {
  if (!city) return null;
  const hostMeta = CITY_HOST[city];
  if (!hostMeta) return null;
  const host = HOST_COUNTRY[hostMeta.country];
  return usesPortugueseTeams(lang) ? host.labelPt : host.labelEn;
}

export function venueStateLabel(
  city: string | null,
  lang: Lang
): string | null {
  if (!city) return null;
  const hostMeta = CITY_HOST[city];
  if (!hostMeta) return null;
  return usesPortugueseTeams(lang) ? hostMeta.statePt : hostMeta.stateEn;
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
