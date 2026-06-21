import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

type RouteAuthResult =
  | { user: User; supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServer>>> }
  | { error: NextResponse };

async function userFromBearerToken(request: Request): Promise<User | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;

  const token = header.slice(7).trim();
  if (!token) return null;

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error,
  } = await client.auth.getUser(token);

  if (error) {
    console.warn("[route-auth] bearer", error.message);
    return null;
  }
  return user ?? null;
}

/** Sessão do pedido (cookies ou Bearer) para rotas API autenticadas. */
export async function requireRouteUser(request?: Request): Promise<RouteAuthResult> {
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

  if (request) {
    const bearerUser = await userFromBearerToken(request);
    if (bearerUser) {
      return { user: bearerUser, supabase };
    }
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
