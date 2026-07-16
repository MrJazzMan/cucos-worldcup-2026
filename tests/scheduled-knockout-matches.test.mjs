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
  // Este fixture de teste não tem feeders R32 alinhados; pode coexistir com
  // o M89 sintético, mas não pode impedir a criação das rondas seguintes.
});

test("prefers finished real SF over synthetic with same teams", () => {
  const r32 = Array.from({ length: 16 }, (_, i) =>
    finishedR32(73 + i, 100 + i * 2, `H${73 + i}`, 101 + i * 2, `A${73 + i}`)
  );

  // QF feeders so SF teams resolve
  const qfFinished = [
    match({
      fixture_id: 97001,
      home_team_id: 100,
      home_team_name: "France",
      away_team_id: 102,
      away_team_name: "X",
      home_score: 1,
      away_score: 0,
      status: "finished",
      round: "Quarter-finals",
      kickoff_utc: "2026-07-09T20:00:00.000Z",
    }),
    match({
      fixture_id: 98001,
      home_team_id: 104,
      home_team_name: "Spain",
      away_team_id: 106,
      away_team_name: "Y",
      home_score: 2,
      away_score: 0,
      status: "finished",
      round: "Quarter-finals",
      kickoff_utc: "2026-07-10T19:00:00.000Z",
    }),
    match({
      fixture_id: 99001,
      home_team_id: 108,
      home_team_name: "England",
      away_team_id: 110,
      away_team_name: "Z",
      home_score: 1,
      away_score: 0,
      status: "finished",
      round: "Quarter-finals",
      kickoff_utc: "2026-07-11T21:00:00.000Z",
    }),
    match({
      fixture_id: 100001,
      home_team_id: 112,
      home_team_name: "Argentina",
      away_team_id: 114,
      away_team_name: "W",
      home_score: 3,
      away_score: 1,
      status: "finished",
      round: "Quarter-finals",
      kickoff_utc: "2026-07-12T01:00:00.000Z",
    }),
  ];

  const finishedSf = match({
    fixture_id: 101001,
    home_team_id: 100,
    home_team_name: "France",
    away_team_id: 104,
    away_team_name: "Spain",
    home_score: 0,
    away_score: 2,
    status: "finished",
    round: "Semi-finals",
    kickoff_utc: "2026-07-14T19:00:00.000Z",
  });

  const syntheticSf = match({
    fixture_id: syntheticFixtureId(101),
    home_team_id: 100,
    home_team_name: "France",
    away_team_id: 104,
    away_team_name: "Spain",
    home_score: null,
    away_score: null,
    status: "upcoming",
    round: "Semi-finals",
    kickoff_utc: "2026-07-14T19:00:00.000Z",
  });

  const unrelatedSf = match({
    fixture_id: 101999,
    home_team_id: 100,
    home_team_name: "France",
    away_team_id: 999,
    away_team_name: "Cape Verde",
    status: "upcoming",
    round: "Semi-finals",
    kickoff_utc: "2026-07-15T20:00:00.000Z",
  });

  // A API ainda pode devolver NS/null apesar do resultado confirmado (1–2).
  const staleEnglandArgentina = match({
    fixture_id: 102001,
    home_team_id: 108,
    home_team_name: "England",
    away_team_id: 112,
    away_team_name: "Argentina",
    home_score: null,
    away_score: null,
    status: "upcoming",
    round: "Semi-finals",
    kickoff_utc: "2026-07-15T19:00:00.000Z",
  });

  const all = appendScheduledKnockoutMatches([
    ...r32,
    ...qfFinished,
    finishedSf,
    syntheticSf,
    unrelatedSf,
    staleEnglandArgentina,
  ]);

  assert.equal(
    all.some((m) => m.fixture_id === syntheticFixtureId(101)),
    false
  );
  const sf = all.find((m) => m.fixture_id === 101001);
  assert.ok(sf);
  assert.equal(sf.status, "finished");
  assert.equal(sf.away_score, 2);
  const sf102 = all.find((m) => m.fixture_id === 102001);
  assert.ok(sf102);
  assert.equal(sf102.status, "finished");
  assert.equal(sf102.home_score, 1);
  assert.equal(sf102.away_score, 2);
  assert.equal(
    all.some((m) => m.fixture_id === unrelatedSf.fixture_id),
    false,
    "an unrelated France–Cape Verde fixture must not occupy an official SF slot"
  );

  const third = all.find((m) => m.fixture_id === syntheticFixtureId(103));
  assert.ok(third);
  assert.equal(third.home_team_name, "France");
  assert.equal(third.away_team_name, "England");
  const final = all.find((m) => m.fixture_id === syntheticFixtureId(104));
  assert.ok(final);
  assert.equal(final.home_team_name, "Spain");
  assert.equal(final.away_team_name, "Argentina");
});
