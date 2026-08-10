import assert from "node:assert/strict";

import { describe, it } from "vitest";
import {
  createCheckResult,
  createCompileResult,
} from "../../../../src/compiler/results.ts";
import {
  CODEX,
  createProjectPath,
  DriftReason,
  type Plugin,
} from "../../../../src/core/index.ts";

const plugin = Object.freeze({}) as Plugin;

describe("compiler results", () => {
  it("reports check drift without the retired differences alias", () => {
    // GIVEN: One manifest-selected provider and one generated-state mismatch.

    // WHEN: The immutable check result is created.
    const result = createCheckResult({
      plugin,
      providers: [CODEX],
      providerSelectionSource: "manifest",
      warnings: [],
      drift: [
        {
          path: createProjectPath("skills/missing"),
          reason: DriftReason.Missing,
        },
      ],
    });

    // THEN: Drift and effective selection are immutable public facts.
    assert.equal(result.upToDate, false);
    assert.deepEqual(result.providers, [CODEX]);
    assert.equal(result.providerSelectionSource, "manifest");
    assert.equal(Object.isFrozen(result.providers), true);
    assert.equal(Object.isFrozen(result.drift), true);
    assert.equal("differences" in result, false);
  });

  it("derives compile verification from drift", () => {
    // GIVEN: One explicit empty override and no post-write drift.

    // WHEN: The immutable compile result is created.
    const result = createCompileResult({
      plugin,
      providers: [],
      providerSelectionSource: "override",
      warnings: [],
      drift: [],
      writeResult: {
        changedPaths: [createProjectPath("skills")],
        unchangedPaths: [],
      },
    });

    // THEN: Verification and the explicit shared-only selection are exposed.
    assert.equal(result.verified, true);
    assert.deepEqual(result.providers, []);
    assert.equal(result.providerSelectionSource, "override");
    assert.deepEqual(result.writeResult.changedPaths, ["skills"]);
    assert.equal("differences" in result, false);
  });
});
