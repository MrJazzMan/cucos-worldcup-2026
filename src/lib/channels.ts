// Canais TV — listas de curadoria manual (admin). Nomes OndeBola (ex. Sport.Tv1) vêm do sync.

export const PT_CHANNELS = [
  "RTP1",
  "RTP2",
  "RTP3",
  "SIC",
  "TVI",
  "Sport.Tv1",
  "Sport.Tv2",
  "Sport.Tv3",
  "Sport.Tv4",
  "Sport.Tv5",
  "Sport.Tv+",
  "DAZN",
  "LiveModeTv",
] as const;

export const UK_CHANNELS = [
  "BBC One",
  "BBC Two",
  "BBC iPlayer",
  "ITV",
  "ITV1",
  "ITV X",
] as const;

export const USA_CHANNELS = [
  "Fox",
  "FOX",
  "Fox Sports",
  "FS1",
  "Telemundo",
  "Univision",
  "Peacock",
  "TUDN",
] as const;

export const QATAR_CHANNELS = [
  "beIN Sports",
  "beIN Sports 1",
  "beIN Sports 2",
  "Al Kass",
  "Al Kass 1",
  "Qatar TV",
] as const;

export const CHANNEL_REGIONS = [
  { id: "pt", label: "Portugal", channels: PT_CHANNELS },
  { id: "uk", label: "UK", channels: UK_CHANNELS },
  { id: "usa", label: "USA", channels: USA_CHANNELS },
  { id: "qa", label: "Qatar", channels: QATAR_CHANNELS },
] as const;

export const ALL_PRESET_CHANNELS: ReadonlySet<string> = new Set(
  CHANNEL_REGIONS.flatMap((r) => r.channels)
);

/** Links externos para canais que não são TV linear tradicional */
export const CHANNEL_LINKS: Record<string, string> = {
  LiveModeTv: "https://www.youtube.com/channel/UCpcTrCXblq78GZrTUTLWeBw",
  "BBC iPlayer": "https://www.bbc.co.uk/iplayer",
  "ITV X": "https://www.itv.com/watch",
  Peacock: "https://www.peacocktv.com/",
};

export function getChannelHref(channel: string): string | null {
  return CHANNEL_LINKS[channel] ?? null;
}

/** Canais do OndeBola/sync que não estão nas listas de curadoria. */
export function channelsOutsidePresets(channels: string[]): string[] {
  return channels.filter((c) => !ALL_PRESET_CHANNELS.has(c));
}

/**
 * Junta canais OndeBola com presets estrangeiros que o admin activou manualmente.
 * Canais PT do scrape substituem sempre os anteriores (evita Sport.Tv5 stale, etc.).
 */
export function mergeBroadcastChannels(
  ondebolaChannels: string[],
  existingChannels: string[]
): string[] {
  const ptSet = new Set<string>(PT_CHANNELS);
  const foreignManual = existingChannels.filter(
    (c) => ALL_PRESET_CHANNELS.has(c) && !ptSet.has(c)
  );
  return [...new Set([...ondebolaChannels, ...foreignManual])];
}

/** Garante array de strings ao ler da BD (Supabase devolve TEXT[]). */
export function normalizeBroadcastChannels(channels: unknown): string[] {
  if (Array.isArray(channels)) {
    return channels.filter((c): c is string => typeof c === "string" && c.length > 0);
  }
  if (typeof channels === "string" && channels.length > 0) {
    return channels
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  }
  return [];
}
