import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Apaga o utilizador em auth.users. Tabelas public.* com FK ON DELETE CASCADE
 * (profiles, favourite_teams, notification_prefs, push_subscriptions,
 * notification_log) são limpas automaticamente.
 */
export async function deleteUserAccount(
  admin: SupabaseClient,
  userId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
