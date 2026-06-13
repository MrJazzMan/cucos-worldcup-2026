// Utilitários de data/hora por fuso horário escolhido (IANA).
// Usam Intl para funcionar com qualquer fuso no browser sem dependências extra.

/** Fuso do browser, ou "Europe/Lisbon" como fallback. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Lisbon";
  } catch {
    return "Europe/Lisbon";
  }
}

/** Chave de dia (yyyy-MM-dd) de um instante UTC, no fuso indicado. */
export function dateKeyInTz(utcIso: string, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(utcIso));
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

/** Hora HH:mm de um instante UTC, no fuso indicado. */
export function timeInTz(utcIso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(utcIso));
}

/** Nome curto do fuso (ex.: "WEST", "BRT") para mostrar junto à hora. */
export function tzShortName(tz: string, locale = "en-GB"): string {
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

/** Chave de dia "hoje + offset" no fuso indicado (ancorada ao meio-dia UTC para evitar DST). */
export function dayKeyWithOffset(tz: string, offset: number, base = new Date()): string {
  const todayKey = dateKeyInTz(base.toISOString(), tz);
  const anchor = new Date(`${todayKey}T12:00:00Z`);
  anchor.setUTCDate(anchor.getUTCDate() + offset);
  return anchor.toISOString().slice(0, 10);
}

/** Rótulo de data legível (ex.: "sábado, 14 de junho"). */
export function displayDate(dayKey: string, tz: string, locale: string): string {
  const date = new Date(`${dayKey}T12:00:00Z`);
  return new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

/** Lista curta de fusos comuns para o selector. */
export const COMMON_TIMEZONES = [
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Paris",
  "America/New_York",
  "America/Sao_Paulo",
  "America/Los_Angeles",
  "America/Mexico_City",
  "Atlantic/Azores",
  "Africa/Luanda",
];
