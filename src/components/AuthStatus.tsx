"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export function AuthStatus() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setEmail(user?.email ?? null);

      if (user) {
        const ADMIN_USER_ID = "4764a298-fab5-401d-bbbb-3da03c86ce08";
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        setIsAdmin(profile?.role === "admin" || user.id === ADMIN_USER_ID);
      } else {
        setIsAdmin(false);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      if (!session?.user) setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!email) return null;

  const initial = email[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex items-center gap-1.5">
      {isAdmin && (
        <Link
          href="/admin"
          className={`hidden rounded-lg border border-accent/40 bg-accent/10 px-2 py-1 text-xs font-semibold text-accent transition hover:bg-accent/20 sm:inline-flex ${
            pathname.startsWith("/admin") ? "ring-1 ring-accent/60" : ""
          }`}
        >
          Admin
        </Link>
      )}
      <Link
        href="/conta"
        title={email}
        className={`flex items-center gap-1.5 rounded-full border border-border-base bg-surface-2 px-2 py-1 ${
          pathname.startsWith("/conta") ? "ring-1 ring-accent/40" : ""
        }`}
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs font-bold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[7rem] truncate text-xs font-medium text-foreground sm:block">
          {email.split("@")[0]}
        </span>
      </Link>
    </div>
  );
}
