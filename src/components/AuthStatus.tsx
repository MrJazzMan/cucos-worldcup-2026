"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useT } from "@/components/SettingsProvider";

export function AuthStatus() {
  const t = useT();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!email) return null;

  const initial = email[0]?.toUpperCase() ?? "?";

  return (
    <Link
      href="/conta"
      title={email}
      className={`hidden items-center gap-1.5 rounded-full border border-border-base bg-surface-2 px-2 py-1 sm:flex ${
        pathname.startsWith("/conta") ? "ring-1 ring-accent/40" : ""
      }`}
    >
      <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs font-bold text-white">
        {initial}
      </span>
      <span className="max-w-[7rem] truncate text-xs font-medium text-foreground">
        {email.split("@")[0]}
      </span>
    </Link>
  );
}

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
    if (!error || pathname === "/conta") return;
    router.replace(
      `/conta?error=${encodeURIComponent(error)}${errorCode ? `&error_code=${encodeURIComponent(errorCode)}` : ""}${errorDesc ? `&error_description=${encodeURIComponent(errorDesc)}` : ""}`
    );
  }, [error, errorCode, errorDesc, pathname, router]);

  // Sessão activa mas URL com erro antigo — limpar
  useEffect(() => {
    if (loggedIn && error && pathname === "/conta") {
      router.replace("/conta");
    }
  }, [loggedIn, error, pathname, router]);

  if (!error || pathname !== "/conta" || loggedIn) return null;

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
