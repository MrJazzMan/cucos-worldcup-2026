"use client";

import Link from "next/link";
import { useConsent } from "@/components/ConsentProvider";
import { useT } from "@/components/SettingsProvider";

export function CookieConsent() {
  const { consent, accept, reject } = useConsent();
  const t = useT();

  if (consent !== "pending") return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-[90] border-t border-border-base bg-surface/95 p-4 shadow-2xl backdrop-blur-md sm:bottom-0">
      <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {t("consent.message")}
          <Link href="/privacidade" className="font-semibold text-accent hover:underline">
            {t("consent.learnMore")}
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={reject}
            className="rounded-xl border border-border-base px-4 py-2 text-sm font-semibold text-muted transition hover:text-foreground"
          >
            {t("consent.reject")}
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {t("consent.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
