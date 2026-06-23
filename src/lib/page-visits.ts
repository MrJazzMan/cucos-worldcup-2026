import { createSupabaseBrowser } from "@/lib/supabase/browser";

const SESSION_STORAGE_KEY = "wc26_session_id";

const inflight = new Set<string>();
const DEDUP_MS = 1500;

function getOrCreateSessionId(): string | null {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    return id;
  } catch {
    return null;
  }
}

/** Regista uma visita; falhas são ignoradas para não afectar a UX. */
export async function trackPageVisit(page: string): Promise<void> {
  if (inflight.has(page)) return;
  inflight.add(page);

  try {
    const supabase = createSupabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("page_visits").insert({
      user_id: user?.id ?? null,
      session_id: getOrCreateSessionId(),
      page,
    });
  } catch {
    // Analytics silencioso — nunca bloquear a app
  } finally {
    setTimeout(() => inflight.delete(page), DEDUP_MS);
  }
}
