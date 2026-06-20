"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSettingsMenu } from "@/components/SettingsMenuContext";
import { useSettings } from "@/components/SettingsProvider";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type { Match } from "@/types";

type MatchFavouriteToggleProps = {
  match: Match & { isFavourite?: boolean };
  loggedIn?: boolean;
  size?: "sm" | "md";
  onChange?: (isFavourite: boolean) => void;
};

export function MatchFavouriteToggle({
  match,
  loggedIn = false,
  size = "sm",
  onChange,
}: MatchFavouriteToggleProps) {
  const router = useRouter();
  const { setOpen } = useSettingsMenu();
  const { t } = useSettings();
  const [isFavourite, setIsFavourite] = useState(!!match.isFavourite);
  const [busy, setBusy] = useState(false);
  const [pop, setPop] = useState(false);

  const sizeClass = size === "md" ? "text-lg" : "text-base";

  async function handleClick() {
    if (busy) return;

    if (!loggedIn) {
      setOpen(true);
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setOpen(true);
        return;
      }

      const teamIds = [match.home_team_id, match.away_team_id];

      if (isFavourite) {
        await supabase
          .from("favourite_teams")
          .delete()
          .eq("user_id", user.id)
          .in("team_id", teamIds);
        setIsFavourite(false);
        onChange?.(false);
      } else {
        await supabase.from("favourite_teams").upsert(
          [
            {
              user_id: user.id,
              team_id: match.home_team_id,
              team_name: match.home_team_name,
            },
            {
              user_id: user.id,
              team_id: match.away_team_id,
              team_name: match.away_team_name,
            },
          ],
          { onConflict: "user_id,team_id" }
        );
        setIsFavourite(true);
        setPop(true);
        onChange?.(true);
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={isFavourite}
      aria-label={
        isFavourite ? t("card.favouriteRemove") : t("card.favouriteAdd")
      }
      className={`shrink-0 rounded-full p-1 transition-colors hover:bg-amber-500/10 disabled:opacity-50 ${sizeClass} ${
        isFavourite ? "text-amber-400" : "text-muted/40 hover:text-amber-400/70"
      }`}
    >
      <span
        className={pop ? "favourite-star-pop" : undefined}
        onAnimationEnd={() => setPop(false)}
        aria-hidden
      >
        {isFavourite ? "★" : "☆"}
      </span>
    </button>
  );
}
