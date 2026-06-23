"use client";

import { useT } from "@/components/SettingsProvider";
import { signInWithGoogle } from "@/lib/google-sign-in";

export function ChannelsSignInPrompt() {
  const t = useT();

  return (
    <span className="text-xs text-muted">
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        className="font-medium text-accent underline-offset-2 hover:underline"
      >
        {t("card.channelsSignInLink")}
      </button>{" "}
      {t("card.channelsSignInHint")}
    </span>
  );
}
