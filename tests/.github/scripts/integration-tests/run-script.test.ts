import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, it } from "vitest";

import {
  appendGitHubOutput,
  requireEnvironment,
  requireSuccess,
} from "../../../../.github/scripts/run-script.ts";

describe("run script support", () => {
  it("writes stable GitHub outputs", async () => {
    // GIVEN: A fresh GitHub output file.
    const directory = await mkdtemp(path.join(tmpdir(), "apc-output-"));
    const outputPath = path.join(directory, "output");
    try {
      // WHEN: Public output values are appended.
      await appendGitHubOutput(outputPath, {
        needs_publish: true,
        run_id: "42",
      });

      // THEN: GitHub receives snake-case line-based values.
      assert.equal(
        await readFile(outputPath, "utf8"),
        "needs_publish=true\nrun_id=42\n",
      );
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("reports missing environment and failed commands", () => {
    // GIVEN: No requested environment value and a failed result.
    const environment = {};
    const failed = { exitCode: 7, stderr: "failure", stdout: "" };

    // WHEN: Public guards validate the boundaries.
    const readingEnvironment = () => requireEnvironment(environment, "TOKEN");
    const requiringSuccess = () => requireSuccess(failed, "Operation");

    // THEN: Both failures contain actionable context.
    assert.throws(readingEnvironment, /TOKEN/);
    assert.throws(requiringSuccess, /exit code 7.*failure/s);
  });
});
