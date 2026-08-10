import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { describe, it } from "vitest";

import {
  ArtifactKind,
  COPILOT,
  createProviderContext,
  OwnershipKind,
} from "../../../../../src/core/index.ts";
import { CopilotProviderAdapter } from "../../../../../src/providers/copilot-provider.ts";
import {
  COPILOT_CLI_OFFICIAL_SOURCE,
  COPILOT_CONTRACT_VERIFIED_ON,
  COPILOT_OFFICIAL_SOURCE,
  COPILOT_SCHEMA_SOURCE,
} from "./official-contract.ts";
import { makeCopilotConformancePlugin } from "./plugin-fixture.ts";

describe("Copilot provider conformance", () => {
  it("matches the official portable Agent Plugins manifest golden artifact", async () => {
    // GIVEN: The official contract and exact golden verified on the fixture date.
    assert.equal(COPILOT_CONTRACT_VERIFIED_ON, "2026-08-10");
    assert.equal(
      COPILOT_CLI_OFFICIAL_SOURCE,
      "https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference#open-plugin-spec-support",
    );
    assert.equal(
      COPILOT_OFFICIAL_SOURCE,
      "https://agent-plugins.org/plugin-authors/manifest",
    );
    assert.equal(
      COPILOT_SCHEMA_SOURCE,
      "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
    );
    const expected = await readFile(
      new URL("./expected-plugin.json", import.meta.url),
      "utf8",
    );

    // WHEN: Copilot compiles the provider-neutral plugin.
    const fragment = new CopilotProviderAdapter().compile(
      createProviderContext(makeCopilotConformancePlugin()),
    );
    const artifact = fragment.artifacts[0];
    const artifactPaths = fragment.artifacts.map((entry) => entry.path);
    const expectedPaths = ["plugin.json"];

    // THEN: The portable manifest bytes and actual owned path match exactly.
    assert.equal(fragment.ownerId, COPILOT);
    assert.equal(fragment.ownership.kind, OwnershipKind.ExactFiles);
    assert.ok(fragment.ownership.kind === OwnershipKind.ExactFiles);
    assert.deepEqual(fragment.ownership.paths, expectedPaths);
    assert.equal(new Set(artifactPaths).size, artifactPaths.length);
    assert.deepEqual(artifactPaths, expectedPaths);
    assert.ok(artifact?.kind === ArtifactKind.File);
    assert.equal(artifact.path, "plugin.json");
    assert.equal(artifact.content.toString("utf8"), expected);
    assert.equal(
      Object.hasOwn(JSON.parse(expected) as object, "skills"),
      false,
    );
  });
});
