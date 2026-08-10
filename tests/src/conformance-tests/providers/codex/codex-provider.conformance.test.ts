import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { describe, it } from "vitest";

import {
  ArtifactKind,
  CODEX,
  createProviderContext,
  OwnershipKind,
} from "../../../../../src/core/index.ts";
import { CodexProviderAdapter } from "../../../../../src/providers/index.ts";
import {
  CODEX_CONTRACT_VERIFIED_ON,
  CODEX_OFFICIAL_SOURCE,
} from "./official-contract.ts";
import { makeCodexConformancePlugin } from "./plugin-fixture.ts";

describe("Codex provider conformance", () => {
  it("matches the official Codex plugin manifest golden artifact", async () => {
    // GIVEN: The official OpenAI reference and exact golden verified on the fixture date.
    assert.equal(CODEX_CONTRACT_VERIFIED_ON, "2026-08-08");
    assert.equal(
      CODEX_OFFICIAL_SOURCE,
      "https://developers.openai.com/plugins/build/plugins",
    );
    const expected = await readFile(
      new URL("./expected-plugin.json", import.meta.url),
      "utf8",
    );

    // WHEN: Codex compiles the provider-neutral plugin.
    const fragment = new CodexProviderAdapter().compile(
      createProviderContext(makeCodexConformancePlugin()),
    );
    const artifact = fragment.artifacts[0];
    const artifactPaths = fragment.artifacts.map((entry) => entry.path);
    const expectedPaths = [".codex-plugin/plugin.json"];

    // THEN: The required manifest bytes and actual owned path match exactly.
    assert.equal(fragment.ownerId, CODEX);
    assert.equal(fragment.ownership.kind, OwnershipKind.ExactFiles);
    assert.ok(fragment.ownership.kind === OwnershipKind.ExactFiles);
    assert.deepEqual(fragment.ownership.paths, expectedPaths);
    assert.equal(new Set(artifactPaths).size, artifactPaths.length);
    assert.deepEqual(artifactPaths, expectedPaths);
    assert.ok(artifact?.kind === ArtifactKind.File);
    assert.equal(artifact.path, ".codex-plugin/plugin.json");
    assert.equal(artifact.content.toString("utf8"), expected);
  });
});
