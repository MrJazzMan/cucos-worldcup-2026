import { AuthButtons } from "@/components/AuthButtons";
import { AccountPanel } from "@/components/AccountPanel";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAllTeams } from "@/lib/matches";
import type { NotificationPrefs } from "@/types";

const DEFAULT_PREFS: NotificationPrefs = {
  user_id: "",
  before_24h: true,
  before_1h: true,
  before_15m: true,
  match_started: true,
  final_result: true,
};

export default async function ContaPage() {
  const supabase = await createSupabaseServer();
  const teams = await getAllTeams();

  if (!supabase) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Conta</h1>
          <p className="mt-1 text-zinc-400">
            Configura Supabase para activar autenticação.
          </p>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Conta</h1>
          <p className="mt-1 text-zinc-400">
            Inicia sessão para guardar equipas favoritas e receber notificações.
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

  return (
    <AccountPanel
      user={{ id: user.id, email: user.email }}
      favourites={favourites ?? []}
      prefs={prefs ?? { ...DEFAULT_PREFS, user_id: user.id }}
      teams={teams}
    />
  );
}
