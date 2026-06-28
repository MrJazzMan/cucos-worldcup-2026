"use client";

import { useSettings } from "@/components/SettingsProvider";
import { formatMatchMetaFooter } from "@/lib/match-meta";
import type { Match } from "@/types";

interface MatchMetaFooterProps {
  match: Pick<Match, "group_name" | "round" | "fixture_id" | "venue">;
  matchNumber?: number;
  includeVenue?: boolean;
  className?: string;
}

export function MatchMetaFooter({
  match,
  matchNumber,
  includeVenue = false,
  className = "mt-2 text-center text-[10px] uppercase tracking-wide text-muted",
}: MatchMetaFooterProps) {
  const { t } = useSettings();
  const label = formatMatchMetaFooter(match, matchNumber, t, { includeVenue });
  if (!label) return null;

  return <p className={className}>{label}</p>;
}
