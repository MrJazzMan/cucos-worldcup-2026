import {
  fetchAllFixtures,
  fetchFixturesByDate,
  fetchFixturesByIds,
  fetchLiveFixtures,
  mapFixtureToMatch,
} from "@/lib/api-football";
import { syncGoalEventsForFixtures } from "@/lib/match-events";
import { syncGroupStandings } from "@/lib/standings";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { MOCK_MATCHES } from "@/lib/mock-data";

const MOCK_FIXTURE_IDS = MOCK_MATCHES.map((m) => m.fixture_id);

async function purgeMockMatches(admin: ReturnType<typeof createSupabaseAdmin>) {
  await admin.from("matches").delete().in("fixture_id", MOCK_FIXTURE_IDS);
}

/** Remove jogos que não são do Mundial (ex.: live sync de outras ligas). */
async function purgeNonWorldCupMatches(
  admin: ReturnType<typeof createSupabaseAdmin>
) {
  const { data: all } = await admin.from("matches").select("fixture_id");
  if (!all?.length) return;

  const fixtures = await fetchAllFixtures();
  if (!fixtures.length) {
    console.warn(
      "purgeNonWorldCupMatches: fetchAllFixtures vazio — purge ignorado"
    );
    return;
  }

  const validIds = new Set(fixtures.map((f) => f.fixture.id));

  // Protege contra respostas parciais / rate-limit que apagariam o calendário inteiro.
  if (validIds.size < 40) {
    console.warn(
      `purgeNonWorldCupMatches: só ${validIds.size} fixtures válidos — purge ignorado`
    );
    return;
  }

  const toDelete = all
    .filter((m) => !validIds.has(m.fixture_id))
    .map((m) => m.fixture_id);

  if (toDelete.length) {
    await admin.from("matches").delete().in("fixture_id", toDelete);
  }
}

export async function syncMatches(mode: "full" | "live" = "full") {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { synced: MOCK_MATCHES.length, source: "mock-no-supabase" };
  }

  const admin = createSupabaseAdmin();

  if (!process.env.API_FOOTBALL_KEY) {
    await seedMockMatches(admin);
    return { synced: MOCK_MATCHES.length, source: "mock" };
  }

  try {
    let fixtures;
    if (mode === "live") {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setUTCDate(today.getUTCDate() - 1);

      const [live, dayNow, dayPrev, staleLiveRows] = await Promise.all([
        fetchLiveFixtures(),
        fetchFixturesByDate(today.toISOString().slice(0, 10)),
        fetchFixturesByDate(yesterday.toISOString().slice(0, 10)),
        admin.from("matches").select("fixture_id").eq("status", "live"),
      ]);

      const staleLiveIds = (staleLiveRows.data ?? []).map((m) => m.fixture_id);
      const staleFixtures =
        staleLiveIds.length > 0 ? await fetchFixturesByIds(staleLiveIds) : [];

      // Live + hoje/ontem + jogos ainda marcados live na BD (apanha FT que saiu do feed).
      const dedup = new Map<number, (typeof live)[number]>();
      [...live, ...dayNow, ...dayPrev, ...staleFixtures].forEach((f) =>
        dedup.set(f.fixture.id, f)
      );
      fixtures = [...dedup.values()];
    } else {
      fixtures = await fetchAllFixtures();
    }

    if (!fixtures.length && mode === "full") {
      await seedMockMatches(admin);
      return { synced: MOCK_MATCHES.length, source: "mock-fallback" };
    }

    const rows = fixtures.map(mapFixtureToMatch);
    let { error } = await admin.from("matches").upsert(rows, {
      onConflict: "fixture_id",
    });

    // Fallback: se a migração dos penáltis (021) ainda não foi aplicada,
    // a coluna home_pen/away_pen não existe — repete sem esses campos.
    if (error && /home_pen|away_pen/.test(error.message ?? "")) {
      const rowsNoPen = rows.map(({ home_pen, away_pen, ...rest }) => {
        void home_pen;
        void away_pen;
        return rest;
      });
      ({ error } = await admin.from("matches").upsert(rowsNoPen, {
        onConflict: "fixture_id",
      }));
    }

    if (error) throw error;

    const eventFixtureIds = rows
      .filter((r) => r.status === "live" || r.status === "finished")
      .map((r) => r.fixture_id);
    const goalsSynced = await syncGoalEventsForFixtures(eventFixtureIds, {
      resyncLive: mode === "live",
    });

    let standingsSynced = 0;
    let standingsGroupMatches = 0;
    let standingsTeamsMapped = 0;
    let standingsError: string | undefined;
    try {
      const standings = await syncGroupStandings();
      standingsSynced = standings.groups;
      standingsGroupMatches = standings.groupMatches;
      standingsTeamsMapped = standings.teamsMapped;
    } catch (err) {
      standingsError = serializeSyncError(err);
      console.warn("Standings sync failed:", err);
    }

    if (mode === "full") {
      await purgeMockMatches(admin);
      await purgeNonWorldCupMatches(admin);
    }

    return {
      synced: rows.length,
      goalsSynced,
      standingsSynced,
      standingsGroupMatches,
      standingsTeamsMapped,
      ...(standingsError ? { standingsError } : {}),
      source: "api-football",
    };
  } catch (err) {
    console.error("Sync error:", err);
    await seedMockMatches(admin);
    return {
      synced: MOCK_MATCHES.length,
      source: "mock-fallback",
      error: serializeSyncError(err),
    };
  }
}

function serializeSyncError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return JSON.stringify(err);
}

async function seedMockMatches(
  admin: ReturnType<typeof createSupabaseAdmin>
) {
  await admin.from("matches").upsert(MOCK_MATCHES, {
    onConflict: "fixture_id",
  });

  const portugalMatches = MOCK_MATCHES.filter(
    (m) =>
      m.home_team_name === "Portugal" || m.away_team_name === "Portugal"
  );

  if (portugalMatches.length) {
    await admin.from("broadcasts").upsert(
      portugalMatches.map((m) => ({
        fixture_id: m.fixture_id,
        channels: ["RTP1"],
        notes: "Curadoria inicial — jogos Portugal",
      })),
      { onConflict: "fixture_id" }
    );
  }
}
