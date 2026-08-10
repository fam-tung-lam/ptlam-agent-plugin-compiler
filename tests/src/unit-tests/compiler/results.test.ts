import assert from "node:assert/strict";

import { describe, it } from "vitest";
import {
  createCheckResult,
  createCompileResult,
} from "../../../../src/compiler/results.ts";
import {
  createProjectPath,
  DriftReason,
  type Plugin,
} from "../../../../src/core/index.ts";

const plugin = Object.freeze({}) as Plugin;

describe("compiler results", () => {
  it("reports check drift without the retired differences alias", () => {
    const result = createCheckResult({
      plugin,
      warnings: [],
      drift: [
        {
          path: createProjectPath("skills/missing"),
          reason: DriftReason.Missing,
        },
      ],
    });

    assert.equal(result.upToDate, false);
    assert.equal(Object.isFrozen(result.drift), true);
    assert.equal("differences" in result, false);
  });

  it("derives compile verification from drift", () => {
    const result = createCompileResult({
      plugin,
      warnings: [],
      drift: [],
      writeResult: {
        changedPaths: [createProjectPath("skills")],
        unchangedPaths: [],
      },
    });

    assert.equal(result.verified, true);
    assert.deepEqual(result.writeResult.changedPaths, ["skills"]);
    assert.equal("differences" in result, false);
  });
});
