import test from "node:test";
import assert from "node:assert/strict";

import { makeMatch } from "./helpers.mjs";
import {
  aggregateTopScorers,
  compareTopScorersFifa,
  countScorersWithGoals,
  isScorerGoalEvent,
  mapApiTopScorers,
  resolveTopScorers,
} from "../src/lib/top-scorers.ts";
import { needsGoalEventsResync } from "../src/lib/match-result.ts";

test("isScorerGoalEvent excludes own goals, missed pens and shootout", () => {
  assert.equal(
    isScorerGoalEvent({
      minute: 22,
      extra: null,
      detail: "Normal Goal",
      player: "Mbappé",
      team_id: 2,
    }),
    true
  );
  assert.equal(
    isScorerGoalEvent({
      minute: 90,
      extra: 2,
      detail: "Penalty",
      player: "Kane",
      team_id: 10,
    }),
    true
  );
  assert.equal(
    isScorerGoalEvent({
      minute: 40,
      extra: null,
      detail: "Own Goal",
      player: "Defender",
      team_id: 10,
    }),
    false
  );
  assert.equal(
    isScorerGoalEvent({
      minute: 70,
      extra: null,
      detail: "Missed Penalty",
      player: "Kane",
      team_id: 10,
    }),
    false
  );
  assert.equal(
    isScorerGoalEvent({
      minute: 125,
      extra: null,
      detail: "Penalty",
      player: "Kimmich",
      team_id: 25,
    }),
    false
  );
});

test("aggregateTopScorers ignores shootout penalties and own goals", () => {
  const matches = [
    makeMatch({
      home_team_id: 25,
      home_team_name: "Germany",
      away_team_id: 2380,
      away_team_name: "Paraguay",
      home_score: 1,
      away_score: 1,
      status: "finished",
      goal_events: [
        {
          minute: 42,
          extra: null,
          detail: "Normal Goal",
          player: "Enciso",
          team_id: 2380,
        },
        {
          minute: 54,
          extra: null,
          detail: "Normal Goal",
          player: "Havertz",
          team_id: 25,
        },
        {
          minute: 80,
          extra: null,
          detail: "Own Goal",
          player: "Rüdiger",
          team_id: 2380,
        },
        {
          minute: 125,
          extra: null,
          detail: "Penalty",
          player: "Kimmich",
          team_id: 25,
        },
        {
          minute: 125,
          extra: null,
          detail: "Penalty",
          player: "Havertz",
          team_id: 25,
        },
        {
          minute: 132,
          extra: null,
          detail: "Penalty",
          player: "Enciso",
          team_id: 2380,
        },
      ],
    }),
    makeMatch({
      home_team_id: 2,
      home_team_name: "France",
      away_team_id: 31,
      away_team_name: "Netherlands",
      home_score: 2,
      away_score: 0,
      status: "finished",
      goal_events: [
        {
          minute: 12,
          extra: null,
          detail: "Normal Goal",
          player: "Mbappé",
          team_id: 2,
        },
        {
          minute: 55,
          extra: null,
          detail: "Normal Goal",
          player: "Mbappé",
          team_id: 2,
        },
      ],
    }),
  ];

  const rows = aggregateTopScorers(matches, 10);
  assert.deepEqual(
    rows.map((r) => ({ player: r.player, goals: r.goals, rank: r.rank })),
    [
      { player: "Mbappé", goals: 2, rank: 1 },
      { player: "Enciso", goals: 1, rank: 2 },
      { player: "Havertz", goals: 1, rank: 3 },
    ]
  );
  assert.equal(countScorersWithGoals(matches), 3);
});

test("compareTopScorersFifa: assistências e minutos desempatam", () => {
  const messi = {
    player: "Messi",
    team_name: "Argentina",
    goals: 7,
    assists: 3,
    minutes: 553,
  };
  const haaland = {
    player: "Haaland",
    team_name: "Norway",
    goals: 7,
    assists: 0,
    minutes: 469,
  };
  assert.ok(compareTopScorersFifa(messi, haaland) < 0);

  const a = { ...messi, assists: 1, minutes: 400 };
  const b = { ...haaland, assists: 1, minutes: 500 };
  assert.ok(compareTopScorersFifa(a, b) < 0);
});

test("mapApiTopScorers ordena como Golden Boot (golos → AS → MIN)", () => {
  const rows = mapApiTopScorers([
    {
      player: { id: 1, name: "Erling Haaland" },
      statistics: [
        {
          team: { id: 109, name: "Norway", logo: "" },
          games: { appearences: 5, minutes: 469 },
          goals: { total: 7, assists: 0 },
          penalty: { scored: 2, missed: 0 },
        },
      ],
    },
    {
      player: { id: 2, name: "Kylian Mbappé" },
      statistics: [
        {
          team: { id: 2, name: "France", logo: "" },
          games: { appearences: 7, minutes: 592 },
          goals: { total: 8, assists: 2 },
          penalty: { scored: 1, missed: 0 },
        },
      ],
    },
    {
      player: { id: 3, name: "Lionel Messi" },
      statistics: [
        {
          team: { id: 26, name: "Argentina", logo: "" },
          games: { appearences: 7, minutes: 553 },
          goals: { total: 7, assists: 3 },
          penalty: { scored: 4, missed: 0 },
        },
      ],
    },
  ]);

  assert.deepEqual(
    rows.map((r) => ({ player: r.player, goals: r.goals, rank: r.rank })),
    [
      { player: "Kylian Mbappé", goals: 8, rank: 1 },
      { player: "Lionel Messi", goals: 7, rank: 2 },
      { player: "Erling Haaland", goals: 7, rank: 3 },
    ]
  );
});

test("resolveTopScorers prefere oficiais à agregação local", () => {
  const matches = [
    makeMatch({
      goal_events: [
        {
          minute: 10,
          extra: null,
          detail: "Normal Goal",
          player: "Local Only",
          team_id: 1,
        },
      ],
    }),
  ];
  const official = mapApiTopScorers([
    {
      player: { id: 9, name: "Kylian Mbappé" },
      statistics: [
        {
          team: { id: 2, name: "France", logo: "" },
          games: { appearences: 7, minutes: 592 },
          goals: { total: 8, assists: 2 },
          penalty: { scored: 1, missed: 0 },
        },
      ],
    },
  ]);
  assert.equal(resolveTopScorers(official, matches)[0].player, "Kylian Mbappé");
  assert.equal(resolveTopScorers([], matches)[0].player, "Local Only");
});

test("needsGoalEventsResync detects missing or mismatched events", () => {
  assert.equal(
    needsGoalEventsResync({
      status: "finished",
      home_score: 2,
      away_score: 1,
      home_team_id: 1,
      away_team_id: 2,
      goal_events: [],
    }),
    true
  );
  assert.equal(
    needsGoalEventsResync({
      status: "finished",
      home_score: 1,
      away_score: 0,
      home_team_id: 1,
      away_team_id: 2,
      goal_events: [
        {
          minute: 20,
          extra: null,
          detail: "Normal Goal",
          player: "A",
          team_id: 1,
        },
      ],
    }),
    false
  );
  assert.equal(
    needsGoalEventsResync({
      status: "finished",
      home_score: 2,
      away_score: 0,
      home_team_id: 1,
      away_team_id: 2,
      goal_events: [
        {
          minute: 20,
          extra: null,
          detail: "Normal Goal",
          player: "A",
          team_id: 1,
        },
      ],
    }),
    true
  );
});
