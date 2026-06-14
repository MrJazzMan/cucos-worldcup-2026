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
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        setIsAdmin(profile?.role === "admin");
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
    <div className="hidden items-center gap-1.5 sm:flex">
      {isAdmin && (
        <Link
          href="/admin"
          className={`rounded-lg border border-accent/40 bg-accent/10 px-2 py-1 text-xs font-semibold text-accent transition hover:bg-accent/20 ${
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
        <span className="max-w-[7rem] truncate text-xs font-medium text-foreground">
          {email.split("@")[0]}
        </span>
      </Link>
    </div>
  );
}
