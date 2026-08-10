import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { describe, it } from "vitest";

import {
  ArtifactKind,
  CLAUDE,
  createProviderContext,
  OwnershipKind,
} from "../../../../../src/core/index.ts";
import { ClaudeProviderAdapter } from "../../../../../src/providers/index.ts";
import {
  CLAUDE_CONTRACT_VERIFIED_ON,
  CLAUDE_MARKETPLACE_OFFICIAL_SOURCE,
  CLAUDE_OFFICIAL_SOURCE,
} from "./official-contract.ts";
import { makeClaudeConformancePlugin } from "./plugin-fixture.ts";

describe("Claude provider conformance", () => {
  it("matches the official plugin and marketplace golden artifacts", async () => {
    // GIVEN: Official Claude references verified on the fixture date and exact goldens.
    assert.equal(CLAUDE_CONTRACT_VERIFIED_ON, "2026-08-08");
    assert.equal(
      CLAUDE_OFFICIAL_SOURCE,
      "https://code.claude.com/docs/en/plugins-reference",
    );
    assert.equal(
      CLAUDE_MARKETPLACE_OFFICIAL_SOURCE,
      "https://code.claude.com/docs/en/plugin-marketplaces",
    );
    const [expectedPlugin, expectedMarketplace] = await Promise.all([
      readFile(new URL("./expected-plugin.json", import.meta.url), "utf8"),
      readFile(new URL("./expected-marketplace.json", import.meta.url), "utf8"),
    ]);

    // WHEN: Claude compiles the provider-neutral plugin.
    const fragment = new ClaudeProviderAdapter().compile(
      createProviderContext(makeClaudeConformancePlugin()),
    );
    const artifactPaths = fragment.artifacts.map((artifact) => artifact.path);
    const rendered = new Map<string, string>(
      fragment.artifacts.map((artifact) => {
        assert.equal(artifact.kind, ArtifactKind.File);
        assert.ok(artifact.kind === ArtifactKind.File);
        return [artifact.path, artifact.content.toString("utf8")] as const;
      }),
    );
    const expectedPaths = [
      ".claude-plugin/marketplace.json",
      ".claude-plugin/plugin.json",
    ];

    // THEN: Both official manifest bytes and actual owned paths match exactly.
    assert.equal(fragment.ownerId, CLAUDE);
    assert.equal(fragment.ownership.kind, OwnershipKind.ExactFiles);
    assert.ok(fragment.ownership.kind === OwnershipKind.ExactFiles);
    assert.deepEqual(fragment.ownership.paths, expectedPaths);
    assert.equal(new Set(artifactPaths).size, artifactPaths.length);
    assert.deepEqual(artifactPaths, expectedPaths);
    assert.equal(rendered.get(".claude-plugin/plugin.json"), expectedPlugin);
    assert.equal(
      rendered.get(".claude-plugin/marketplace.json"),
      expectedMarketplace,
    );
  });
});
