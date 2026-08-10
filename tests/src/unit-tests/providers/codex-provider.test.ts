import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  ArtifactKind,
  CODEX,
  createProviderContext,
  OwnershipKind,
} from "../../../../src/core/index.ts";
import { CodexProviderAdapter } from "../../../../src/providers/index.ts";
import { makePluginFixture } from "./test-fixtures/plugin-fixture.ts";

describe("CodexProviderAdapter", () => {
  it("emits one immutable manifest pointing at the shared skills tree", () => {
    // GIVEN: A provider-neutral plugin exists.
    const plugin = makePluginFixture();

    // WHEN: The pure Codex adapter compiles its plan fragment.
    const fragment = new CodexProviderAdapter().compile(
      createProviderContext(plugin),
    );
    const artifact = fragment.artifacts[0];

    // THEN: Codex owns only its manifest and references the shared skills root.
    assert.equal(fragment.ownerId, CODEX);
    assert.equal(fragment.ownership.kind, OwnershipKind.ExactFiles);
    assert.ok(fragment.ownership.kind === OwnershipKind.ExactFiles);
    assert.deepEqual(fragment.ownership.paths, [".codex-plugin/plugin.json"]);
    assert.ok(artifact?.kind === ArtifactKind.File);
    assert.deepEqual(JSON.parse(artifact.content.toString("utf8")), {
      name: "fixture-skills",
      version: "1.2.3",
      description: "Fixture plugin description.",
      author: {
        name: "Fixture Owner",
        email: "owner@example.test",
        url: "https://example.test/owner",
      },
      homepage: "https://example.test/plugin",
      repository: "https://example.test/repository",
      license: "MIT",
      keywords: ["agent-skills", "fixtures"],
      skills: "./skills/",
    });
    const firstRead = artifact.content;
    firstRead.fill(0);
    assert.equal(
      JSON.parse(artifact.content.toString("utf8")).skills,
      "./skills/",
    );
  });
});
