import assert from "node:assert/strict";

import { describe, it } from "vitest";

import { OutputEntryKind } from "../../../../src/core/index.ts";
import {
  codexProvider,
  createProviderContext,
} from "../../../../src/providers/index.ts";
import { makeValidatedPluginFixture } from "./test-fixtures/validated-plugin-fixture.ts";

describe("Codex provider", () => {
  it("emits one immutable manifest pointing at the shared skills tree", () => {
    // GIVEN: A validated provider-neutral plugin exists.
    const plugin = makeValidatedPluginFixture();

    // WHEN: The pure Codex adapter compiles its output fragment.
    const fragment = codexProvider.compile(createProviderContext(plugin));
    const artifact = fragment.artifacts[0];

    // THEN: Codex owns only its manifest and references the shared skills root.
    assert.deepEqual(codexProvider.ownedPaths, [".codex-plugin/plugin.json"]);
    assert.ok(artifact?.kind === OutputEntryKind.File);
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
