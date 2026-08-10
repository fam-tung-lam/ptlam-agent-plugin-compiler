import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  ArtifactKind,
  createProviderContext,
  GEMINI,
  OwnershipKind,
} from "../../../../src/core/index.ts";
import { GeminiProviderAdapter } from "../../../../src/providers/gemini-provider.ts";
import { makePluginFixture } from "./test-fixtures/plugin-fixture.ts";

describe("GeminiProviderAdapter", () => {
  it("emits one immutable extension manifest with only Gemini metadata", () => {
    // GIVEN: A provider-neutral plugin includes metadata beyond Gemini's contract.
    const plugin = makePluginFixture();

    // WHEN: The pure Gemini adapter compiles its plan fragment.
    const fragment = new GeminiProviderAdapter().compile(
      createProviderContext(plugin),
    );
    const artifact = fragment.artifacts[0];

    // THEN: Gemini owns only its root manifest and relies on conventional skills discovery.
    assert.equal(fragment.ownerId, GEMINI);
    assert.equal(fragment.ownership.kind, OwnershipKind.ExactFiles);
    assert.ok(fragment.ownership.kind === OwnershipKind.ExactFiles);
    assert.deepEqual(fragment.ownership.paths, ["gemini-extension.json"]);
    assert.equal(Object.isFrozen(fragment), true);
    assert.equal(Object.isFrozen(fragment.artifacts), true);
    assert.ok(artifact?.kind === ArtifactKind.File);
    assert.deepEqual(JSON.parse(artifact.content.toString("utf8")), {
      name: "fixture-skills",
      version: "1.2.3",
      description: "Fixture plugin description.",
    });
    assert.equal(
      Object.hasOwn(JSON.parse(artifact.content.toString("utf8")), "skills"),
      false,
    );
  });
});
