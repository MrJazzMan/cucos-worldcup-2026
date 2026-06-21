import { NextResponse } from "next/server";
import { isSiteAdmin } from "@/lib/admin";
import { verifyCronAuth } from "@/lib/cron-auth";
import { requireRouteUser } from "@/lib/supabase/route-auth";

/** CRON_SECRET (scripts/cron) ou sessão Google do admin do site. */
export async function requireAdminOrCron(
  request: Request
): Promise<NextResponse | null> {
  if (verifyCronAuth(request)) return null;

  const auth = await requireRouteUser();
  if ("error" in auth) return auth.error;

  if (!isSiteAdmin(auth.user.id)) {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }

  return null;
}
