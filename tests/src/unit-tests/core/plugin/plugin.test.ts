import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  CLAUDE,
  CODEX,
  createPlugin,
  PluginSchemaVersion,
} from "../../../../../src/core/index.ts";

describe("createPlugin", () => {
  it("snapshots and freezes the manifest provider defaults", () => {
    // GIVEN: A caller owns a mutable provider selection.
    const providers = [CLAUDE];

    // WHEN: The immutable plugin domain model is created from that selection.
    const plugin = createPlugin({
      schema_version: PluginSchemaVersion.V1,
      providers,
      name: "fixture-plugin",
      description: "Fixture plugin.",
      version: "1.0.0",
      author: { name: "Fixture Owner" },
      homepage: "https://example.test/plugin",
      repository: "https://example.test/repository",
      license: "MIT",
      keywords: ["fixture"],
      categories: [],
      skills: [],
    });
    providers.push(CODEX);

    // THEN: Later caller mutations cannot change the frozen provider defaults.
    assert.deepEqual(plugin.providers, [CLAUDE]);
    assert.equal(Object.isFrozen(plugin.providers), true);
  });

  it("snapshots and freezes normalized plugin configuration", () => {
    // GIVEN: A caller owns mutable configured validation policy.
    const config = { skill_dependency_depth_limit: 3 };

    // WHEN: The plugin domain model snapshots that policy.
    const plugin = createPlugin({
      schema_version: PluginSchemaVersion.V2,
      providers: [],
      config,
      name: "fixture-plugin",
      description: "Fixture plugin.",
      version: "1.0.0",
      author: { name: "Fixture Owner" },
      homepage: "https://example.test/plugin",
      repository: "https://example.test/repository",
      license: "MIT",
      keywords: ["fixture"],
      categories: [],
      skills: [],
    });
    config.skill_dependency_depth_limit = 4;

    // THEN: The public configuration remains deeply immutable and unchanged.
    assert.deepEqual(plugin.config, { skill_dependency_depth_limit: 3 });
    assert.equal(Object.isFrozen(plugin.config), true);
  });
});
