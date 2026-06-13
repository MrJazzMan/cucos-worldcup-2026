"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export function AuthStatus() {
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
