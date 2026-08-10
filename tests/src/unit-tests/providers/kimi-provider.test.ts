import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  ArtifactKind,
  createProviderContext,
  KIMI,
  OwnershipKind,
} from "../../../../src/core/index.ts";
import { KimiProviderAdapter } from "../../../../src/providers/kimi-provider.ts";
import { makePluginFixture } from "./test-fixtures/plugin-fixture.ts";

describe("KimiProviderAdapter", () => {
  it("emits one immutable manifest with supported Kimi metadata and shared skills", () => {
    // GIVEN: A provider-neutral plugin includes supported and unsupported Kimi metadata.
    const plugin = makePluginFixture();

    // WHEN: The pure Kimi adapter compiles its plan fragment.
    const fragment = new KimiProviderAdapter().compile(
      createProviderContext(plugin),
    );
    const artifact = fragment.artifacts[0];

    // THEN: Kimi owns only its manifest and emits the supported contract exactly.
    assert.equal(fragment.ownerId, KIMI);
    assert.equal(fragment.ownership.kind, OwnershipKind.ExactFiles);
    assert.ok(fragment.ownership.kind === OwnershipKind.ExactFiles);
    assert.deepEqual(fragment.ownership.paths, ["kimi.plugin.json"]);
    assert.deepEqual(
      fragment.artifacts.map((entry) => entry.path),
      ["kimi.plugin.json"],
    );
    assert.ok(artifact?.kind === ArtifactKind.File);
    assert.deepEqual(JSON.parse(artifact.content.toString("utf8")), {
      name: "fixture-skills",
      version: "1.2.3",
      description: "Fixture plugin description.",
      keywords: ["agent-skills", "fixtures"],
      author: {
        name: "Fixture Owner",
        email: "owner@example.test",
      },
      homepage: "https://example.test/plugin",
      license: "MIT",
      skills: "./skills/",
    });
    assert.equal(Object.isFrozen(fragment), true);
    assert.equal(Object.isFrozen(fragment.artifacts), true);
    const firstRead = artifact.content;
    firstRead.fill(0);
    const rendered = JSON.parse(artifact.content.toString("utf8")) as Record<
      string,
      unknown
    >;
    assert.equal(rendered["skills"], "./skills/");
    assert.equal("repository" in rendered, false);
    assert.deepEqual(rendered["author"], {
      name: "Fixture Owner",
      email: "owner@example.test",
    });
  });

  it("omits optional email and unsupported author URL and repository fields", () => {
    // GIVEN: A plugin author has a name and URL but no optional email.
    const plugin = makePluginFixture({
      name: "Fixture Owner",
      url: "https://example.test/owner",
    });

    // WHEN: The Kimi adapter compiles its manifest.
    const fragment = new KimiProviderAdapter().compile(
      createProviderContext(plugin),
    );
    const artifact = fragment.artifacts[0];

    // THEN: The author contains only its supported name and no repository is emitted.
    assert.ok(artifact?.kind === ArtifactKind.File);
    const rendered = JSON.parse(artifact.content.toString("utf8")) as Record<
      string,
      unknown
    >;
    assert.deepEqual(rendered["author"], { name: "Fixture Owner" });
    assert.equal("repository" in rendered, false);
  });
});
