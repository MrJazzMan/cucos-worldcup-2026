import {
  fetchAllFixtures,
  fetchFixturesByDate,
  fetchFixturesByIds,
  fetchLiveFixtures,
  mapFixtureToMatch,
} from "@/lib/api-football";
import { isSyntheticFixture } from "@/lib/feeder-teams";
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

async function protectFinishedFromDowngrade(
  admin: ReturnType<typeof createSupabaseAdmin>,
  rows: ReturnType<typeof mapFixtureToMatch>[]
): Promise<ReturnType<typeof mapFixtureToMatch>[]> {
  if (!rows.length) return rows;

  const ids = rows.map((r) => r.fixture_id);
  const { data: existing } = await admin
    .from("matches")
    .select(
      "fixture_id, status, home_score, away_score, home_pen, away_pen, minute, finished_utc"
    )
    .in("fixture_id", ids)
    .eq("status", "finished");

  if (!existing?.length) return rows;

  const finishedById = new Map(
    existing.map((row) => [row.fixture_id as number, row])
  );

  return rows.map((row) => {
    const prev = finishedById.get(row.fixture_id);
    if (!prev) return row;
    // A API por vezes volta a reportar NS/TBD — nunca apagar um FT conhecido.
    if (row.status === "upcoming" || row.status === "live") {
      return {
        ...row,
        status: "finished" as const,
        home_score: prev.home_score ?? row.home_score,
        away_score: prev.away_score ?? row.away_score,
        home_pen: prev.home_pen ?? row.home_pen ?? null,
        away_pen: prev.away_pen ?? row.away_pen ?? null,
        minute: prev.minute ?? row.minute,
        finished_utc: prev.finished_utc ?? row.finished_utc ?? null,
      };
    }
    return row;
  });
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

      // 30 min após o kickoff — cobre meias-finais/prolongamento sem esperar 2h.
      const staleCutoff = new Date(
        Date.now() - 30 * 60 * 1000
      ).toISOString();

      const [live, dayNow, dayPrev, staleLiveRows, staleUpcomingRows] =
        await Promise.all([
          fetchLiveFixtures(),
          fetchFixturesByDate(today.toISOString().slice(0, 10)),
          fetchFixturesByDate(yesterday.toISOString().slice(0, 10)),
          admin.from("matches").select("fixture_id").eq("status", "live"),
          admin
            .from("matches")
            .select("fixture_id")
            .eq("status", "upcoming")
            .lt("kickoff_utc", staleCutoff),
        ]);

      const staleFixtureIds = [
        ...(staleLiveRows.data ?? []).map((m) => m.fixture_id),
        ...(staleUpcomingRows.data ?? []).map((m) => m.fixture_id),
      ].filter((id) => !isSyntheticFixture(id));
      const uniqueStaleIds = [...new Set(staleFixtureIds)];
      const staleFixtures =
        uniqueStaleIds.length > 0
          ? await fetchFixturesByIds(uniqueStaleIds)
          : [];

      // Live + hoje/ontem + jogos presos em live/upcoming na BD (apanha FT que saiu do feed).
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

    if (!fixtures.length && mode === "live") {
      return { synced: 0, source: "api-football-empty" };
    }

    const mapped = fixtures.map(mapFixtureToMatch);
    const rows = await protectFinishedFromDowngrade(admin, mapped);
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
      // Full sync: corrige FT cujo placar não bate com goal_events (marcadores a menos).
      resyncMismatched: mode === "full",
      fixtures,
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

    await purgeMockMatches(admin);
    if (mode === "full") {
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
    // Live nunca semeia mocks — evita poluir o calendário do Mundial.
    if (mode === "live") {
      return {
        synced: 0,
        source: "api-error",
        error: serializeSyncError(err),
      };
    }
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
