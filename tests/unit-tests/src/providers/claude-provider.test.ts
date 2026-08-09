import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  OutputEntryKind,
  OutputOwnershipKind,
} from "../../../../src/core/index.ts";
import {
  claudeProvider,
  createProviderContext,
} from "../../../../src/providers/index.ts";
import { makeValidatedPluginFixture } from "./test-fixtures/validated-plugin-fixture.ts";

describe("Claude provider", () => {
  it("emits only exact Claude manifests without owning shared skills", () => {
    // GIVEN: A validated plugin contains public, internal, draft, and deprecated skills.
    const plugin = makeValidatedPluginFixture();

    // WHEN: The pure Claude adapter compiles its output fragment.
    const fragment = claudeProvider.compile(createProviderContext(plugin));

    // THEN: Ownership is exact and only publishable root skills enter the manifest.
    assert.equal(fragment.ownerId, "claude");
    assert.equal(fragment.ownership.kind, OutputOwnershipKind.ExactFiles);
    assert.deepEqual(claudeProvider.ownedPaths, [
      ".claude-plugin/marketplace.json",
      ".claude-plugin/plugin.json",
    ]);
    assert.equal(
      claudeProvider.ownedPaths.some((path) => path.startsWith("skills")),
      false,
    );
    const pluginArtifact = fragment.artifacts.find(
      (artifact) => artifact.path === ".claude-plugin/plugin.json",
    );
    assert.ok(pluginArtifact?.kind === OutputEntryKind.File);
    assert.deepEqual(
      JSON.parse(pluginArtifact.content.toString("utf8")).skills,
      ["./skills/active-skill", "./skills/deprecated-skill"],
    );
    const marketplaceArtifact = fragment.artifacts.find(
      (artifact) => artifact.path === ".claude-plugin/marketplace.json",
    );
    assert.ok(marketplaceArtifact?.kind === OutputEntryKind.File);
    assert.deepEqual(
      JSON.parse(marketplaceArtifact.content.toString("utf8")).owner,
      {
        name: "Fixture Owner",
        email: "owner@example.test",
        url: "https://example.test/owner",
      },
    );
    assert.equal(Object.isFrozen(fragment), true);
    assert.equal(Object.isFrozen(fragment.artifacts), true);
  });

  it("omits unavailable optional author fields", () => {
    // GIVEN: A validated plugin author has only the required display name.
    const plugin = makeValidatedPluginFixture({ name: "Fixture Owner" });

    // WHEN: The Claude adapter compiles its marketplace manifest.
    const fragment = claudeProvider.compile(createProviderContext(plugin));

    // THEN: Optional author properties are absent instead of emitted as nulls.
    const marketplaceArtifact = fragment.artifacts.find(
      (artifact) => artifact.path === ".claude-plugin/marketplace.json",
    );
    assert.ok(marketplaceArtifact?.kind === OutputEntryKind.File);
    assert.deepEqual(
      JSON.parse(marketplaceArtifact.content.toString("utf8")).owner,
      { name: "Fixture Owner" },
    );
  });
});
