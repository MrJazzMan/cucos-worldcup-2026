"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

function AuthCallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    const next = params.get("next") ?? "/conta";
    const oauthError = params.get("error");
    const oauthErrorCode = params.get("error_code");

    if (oauthError) {
      const qs = new URLSearchParams({ error: oauthError });
      if (oauthErrorCode) qs.set("error_code", oauthErrorCode);
      router.replace(`/conta?${qs}`);
      return;
    }

    if (!code) {
      router.replace("/conta?error=auth");
      return;
    }

    const supabase = createSupabaseBrowser();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        const qs = new URLSearchParams({
          error: "auth",
          error_code: error.message,
        });
        router.replace(`/conta?${qs}`);
      } else {
        router.replace(next.startsWith("/") ? next : "/conta");
        router.refresh();
      }
    });
  }, [params, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted">
      A iniciar sessão…
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-muted">
          A iniciar sessão…
        </div>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  );
}
