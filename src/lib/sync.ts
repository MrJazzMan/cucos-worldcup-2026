import {
  fetchAllFixtures,
  fetchLiveFixtures,
  mapFixtureToMatch,
} from "@/lib/api-football";
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

  const validIds = new Set(
    (await fetchAllFixtures()).map((f) => f.fixture.id)
  );

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
    const fixtures =
      mode === "live" ? await fetchLiveFixtures() : await fetchAllFixtures();

    if (!fixtures.length && mode === "full") {
      await seedMockMatches(admin);
      return { synced: MOCK_MATCHES.length, source: "mock-fallback" };
    }

    const rows = fixtures.map(mapFixtureToMatch);
    const { error } = await admin.from("matches").upsert(rows, {
      onConflict: "fixture_id",
    });

    if (error) throw error;

    if (mode === "full") {
      await purgeMockMatches(admin);
    }

    if (mode === "live") {
      await purgeNonWorldCupMatches(admin);
    }

    return { synced: rows.length, source: "api-football" };
  } catch (err) {
    console.error("Sync error:", err);
    await seedMockMatches(admin);
    return { synced: MOCK_MATCHES.length, source: "mock-fallback", error: String(err) };
  }
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
