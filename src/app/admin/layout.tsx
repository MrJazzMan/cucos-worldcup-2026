import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

// Fallback: admin user hardcoded until DB migration 003 is applied
const ADMIN_USER_ID = "4764a298-fab5-401d-bbbb-3da03c86ce08";

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

  if (!user) redirect("/conta");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const isAdmin = profile?.role === "admin" || user.id === ADMIN_USER_ID;
  if (!isAdmin) redirect("/");

  return <>{children}</>;
}
