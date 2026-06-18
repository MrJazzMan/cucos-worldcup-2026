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
  "LV",
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
  LV: "https://www.youtube.com/channel/UCpcTrCXblq78GZrTUTLWeBw",
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
 * Junta canais OndeBola com presets que o admin activou manualmente.
 * Preserva adições manuais (LV, UK, …); actualiza sempre os nomes do scrape.
 */
export function mergeBroadcastChannels(
  ondebolaChannels: string[],
  existingChannels: string[]
): string[] {
  const manualPresets = existingChannels.filter((c) => ALL_PRESET_CHANNELS.has(c));
  return [...new Set([...ondebolaChannels, ...manualPresets])];
}
