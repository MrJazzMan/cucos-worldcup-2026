import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthButtons } from "@/components/AuthButtons";
import { AccountPanel } from "@/components/AccountPanel";
import { AuthErrorBanner } from "@/components/AuthErrorBanner";
import { T } from "@/components/Display";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAllTeams } from "@/lib/matches";
import type { NotificationPrefs } from "@/types";

type ContaSearchParams = {
  error?: string;
  error_code?: string;
  error_description?: string;
};

const DEFAULT_PREFS: NotificationPrefs = {
  user_id: "",
  before_24h: true,
  before_1h: true,
  before_15m: true,
  match_started: true,
  final_result: true,
};

export default async function ContaPage({
  searchParams,
}: {
  searchParams: Promise<ContaSearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServer();
  const teams = await getAllTeams();

  if (!supabase) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            <T k="account.title" />
          </h1>
          <p className="mt-1 text-muted">
            <T k="account.needSupabase" />
          </p>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && params.error) {
    redirect("/conta");
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Suspense fallback={null}>
          <AuthErrorBanner />
        </Suspense>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            <T k="account.title" />
          </h1>
          <p className="mt-1 text-muted">
            <T k="account.signInPrompt" />
          </p>
        </div>
        <AuthButtons />
      </div>
    );
  }

  const { data: favourites } = await supabase
    .from("favourite_teams")
    .select("team_id, team_name")
    .eq("user_id", user.id);

  const { data: prefs } = await supabase
    .from("notification_prefs")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, location, role")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <AccountPanel
        user={{ id: user.id, email: user.email }}
        profile={{
          display_name: profile?.display_name ?? null,
          location: (profile as { location?: string } | null)?.location ?? null,
          role: (profile as { role?: string } | null)?.role ?? "user",
        }}
        favourites={favourites ?? []}
        prefs={prefs ?? { ...DEFAULT_PREFS, user_id: user.id }}
        teams={teams}
      />
    </div>
  );
}
