// Canais TV Portugal — lista partilhada (admin + homepage)

export const PT_CHANNELS = [
  "RTP1",
  "RTP2",
  "RTP3",
  "SIC",
  "TVI",
  "Sport TV",
  "DAZN",
  "LV",
] as const;

/** Links externos para canais que não são TV linear tradicional */
export const CHANNEL_LINKS: Record<string, string> = {
  LV: "https://www.youtube.com/channel/UCpcTrCXblq78GZrTUTLWeBw",
};

export function getChannelHref(channel: string): string | null {
  return CHANNEL_LINKS[channel] ?? null;
}
