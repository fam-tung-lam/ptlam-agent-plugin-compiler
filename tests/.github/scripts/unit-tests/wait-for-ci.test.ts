import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  type CiRunReader,
  waitForSuccessfulCi,
} from "../../../../.github/scripts/wait-for-ci.ts";

describe("wait for CI", () => {
  it("waits for and returns the successful run on the release SHA", async () => {
    // GIVEN: CI is queued once before it succeeds.
    let calls = 0;
    const reader: CiRunReader = {
      async listRuns() {
        calls += 1;
        return [
          {
            conclusion: calls === 1 ? null : "success",
            created_at: "2026-08-09T12:00:00Z",
            head_sha: "release",
            id: 42,
            status: calls === 1 ? "queued" : "completed",
          },
        ];
      },
    };

    // WHEN: CD waits through the deterministic reader boundary.
    const runId = await waitForSuccessfulCi("release", reader, {
      delay: async () => {},
      maximumAttempts: 2,
    });

    // THEN: The successful source CI run is selected.
    assert.equal(runId, 42);
    assert.equal(calls, 2);
  });

  it("rejects a completed failed run", async () => {
    // GIVEN: CI completed with a test failure.
    const reader: CiRunReader = {
      async listRuns() {
        return [
          {
            conclusion: "failure",
            head_sha: "release",
            id: 7,
            status: "completed",
          },
        ];
      },
    };

    // WHEN: CD reads the completed run.
    const waiting = waitForSuccessfulCi("release", reader);

    // THEN: Publication is blocked.
    await assert.rejects(waiting, /CI failed.*failure/);
  });
});
