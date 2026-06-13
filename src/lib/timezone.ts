import { formatInTimeZone } from "date-fns-tz";
import { addDays, startOfDay } from "date-fns";

export const TIMEZONE = "Europe/Lisbon";

export function formatKickoffTime(utcIso: string): string {
  return formatInTimeZone(new Date(utcIso), TIMEZONE, "HH:mm");
}

export function formatMatchDate(utcIso: string): string {
  return formatInTimeZone(new Date(utcIso), TIMEZONE, "yyyy-MM-dd");
}

export function getDateForOffset(offset: -1 | 0 | 1): string {
  const today = startOfDay(new Date());
  const target = addDays(today, offset);
  return formatInTimeZone(target, TIMEZONE, "yyyy-MM-dd");
}

export function getDayLabel(offset: -1 | 0 | 1): string {
  if (offset === -1) return "Ontem";
  if (offset === 0) return "Hoje";
  return "Amanhã";
}

export function formatDisplayDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return formatInTimeZone(date, TIMEZONE, "EEEE, d 'de' MMMM", {
    locale: undefined,
  });
}
