"use client";

import { useEffect, useRef } from "react";
import { useConsent } from "@/components/ConsentProvider";
import { useT } from "@/components/SettingsProvider";

const CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

type AdSenseUnitProps = {
  slot: string;
  format?: "auto" | "horizontal" | "rectangle";
  className?: string;
};

export function AdSenseUnit({
  slot,
  format = "auto",
  className = "",
}: AdSenseUnitProps) {
  const { adsAllowed } = useConsent();
  const t = useT();
  const pushed = useRef(false);

  useEffect(() => {
    if (!CLIENT_ID || !adsAllowed || !slot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Ad blockers or script not ready yet
    }
  }, [adsAllowed, slot]);

  if (!CLIENT_ID || !adsAllowed || !slot) return null;

  return (
    <div className={`overflow-hidden rounded-xl border border-border-base bg-surface/50 ${className}`}>
      <p className="px-2 py-1 text-center text-[10px] uppercase tracking-wide text-muted/70">
        {t("ads.label")}
      </p>
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
