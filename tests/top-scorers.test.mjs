import test from "node:test";
import assert from "node:assert/strict";

import { makeMatch } from "./helpers.mjs";
import {
  aggregateTopScorers,
  countScorersWithGoals,
  isScorerGoalEvent,
} from "../src/lib/top-scorers.ts";

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
      { player: "Havertz", goals: 1, rank: 2 },
    ]
  );
  assert.equal(countScorersWithGoals(matches), 3);
});

test("aggregateTopScorers shares rank on tied goal totals", () => {
  const matches = [
    makeMatch({
      home_team_id: 1,
      home_team_name: "A",
      away_team_id: 2,
      away_team_name: "B",
      goal_events: [
        {
          minute: 10,
          extra: null,
          detail: "Normal Goal",
          player: "Alpha",
          team_id: 1,
        },
        {
          minute: 20,
          extra: null,
          detail: "Normal Goal",
          player: "Alpha",
          team_id: 1,
        },
        {
          minute: 30,
          extra: null,
          detail: "Normal Goal",
          player: "Bravo",
          team_id: 2,
        },
        {
          minute: 40,
          extra: null,
          detail: "Normal Goal",
          player: "Bravo",
          team_id: 2,
        },
        {
          minute: 50,
          extra: null,
          detail: "Normal Goal",
          player: "Charlie",
          team_id: 1,
        },
      ],
    }),
  ];

  const rows = aggregateTopScorers(matches);
  assert.equal(rows[0].rank, 1);
  assert.equal(rows[1].rank, 1);
  assert.equal(rows[2].player, "Charlie");
  assert.equal(rows[2].rank, 3);
});
