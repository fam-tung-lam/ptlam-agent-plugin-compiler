import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { describe, it } from "vitest";

import {
  ArtifactKind,
  createProviderContext,
  GEMINI,
  OwnershipKind,
} from "../../../../../src/core/index.ts";
import { GeminiProviderAdapter } from "../../../../../src/providers/gemini-provider.ts";
import {
  GEMINI_CONTRACT_VERIFIED_ON,
  GEMINI_EXTENSION_OFFICIAL_SOURCE,
  GEMINI_RUNTIME_SOURCE,
  GEMINI_SKILLS_EXAMPLE_SOURCE,
} from "./official-contract.ts";
import { makeGeminiConformancePlugin } from "./plugin-fixture.ts";

describe("Gemini provider conformance", () => {
  it("matches the official Gemini extension manifest golden artifact", async () => {
    // GIVEN: Official Gemini references verified on the fixture date and exact golden.
    assert.equal(GEMINI_CONTRACT_VERIFIED_ON, "2026-08-10");
    assert.equal(
      GEMINI_EXTENSION_OFFICIAL_SOURCE,
      "https://geminicli.com/docs/extensions/reference/",
    );
    assert.equal(
      GEMINI_RUNTIME_SOURCE,
      "https://github.com/google-gemini/gemini-cli/blob/cf22ac7e86f3dcf528e3ae591fec1c03090a49f8/packages/cli/src/config/extension-manager.ts#L1017-L1044",
    );
    assert.equal(
      GEMINI_SKILLS_EXAMPLE_SOURCE,
      "https://github.com/google-gemini/gemini-cli/tree/cf22ac7e86f3dcf528e3ae591fec1c03090a49f8/packages/cli/src/commands/extensions/examples/skills",
    );
    const expected = await readFile(
      new URL("./expected-extension.json", import.meta.url),
      "utf8",
    );

    // WHEN: Gemini compiles the provider-neutral plugin.
    const fragment = new GeminiProviderAdapter().compile(
      createProviderContext(makeGeminiConformancePlugin()),
    );
    const artifact = fragment.artifacts[0];
    const artifactPaths = fragment.artifacts.map((entry) => entry.path);
    const expectedPaths = ["gemini-extension.json"];

    // THEN: The required manifest bytes and actual owned path match exactly.
    assert.equal(fragment.ownerId, GEMINI);
    assert.equal(fragment.ownership.kind, OwnershipKind.ExactFiles);
    assert.ok(fragment.ownership.kind === OwnershipKind.ExactFiles);
    assert.deepEqual(fragment.ownership.paths, expectedPaths);
    assert.equal(new Set(artifactPaths).size, artifactPaths.length);
    assert.deepEqual(artifactPaths, expectedPaths);
    assert.ok(artifact?.kind === ArtifactKind.File);
    assert.equal(artifact.path, "gemini-extension.json");
    assert.equal(artifact.content.toString("utf8"), expected);
  });
});
