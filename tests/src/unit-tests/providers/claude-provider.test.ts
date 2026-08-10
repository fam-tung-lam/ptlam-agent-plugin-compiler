import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  ArtifactKind,
  CLAUDE,
  createProviderContext,
  OwnershipKind,
} from "../../../../src/core/index.ts";
import { ClaudeProviderAdapter } from "../../../../src/providers/index.ts";
import { makePluginFixture } from "./test-fixtures/plugin-fixture.ts";

describe("ClaudeProviderAdapter", () => {
  it("emits only exact Claude manifests without owning shared skills", () => {
    // GIVEN: A plugin contains public, internal, draft, and deprecated skills.
    const plugin = makePluginFixture();

    // WHEN: The pure Claude adapter compiles its plan fragment.
    const fragment = new ClaudeProviderAdapter().compile(
      createProviderContext(plugin),
    );

    // THEN: Ownership is exact and only publishable root skills enter the manifest.
    assert.equal(fragment.ownerId, CLAUDE);
    assert.equal(fragment.ownership.kind, OwnershipKind.ExactFiles);
    assert.ok(fragment.ownership.kind === OwnershipKind.ExactFiles);
    assert.deepEqual(fragment.ownership.paths, [
      ".claude-plugin/marketplace.json",
      ".claude-plugin/plugin.json",
    ]);
    assert.deepEqual(
      fragment.artifacts.map((artifact) => artifact.path),
      [".claude-plugin/marketplace.json", ".claude-plugin/plugin.json"],
    );
    const pluginArtifact = fragment.artifacts.find(
      (artifact) => artifact.path === ".claude-plugin/plugin.json",
    );
    assert.ok(pluginArtifact?.kind === ArtifactKind.File);
    assert.deepEqual(
      JSON.parse(pluginArtifact.content.toString("utf8")).skills,
      ["./skills/active-skill", "./skills/deprecated-skill"],
    );
    const marketplaceArtifact = fragment.artifacts.find(
      (artifact) => artifact.path === ".claude-plugin/marketplace.json",
    );
    assert.ok(marketplaceArtifact?.kind === ArtifactKind.File);
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
    // GIVEN: A plugin author has only the required display name.
    const plugin = makePluginFixture({ name: "Fixture Owner" });

    // WHEN: The Claude adapter compiles its marketplace manifest.
    const fragment = new ClaudeProviderAdapter().compile(
      createProviderContext(plugin),
    );

    // THEN: Optional author properties are absent instead of emitted as nulls.
    const marketplaceArtifact = fragment.artifacts.find(
      (artifact) => artifact.path === ".claude-plugin/marketplace.json",
    );
    assert.ok(marketplaceArtifact?.kind === ArtifactKind.File);
    assert.deepEqual(
      JSON.parse(marketplaceArtifact.content.toString("utf8")).owner,
      { name: "Fixture Owner" },
    );
  });
});
