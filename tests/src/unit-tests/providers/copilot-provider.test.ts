import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  ArtifactKind,
  COPILOT,
  createProviderContext,
  OwnershipKind,
} from "../../../../src/core/index.ts";
import { CopilotProviderAdapter } from "../../../../src/providers/copilot-provider.ts";
import { makePluginFixture } from "./test-fixtures/plugin-fixture.ts";

describe("CopilotProviderAdapter", () => {
  it("emits one immutable portable manifest for conventional skill discovery", () => {
    // GIVEN: A provider-neutral plugin exists.
    const plugin = makePluginFixture();

    // WHEN: The pure Copilot adapter compiles its plan fragment.
    const fragment = new CopilotProviderAdapter().compile(
      createProviderContext(plugin),
    );
    const artifact = fragment.artifacts[0];

    // THEN: Copilot owns only the root portable manifest and declares no skill path.
    assert.equal(fragment.ownerId, COPILOT);
    assert.equal(fragment.ownership.kind, OwnershipKind.ExactFiles);
    assert.ok(fragment.ownership.kind === OwnershipKind.ExactFiles);
    assert.deepEqual(fragment.ownership.paths, ["plugin.json"]);
    assert.ok(artifact?.kind === ArtifactKind.File);
    assert.deepEqual(JSON.parse(artifact.content.toString("utf8")), {
      $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
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
    });
    const firstRead = artifact.content;
    firstRead.fill(0);
    assert.equal(
      JSON.parse(artifact.content.toString("utf8")).$schema,
      "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
    );
  });
});
