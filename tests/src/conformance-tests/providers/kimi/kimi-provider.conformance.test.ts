import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { describe, it } from "vitest";

import {
  ArtifactKind,
  createProviderContext,
  KIMI,
  OwnershipKind,
} from "../../../../../src/core/index.ts";
import { KimiProviderAdapter } from "../../../../../src/providers/kimi-provider.ts";
import {
  KIMI_CONTRACT_VERIFIED_ON,
  KIMI_OFFICIAL_SOURCE,
  KIMI_RUNTIME_MANIFEST_SOURCE,
} from "./official-contract.ts";
import { makeKimiConformancePlugin } from "./plugin-fixture.ts";

describe("Kimi provider conformance", () => {
  it("matches the official Kimi plugin manifest golden artifact", async () => {
    // GIVEN: Official Kimi references verified on the fixture date and an exact golden.
    assert.equal(KIMI_CONTRACT_VERIFIED_ON, "2026-08-10");
    assert.equal(
      KIMI_OFFICIAL_SOURCE,
      "https://www.kimi.com/code/docs/en/kimi-code-cli/customization/plugins.html#plugin-manifest",
    );
    assert.equal(
      KIMI_RUNTIME_MANIFEST_SOURCE,
      "https://github.com/MoonshotAI/kimi-code/blob/0401ec4286f37929d1d298527c05f5351850bf8a/packages/agent-core/src/plugin/manifest.ts",
    );
    const expected = await readFile(
      new URL("./expected-plugin.json", import.meta.url),
      "utf8",
    );

    // WHEN: Kimi compiles the provider-neutral plugin.
    const fragment = new KimiProviderAdapter().compile(
      createProviderContext(makeKimiConformancePlugin()),
    );
    const artifact = fragment.artifacts[0];
    const artifactPaths = fragment.artifacts.map((entry) => entry.path);
    const expectedPaths = ["kimi.plugin.json"];

    // THEN: The required manifest bytes and actual owned path match exactly.
    assert.equal(fragment.ownerId, KIMI);
    assert.equal(fragment.ownership.kind, OwnershipKind.ExactFiles);
    assert.ok(fragment.ownership.kind === OwnershipKind.ExactFiles);
    assert.deepEqual(fragment.ownership.paths, expectedPaths);
    assert.equal(new Set(artifactPaths).size, artifactPaths.length);
    assert.deepEqual(artifactPaths, expectedPaths);
    assert.ok(artifact?.kind === ArtifactKind.File);
    assert.equal(artifact.path, "kimi.plugin.json");
    assert.equal(artifact.content.toString("utf8"), expected);
  });
});
