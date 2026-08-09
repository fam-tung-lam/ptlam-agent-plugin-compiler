import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, it } from "vitest";

import { packReleaseCandidate } from "../../../../.github/scripts/pack-release-candidate.ts";

describe("pack release candidate", () => {
  it("exercises and returns the only packed artifact", async () => {
    // GIVEN: npm reports one deterministic tarball.
    const directory = await mkdtemp(path.join(tmpdir(), "apc-pack-"));
    const exercised: string[] = [];
    try {
      // WHEN: The public pack orchestration runs.
      const candidate = await packReleaseCandidate(directory, {
        async exercise(tarballPath) {
          exercised.push(tarballPath);
        },
        async listTarballs() {
          return ["package-1.0.0.tgz"];
        },
        async pack() {
          return { integrity: "sha512-YWJj", shasum: "a".repeat(40) };
        },
      });

      // THEN: The exact returned artifact is exercised and exposed to the workflow.
      assert.equal(candidate.name, "package-1.0.0.tgz");
      assert.deepEqual(exercised, [candidate.path]);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
});
