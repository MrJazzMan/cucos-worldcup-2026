"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSettings } from "@/components/SettingsProvider";

export function AccountDeletedBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("accountDeleted") !== "1") return;
    setVisible(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("accountDeleted");
    const next = params.toString();
    router.replace(next ? `/?${next}` : "/", { scroll: false });

    const timer = window.setTimeout(() => setVisible(false), 6000);
    return () => window.clearTimeout(timer);
  }, [searchParams, router]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="rounded-xl border border-border-base bg-surface-2 px-4 py-3 text-sm text-foreground"
    >
      {t("deleteAccount.successBanner")}
    </div>
  );
}
