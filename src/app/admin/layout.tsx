import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSiteAdmin } from "@/lib/admin";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();

  if (!supabase) redirect("/");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  if (!isSiteAdmin(user.id)) redirect("/");

  return <>{children}</>;
}
