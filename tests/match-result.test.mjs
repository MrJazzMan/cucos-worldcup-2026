import test from "node:test";
import assert from "node:assert/strict";

import {
  getMatchGoalDisplay,
  getMatchWinnerSide,
  getPenaltyShootoutResult,
  getRegulationScores,
  regulationGoalsForTeam,
} from "../src/lib/match-result.ts";

const germanyParaguay = {
  status: "finished",
  home_team_id: 25,
  away_team_id: 2380,
  home_score: 1,
  away_score: 1,
  goal_events: [
    { minute: 42, extra: null, detail: "Normal Goal", player: "Enciso", team_id: 2380 },
    { minute: 54, extra: null, detail: "Normal Goal", player: "Havertz", team_id: 25 },
    { minute: 125, extra: null, detail: "Penalty", player: "Kimmich", team_id: 25 },
    { minute: 125, extra: null, detail: "Penalty", player: "Gómez", team_id: 2380 },
    { minute: 132, extra: null, detail: "Penalty", player: "Canale", team_id: 2380 },
  ],
};

test("regulationGoalsForTeam excludes shootout penalties", () => {
  const home = regulationGoalsForTeam(germanyParaguay.goal_events, 25);
  assert.equal(home.length, 1);
  assert.equal(home[0].player, "Havertz");
});

test("getPenaltyShootoutResult picks shootout winner", () => {
  const pens = getPenaltyShootoutResult(germanyParaguay);
  assert.ok(pens);
  assert.equal(pens.winner, "away");
  assert.equal(pens.homeScored, 1);
  assert.equal(pens.awayScored, 2);
});

test("getMatchWinnerSide uses score when not tied", () => {
  const winner = getMatchWinnerSide({
    status: "finished",
    home_team_id: 6,
    away_team_id: 12,
    home_score: 2,
    away_score: 1,
    goal_events: [],
  });
  assert.equal(winner, "home");
});

test("getMatchWinnerSide uses pens when tied", () => {
  assert.equal(getMatchWinnerSide(germanyParaguay), "away");
});

test("getRegulationScores derives from goal events when present", () => {
  const scores = getRegulationScores({
    status: "live",
    home_team_id: 2,
    away_team_id: 31,
    home_score: 0,
    away_score: 0,
    goal_events: [
      { minute: 28, extra: null, detail: "Normal Goal", player: "Mbappé", team_id: 2 },
    ],
  });
  assert.equal(scores.home, 1);
  assert.equal(scores.away, 0);
});

test("getMatchGoalDisplay reconciles live lag (2 on API, 3 scorers)", () => {
  const display = getMatchGoalDisplay({
    status: "live",
    home_team_id: 2,
    away_team_id: 31,
    home_score: 2,
    away_score: 0,
    goal_events: [
      { minute: 28, extra: null, detail: "Normal Goal", player: "Mbappé", team_id: 2 },
      { minute: 60, extra: null, detail: "Normal Goal", player: "Mbappé", team_id: 2 },
      { minute: 66, extra: null, detail: "Normal Goal", player: "Dembélé", team_id: 2 },
    ],
  });
  assert.equal(display.scores.home, 3);
  assert.equal(display.homeGoals.length, 3);
});

test("getMatchGoalDisplay hides scorers when finished counts disagree", () => {
  const display = getMatchGoalDisplay({
    status: "finished",
    home_team_id: 2,
    away_team_id: 31,
    home_score: 2,
    away_score: 0,
    goal_events: [
      { minute: 28, extra: null, detail: "Normal Goal", player: "Mbappé", team_id: 2 },
      { minute: 60, extra: null, detail: "Normal Goal", player: "Mbappé", team_id: 2 },
      { minute: 66, extra: null, detail: "Normal Goal", player: "Dembélé", team_id: 2 },
    ],
  });
  assert.equal(display.scores.home, 2);
  assert.equal(display.homeGoals.length, 0);
});

test("getRegulationScores falls back to stored scores without events", () => {
  const scores = getRegulationScores({
    status: "finished",
    home_team_id: 2,
    away_team_id: 31,
    home_score: 2,
    away_score: 1,
    goal_events: [],
  });
  assert.equal(scores.home, 2);
  assert.equal(scores.away, 1);
});
