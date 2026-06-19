import { useEffect, useRef, useState } from "react";

export function useLiveMinute(
  isLive: boolean,
  serverMinute: number | null
): number | null {
  const syncedAt = useRef(Date.now());
  const [elapsedMin, setElapsedMin] = useState(0);

  useEffect(() => {
    syncedAt.current = Date.now();
    setElapsedMin(0);
  }, [serverMinute]);

  useEffect(() => {
    if (!isLive || serverMinute == null) return;
    const id = setInterval(() => {
      setElapsedMin(Math.floor((Date.now() - syncedAt.current) / 60_000));
    }, 30_000);
    return () => clearInterval(id);
  }, [isLive, serverMinute]);

  if (!isLive || serverMinute == null) return serverMinute;
  return serverMinute + elapsedMin;
}

/** Contagem decrescente até ao pontapé de saída — actualiza a cada minuto. */
export function useKickoffCountdown(
  kickoffUtc: string,
  active: boolean
): { hours: number; minutes: number } | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [active, kickoffUtc]);

  if (!active) return null;

  const diff = new Date(kickoffUtc).getTime() - now;
  if (diff <= 0) return null;

  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return { hours, minutes };
}

export function formatKickoffCountdown(
  countdown: { hours: number; minutes: number },
  t: (key: string) => string
): string {
  if (countdown.hours > 0) {
    return t("featured.startsInHours")
      .replace("{hours}", String(countdown.hours))
      .replace("{minutes}", String(countdown.minutes));
  }
  return t("featured.startsInMinutes").replace(
    "{minutes}",
    String(Math.max(countdown.minutes, 1))
  );
}
