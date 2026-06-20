"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import {
  WHATS_NEW_ITEM_KEYS,
  hasSeenWhatsNew,
  markWhatsNewSeen,
} from "@/lib/whats-new";

export function WhatsNewBanner() {
  const { t } = useSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasSeenWhatsNew()) setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    markWhatsNewSeen();
    setVisible(false);
  }

  return (
    <section
      className="w-full rounded-2xl border border-accent/30 bg-accent/5 px-4 py-4 sm:px-5"
      aria-labelledby="whats-new-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2
            id="whats-new-title"
            className="text-sm font-bold text-foreground sm:text-base"
          >
            {t("whatsNew.title")}
          </h2>
          <ul className="mt-2.5 space-y-2 text-sm leading-snug text-foreground/90">
            {WHATS_NEW_ITEM_KEYS.map((key) => (
              <li key={key} className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-accent" aria-hidden>
                  •
                </span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-muted transition hover:bg-surface hover:text-foreground"
          aria-label={t("whatsNew.close")}
        >
          <span aria-hidden className="text-lg leading-none">
            ×
          </span>
        </button>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="mt-3 w-full rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 sm:w-auto"
      >
        {t("whatsNew.dismiss")}
      </button>
    </section>
  );
}
