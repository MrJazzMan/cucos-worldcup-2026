"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useT } from "@/components/SettingsProvider";

export function AuthErrorBanner() {
  const t = useT();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDesc = searchParams.get("error_description");

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user);
    });
  }, []);

  useEffect(() => {
    if (loggedIn && error) {
      router.replace(pathname);
    }
  }, [loggedIn, error, pathname, router]);

  if (!error || loggedIn) return null;

  const message =
    error === "auth"
      ? t("auth.error.failed")
      : error === "server_error"
        ? t("auth.error.server")
        : t("auth.error.generic");

  const detail = errorDesc ?? errorCode ?? "";

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
      {message}
      {detail && <span className="mt-1 block text-xs opacity-80">{detail}</span>}
    </div>
  );
}
