/** Único utilizador com acesso ao painel admin (hardcoded). */
export const SITE_ADMIN_USER_ID = "4764a298-fab5-401d-bbbb-3da03c86ce08";

export function isSiteAdmin(userId: string | undefined | null): boolean {
  return userId === SITE_ADMIN_USER_ID;
}
