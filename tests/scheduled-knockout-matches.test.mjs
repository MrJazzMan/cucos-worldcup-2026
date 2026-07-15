import assert from "node:assert/strict";
import test from "node:test";
import { appendScheduledKnockoutMatches } from "@/lib/scheduled-knockout-matches";
import { knockoutRoundKey } from "@/lib/knockout-bracket";
import { syntheticFixtureId } from "@/lib/feeder-teams";

function match(partial) {
  return {
    fixture_id: partial.fixture_id ?? 1,
    kickoff_utc: partial.kickoff_utc ?? "2026-06-28T18:00:00.000Z",
    match_date: (partial.kickoff_utc ?? "2026-06-28T18:00:00.000Z").slice(0, 10),
    home_team_id: partial.home_team_id ?? 1,
    home_team_name: partial.home_team_name ?? "Home",
    home_team_logo: null,
    away_team_id: partial.away_team_id ?? 2,
    away_team_name: partial.away_team_name ?? "Away",
    away_team_logo: null,
    home_score: partial.home_score ?? null,
    away_score: partial.away_score ?? null,
    home_pen: partial.home_pen ?? null,
    away_pen: partial.away_pen ?? null,
    status: partial.status ?? "upcoming",
    minute: null,
    round: partial.round ?? "Round of 32",
    group_name: null,
    venue: partial.venue ?? "Test",
    channels: [],
  };
}

function finishedR32(fifa, homeId, homeName, awayId, awayName, homeWins = true) {
  return match({
    fixture_id: 1000 + fifa,
    home_team_id: homeId,
    home_team_name: homeName,
    away_team_id: awayId,
    away_team_name: awayName,
    home_score: homeWins ? 2 : 1,
    away_score: homeWins ? 1 : 2,
    status: "finished",
    round: "Round of 32",
    kickoff_utc: `2026-06-${String(28 + (fifa % 3)).padStart(2, "0")}T18:00:00.000Z`,
  });
}

const R32_TEAMS = [
  [73, 101, "A73", 102, "B73"],
  [74, 111, "A74", 112, "B74"],
  [75, 121, "A75", 122, "B75"],
  [76, 131, "A76", 132, "B76"],
  [77, 141, "A77", 142, "B77"],
  [78, 151, "A78", 152, "B78"],
  [79, 161, "A79", 162, "B79"],
  [80, 171, "A80", 172, "B80"],
  [81, 181, "A81", 182, "B81"],
  [82, 191, "A82", 192, "B82"],
  [83, 201, "A83", 202, "B83"],
  [84, 211, "A84", 212, "B84"],
  [85, 221, "A85", 222, "B85"],
  [86, 231, "A86", 232, "B86"],
  [87, 241, "A87", 242, "B87"],
  [88, 251, "A88", 252, "B88"],
];

test("appendScheduledKnockoutMatches cria R16→Final e 3.º lugar", () => {
  const r32 = R32_TEAMS.map(([fifa, hId, hN, aId, aN]) =>
    finishedR32(fifa, hId, hN, aId, aN, true)
  );
  const all = appendScheduledKnockoutMatches(r32);

  assert.ok(all.some((m) => m.fixture_id === syntheticFixtureId(89)));
  assert.ok(all.some((m) => m.fixture_id === syntheticFixtureId(97)));
  assert.ok(all.some((m) => m.fixture_id === syntheticFixtureId(101)));
  assert.ok(all.some((m) => m.fixture_id === syntheticFixtureId(103)));
  assert.ok(all.some((m) => m.fixture_id === syntheticFixtureId(104)));

  const third = all.find((m) => m.fixture_id === syntheticFixtureId(103));
  assert.equal(knockoutRoundKey(third.round), "third");
  const final = all.find((m) => m.fixture_id === syntheticFixtureId(104));
  assert.equal(knockoutRoundKey(final.round), "final");
});

test("appendScheduledKnockoutMatches não pára quando já há R16 reais", () => {
  const r32 = R32_TEAMS.map(([fifa, hId, hN, aId, aN]) =>
    finishedR32(fifa, hId, hN, aId, aN, true)
  );
  const realR16 = match({
    fixture_id: 555001,
    home_team_id: 111,
    home_team_name: "A74",
    away_team_id: 141,
    away_team_name: "A77",
    home_score: 1,
    away_score: 0,
    status: "finished",
    round: "Round of 16",
    kickoff_utc: "2026-07-04T21:00:00.000Z",
  });

  const all = appendScheduledKnockoutMatches([...r32, realR16]);
  assert.ok(all.some((m) => m.fixture_id === syntheticFixtureId(103)));
  assert.ok(all.some((m) => m.fixture_id === syntheticFixtureId(104)));
  assert.ok(all.some((m) => m.fixture_id === 555001));
  // Prefere o fixture real do M89; se o mapa R32 não alinhar feeders,
  // o sintético pode coexistir — o importante é haver final/3.º lugar.
  const m89Synthetic = all.find((m) => m.fixture_id === syntheticFixtureId(89));
  if (m89Synthetic) {
    assert.equal(m89Synthetic.status, "upcoming");
  }
});
