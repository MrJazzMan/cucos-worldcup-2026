import assert from "node:assert/strict";
import test from "node:test";
import { fillChannelsFromOndeBola } from "@/lib/broadcast-ondebola";

test("fillChannelsFromOndeBola resolves R16 channels from OndeBola", async () => {
  const matches = [
    {
      fixture_id: 900_000_093,
      kickoff_utc: "2026-07-06T19:00:00.000Z",
      match_date: "2026-07-06",
      home_team_name: "Portugal",
      away_team_name: "Spain",
      home_team_id: 27,
      away_team_id: 5,
      home_team_logo: null,
      away_team_logo: null,
      home_score: null,
      away_score: null,
      status: "upcoming",
      minute: null,
      round: "Round of 16",
      group_name: null,
      venue: "Dallas",
      channels: [],
    },
  ];

  const filled = await fillChannelsFromOndeBola(matches);
  assert.ok(filled[0].channels.length > 0);
  assert.ok(filled[0].channels.some((c) => /sport\.tv/i.test(c)));
});

test("fillChannelsFromOndeBola skips feeder placeholders", async () => {
  const matches = [
    {
      fixture_id: 900_000_089,
      kickoff_utc: "2026-07-04T21:00:00.000Z",
      match_date: "2026-07-04",
      home_team_name: "FIFA_WINNER:74",
      away_team_name: "FIFA_WINNER:77",
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
      venue: "Test",
      channels: [],
    },
  ];

  const filled = await fillChannelsFromOndeBola(matches);
  assert.deepEqual(filled[0].channels, []);
});
