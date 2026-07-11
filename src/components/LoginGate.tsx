"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AuthButtons } from "@/components/AuthButtons";
import { useT } from "@/components/SettingsProvider";

/**
 * Banner opcional de erro OAuth — não bloqueia visitantes anónimos.
 * O site é público em modo read-only; login só é necessário para favoritos, etc.
 */
function LoginGateContent() {
  const t = useT();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDesc = searchParams.get("error_description");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  if (pathname === "/auth/callback") return null;
  if (!error) return null;

  const returnParams = new URLSearchParams(searchParams.toString());
  returnParams.delete("error");
  returnParams.delete("error_code");
  returnParams.delete("error_description");
  const returnQs = returnParams.toString();
  const next = `${pathname}${returnQs ? `?${returnQs}` : ""}`;

  const errorMessage =
    error === "auth"
      ? t("auth.error.failed")
      : error === "server_error"
        ? t("auth.error.server")
        : t("auth.error.generic");

  const errorDetail = errorDesc ?? errorCode ?? "";

  return (
    <div
      className="mx-auto mb-4 w-full max-w-7xl rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 sm:px-6"
      role="alert"
    >
      <p className="text-sm font-medium text-red-600 dark:text-red-300">
        {errorMessage}
        {errorDetail && (
          <span className="mt-1 block text-xs opacity-80">{errorDetail}</span>
        )}
      </p>
      <div className="mt-3">
        <AuthButtons next={next} />
      </div>
    </div>
  );
}

export function LoginGate() {
  return (
    <Suspense fallback={null}>
      <LoginGateContent />
    </Suspense>
  );
}
