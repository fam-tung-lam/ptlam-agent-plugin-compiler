import assert from "node:assert/strict";
import { createRequire } from "node:module";

import { describe, it } from "vitest";

import { parsePluginManifest } from "../../../../../src/compiler/validation/index.ts";
import { CLAUDE, CODEX } from "../../../../../src/core/index.ts";
import { makeManifest } from "../test-fixtures/plugin-fixture.ts";

const require = createRequire(import.meta.url);
const pluginManifestSchema = require("../../../../../src/schemas/v1/plugin-manifest.schema.json");

describe("parsePluginManifest", () => {
  it("uses the versioned JSON schema as the manifest contract", () => {
    // GIVEN: A schema-valid manifest declares non-empty provider defaults.
    assert.equal(
      pluginManifestSchema.$id,
      "https://raw.githubusercontent.com/fam-tung-lam/ptlam-agent-plugin-compiler/main/src/schemas/v1/plugin-manifest.schema.json",
    );
    const manifest = makeManifest({ providers: [CLAUDE, CODEX] });

    // WHEN: The authored manifest is parsed through the versioned schema.
    const result = parsePluginManifest(JSON.stringify(manifest));

    // THEN: Provider identifiers and nested manifest values are immutable.
    assert.deepEqual(result, { manifest, errors: [] });
    assert.equal(
      "manifest" in result && Object.isFrozen(result.manifest),
      true,
    );
    assert.equal(
      "manifest" in result && Object.isFrozen(result.manifest.categories),
      true,
    );
    assert.equal(
      "manifest" in result && Object.isFrozen(result.manifest.providers),
      true,
    );
    assert.equal(
      "manifest" in result && Object.isFrozen(result.manifest.skills[0]),
      true,
    );
  });

  it("accepts an empty provider default", () => {
    // GIVEN: A schema-valid manifest selects shared skills only.
    const manifest = makeManifest({ providers: [] });

    // WHEN: The authored manifest is parsed.
    const result = parsePluginManifest(JSON.stringify(manifest));

    // THEN: The empty provider selection remains a valid immutable default.
    assert.deepEqual(result, { manifest, errors: [] });
    assert.equal(
      "manifest" in result && Object.isFrozen(result.manifest.providers),
      true,
    );
  });

  it("rejects duplicate provider defaults", () => {
    // GIVEN: A manifest repeats the same extensible provider identifier.
    const source = JSON.stringify({
      ...makeManifest(),
      providers: [CLAUDE, CLAUDE],
    });

    // WHEN: The authored manifest is parsed.
    const result = parsePluginManifest(source);

    // THEN: The duplicate is diagnosed at the providers collection.
    assert.deepEqual(result, {
      errors: [
        "plugin/plugin.yml/providers: must NOT have duplicate items (items ## 0 and 1 are identical)",
      ],
    });
  });

  it("rejects malformed provider defaults", () => {
    // GIVEN: A provider identifier violates the extensible identifier syntax.
    const source = JSON.stringify({
      ...makeManifest(),
      providers: ["1provider"],
    });

    // WHEN: The authored manifest is parsed.
    const result = parsePluginManifest(source);

    // THEN: The invalid provider is diagnosed at its array position.
    assert.deepEqual(result, {
      errors: [
        'plugin/plugin.yml/providers/0: must match pattern "^[a-z][a-z0-9-]*$"',
      ],
    });
  });

  it("requires provider defaults", () => {
    // GIVEN: A legacy manifest omits the required providers property.
    const { providers: _providers, ...manifestWithoutProviders } =
      makeManifest();

    // WHEN: The authored manifest is parsed.
    const result = parsePluginManifest(
      JSON.stringify(manifestWithoutProviders),
    );

    // THEN: The missing project default is reported explicitly.
    assert.deepEqual(result, {
      errors: [
        "plugin/plugin.yml#/providers: must have required property 'providers'",
      ],
    });
  });

  it("rejects legacy marketplace metadata", () => {
    // GIVEN: A legacy manifest still authors Claude-specific marketplace data.
    const source = JSON.stringify({
      ...makeManifest(),
      marketplace: {
        name: "fixture-marketplace",
        description: "Fixture marketplace.",
        plugin_description: "Installable fixture skills.",
        category: "development",
        keywords: ["agent-skills"],
      },
    });

    // WHEN: The authored manifest is parsed.
    const result = parsePluginManifest(source);

    // THEN: The closed schema rejects the removed provider-specific property.
    assert.deepEqual(result, {
      errors: [
        "plugin/plugin.yml#/marketplace: must NOT have additional properties",
      ],
    });
  });
});
