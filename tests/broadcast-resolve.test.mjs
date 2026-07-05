import assert from "node:assert/strict";
import test from "node:test";
import {
  enrichMatchesWithBroadcasts,
  findBroadcastChannelsByTeams,
  teamsKickoffMatch,
} from "@/lib/broadcast-resolve";

test("teamsKickoffMatch accepts swapped home/away", () => {
  const a = {
    fixture_id: 1,
    kickoff_utc: "2026-07-06T19:00:00.000Z",
    home_team_name: "Portugal",
    away_team_name: "Espanha",
  };
  const b = {
    fixture_id: 2,
    kickoff_utc: "2026-07-06T19:00:00.000Z",
    home_team_name: "Spain",
    away_team_name: "Portugal",
  };
  assert.equal(teamsKickoffMatch(a, b), true);
});

test("teamsKickoffMatch rejects feeder placeholders", () => {
  const synthetic = {
    fixture_id: 900_000_093,
    kickoff_utc: "2026-07-06T19:00:00.000Z",
    home_team_name: "FIFA_WINNER:83",
    away_team_name: "Espanha",
  };
  const real = {
    fixture_id: 123,
    kickoff_utc: "2026-07-06T19:00:00.000Z",
    home_team_name: "Portugal",
    away_team_name: "Espanha",
  };
  assert.equal(teamsKickoffMatch(synthetic, real), false);
});

test("findBroadcastChannelsByTeams resolves from another fixture_id", () => {
  const target = {
    fixture_id: 900_000_093,
    kickoff_utc: "2026-07-06T19:00:00.000Z",
    home_team_name: "Portugal",
    away_team_name: "Espanha",
  };
  const sources = [
    {
      meta: {
        fixture_id: 999,
        kickoff_utc: "2026-07-06T19:00:00.000Z",
        home_team_name: "Portugal",
        away_team_name: "Spain",
      },
      channels: ["Sport.Tv5"],
    },
  ];
  assert.deepEqual(
    findBroadcastChannelsByTeams(target, sources),
    ["Sport.Tv5"]
  );
});

test("enrichMatchesWithBroadcasts fills synthetic knockout channels", () => {
  const matches = [
    {
      fixture_id: 900_000_091,
      kickoff_utc: "2026-07-05T20:00:00.000Z",
      match_date: "2026-07-05",
      home_team_name: "Brasil",
      away_team_name: "Noruega",
      home_team_id: 1,
      away_team_id: 2,
      home_team_logo: null,
      away_team_logo: null,
      home_score: null,
      away_score: null,
      status: "upcoming",
      minute: null,
      round: "Round of 16",
      group_name: null,
      venue: "MetLife",
      channels: [],
    },
  ];

  const broadcastMap = new Map([
    [12345, ["Sport.Tv5"]],
  ]);

  const sourcesMatch = {
    fixture_id: 12345,
    kickoff_utc: "2026-07-05T20:00:00.000Z",
    home_team_name: "Brazil",
    away_team_name: "Norway",
    match_date: "2026-07-05",
    home_team_id: 1,
    away_team_id: 2,
    home_team_logo: null,
    away_team_logo: null,
    home_score: null,
    away_score: null,
    status: "upcoming",
    minute: null,
    round: "Round of 16",
    group_name: null,
    venue: "MetLife",
    channels: ["Sport.Tv5"],
  };

  const enriched = enrichMatchesWithBroadcasts(
    [...matches, sourcesMatch],
    broadcastMap
  );

  const synthetic = enriched.find((m) => m.fixture_id === 900_000_091);
  assert.deepEqual(synthetic?.channels, ["Sport.Tv5"]);
});
