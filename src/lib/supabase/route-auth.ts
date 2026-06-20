import { createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

type RouteAuthResult =
  | { user: User; supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServer>>> }
  | { error: NextResponse };

/** Sessão do pedido (cookies) para rotas /api/profile. */
export async function requireRouteUser(): Promise<RouteAuthResult> {
  const supabase = await createSupabaseServer();
  if (!supabase) {
    return {
      error: NextResponse.json({ error: "Supabase não configurado" }, { status: 500 }),
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.warn("[route-auth]", error.message);
  }

  if (user) {
    return { user, supabase };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    return { user: session.user, supabase };
  }

  return {
    error: NextResponse.json({ error: "Não autorizado" }, { status: 401 }),
  };
}

export function noStoreJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}
