import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLiveSyncSlots,
  LIVE_SYNC_CATCHUP_OFFSETS_MIN,
  LIVE_SYNC_POST_KICKOFF_MIN,
} from "@/lib/live-sync-schedule";
import {
  matchNeedsScoreRefresh,
  matchesNeedScoreRefresh,
} from "@/lib/stale-score-refresh";

describe("buildLiveSyncSlots", () => {
  it("includes catch-up offsets after the main live window", () => {
    const kickoff = new Date("2026-07-15T19:00:00.000Z");
    const now = new Date("2026-07-15T18:00:00.000Z");
    const slots = buildLiveSyncSlots(kickoff, now);
    const offsetsMin = slots.map(
      (s) => (s.getTime() - kickoff.getTime()) / 60_000
    );

    assert.ok(offsetsMin.includes(LIVE_SYNC_POST_KICKOFF_MIN));
    for (const offset of LIVE_SYNC_CATCHUP_OFFSETS_MIN) {
      assert.ok(
        offsetsMin.includes(offset),
        `missing catch-up offset +${offset}m`
      );
    }
  });

  it("schedules an immediate catch-up when the live window has fully expired", () => {
    const kickoff = new Date("2026-07-15T19:00:00.000Z");
    // +8h — past last catch-up at +420m
    const now = new Date("2026-07-16T03:00:00.000Z");
    const slots = buildLiveSyncSlots(kickoff, now);
    assert.equal(slots.length, 1);
    assert.ok(slots[0].getTime() > now.getTime());
    assert.ok(slots[0].getTime() - now.getTime() < 60_000);
  });
});

describe("matchNeedsScoreRefresh", () => {
  it("detects overdue upcoming real fixtures", () => {
    const now = new Date("2026-07-15T22:30:00.000Z");
    assert.equal(
      matchNeedsScoreRefresh(
        {
          fixture_id: 12345,
          status: "upcoming",
          kickoff_utc: "2026-07-15T19:00:00.000Z",
        },
        now
      ),
      true
    );
  });

  it("ignores synthetic placeholders and finished matches", () => {
    const now = new Date("2026-07-15T22:30:00.000Z");
    assert.equal(
      matchNeedsScoreRefresh(
        {
          fixture_id: 900000102,
          status: "upcoming",
          kickoff_utc: "2026-07-15T19:00:00.000Z",
        },
        now
      ),
      false
    );
    assert.equal(
      matchesNeedScoreRefresh(
        [
          {
            fixture_id: 12345,
            status: "finished",
            kickoff_utc: "2026-07-15T19:00:00.000Z",
          },
        ],
        now
      ),
      false
    );
  });
});
