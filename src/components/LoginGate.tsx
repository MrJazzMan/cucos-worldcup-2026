"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AuthButtons } from "@/components/AuthButtons";
import { useT } from "@/components/SettingsProvider";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

function LoginGateContent({ initialLoggedIn }: { initialLoggedIn: boolean }) {
  const t = useT();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);

  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDesc = searchParams.get("error_description");

  const returnParams = new URLSearchParams(searchParams.toString());
  returnParams.delete("error");
  returnParams.delete("error_code");
  returnParams.delete("error_description");
  const returnQs = returnParams.toString();
  const next = `${pathname}${returnQs ? `?${returnQs}` : ""}`;

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [loggedIn]);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  if (pathname === "/auth/callback" || pathname === "/privacidade") return null;
  if (loggedIn) return null;

  const errorMessage =
    error === "auth"
      ? t("auth.error.failed")
      : error === "server_error"
        ? t("auth.error.server")
        : error
          ? t("auth.error.generic")
          : null;

  const errorDetail = errorDesc ?? errorCode ?? "";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-gate-title"
    >
      <div className="absolute inset-0 bg-background/75 backdrop-blur-md" />
      <div className="animate-rise relative w-full max-w-md rounded-2xl border border-border-base bg-surface p-8 shadow-2xl shadow-black/20">
        <div className="mb-7 text-center">
          <span className="mb-4 inline-block text-5xl">⚽</span>
          <h2
            id="login-gate-title"
            className="text-2xl font-bold text-foreground"
          >
            {t("auth.modal.title")}
          </h2>
          <p className="mt-2 text-base text-muted">{t("auth.modal.subtitle")}</p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {errorMessage}
            {errorDetail && (
              <span className="mt-1 block text-xs opacity-80">{errorDetail}</span>
            )}
          </div>
        )}

        <AuthButtons next={next} />
      </div>
    </div>
  );
}

export function LoginGate({ initialLoggedIn }: { initialLoggedIn: boolean }) {
  return (
    <Suspense fallback={null}>
      <LoginGateContent initialLoggedIn={initialLoggedIn} />
    </Suspense>
  );
}
