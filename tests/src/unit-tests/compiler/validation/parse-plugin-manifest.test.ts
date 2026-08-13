import assert from "node:assert/strict";
import { createRequire } from "node:module";

import { describe, it } from "vitest";

import { parsePluginManifest } from "../../../../../src/compiler/validation/index.ts";
import {
  CLAUDE,
  CODEX,
  PluginSchemaVersion,
} from "../../../../../src/core/index.ts";
import { makeManifest, makeSkill } from "../test-fixtures/plugin-fixture.ts";

const require = createRequire(import.meta.url);
const pluginManifestSchemaV1 = require("../../../../../src/schemas/v1/plugin-manifest.schema.json");
const pluginManifestSchemaV2 = require("../../../../../src/schemas/v2/plugin-manifest.schema.json");

function removeV2SkillFields<
  T extends { readonly skills: ReturnType<typeof makeManifest>["skills"] },
>(manifest: T) {
  return {
    ...manifest,
    skills: manifest.skills.map(
      ({ disable_model_invocation: _disableModelInvocation, ...skill }) =>
        skill,
    ),
  };
}

describe("parsePluginManifest", () => {
  it("uses the v2 JSON schema as the current manifest contract", () => {
    // GIVEN: The current schema has a stable versioned resource identifier.
    assert.equal(
      pluginManifestSchemaV2.$id,
      "https://raw.githubusercontent.com/fam-tung-lam/ptlam-agent-plugin-compiler/main/src/schemas/v2/plugin-manifest.schema.json",
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

  it("keeps v1 frozen and rejects lifecycle hooks", () => {
    // GIVEN: The frozen v1 schema has no hook property.
    assert.equal(
      pluginManifestSchemaV1.$id,
      "https://raw.githubusercontent.com/fam-tung-lam/ptlam-agent-plugin-compiler/main/src/schemas/v1/plugin-manifest.schema.json",
    );
    assert.equal(pluginManifestSchemaV1.properties.hooks, undefined);
    const manifest = removeV2SkillFields(makeManifest());
    const { hooks: _hooks, ...withoutHooks } = manifest;
    const legacy = {
      ...withoutHooks,
      schema_version: PluginSchemaVersion.V1,
    };

    // WHEN: A v1 source adds the v2-only hook property.
    const result = parsePluginManifest(
      JSON.stringify({ ...legacy, hooks: manifest.hooks }),
    );

    // THEN: Version dispatch applies the closed v1 contract.
    assert.deepEqual(result, {
      errors: ["plugin/plugin.yml#/hooks: must NOT have additional properties"],
    });
  });

  it("accepts manual-only skills in v2 and keeps the field out of v1", () => {
    // GIVEN: One v2 skill disables model invocation while another omits the field.
    const manualOnly = makeManifest({
      skills: [
        makeSkill({ id: "automatic-skill" }),
        makeSkill({
          id: "manual-skill",
          disable_model_invocation: true,
        }),
      ],
    });
    const source = JSON.parse(JSON.stringify(manualOnly)) as Record<
      string,
      unknown
    >;
    const skills = source["skills"] as Record<string, unknown>[];
    delete skills[0]?.["disable_model_invocation"];

    // WHEN: V2, invalid-v2, and v1 variants cross the public schema boundary.
    const current = parsePluginManifest(JSON.stringify(source));
    const invalid = parsePluginManifest(
      JSON.stringify({
        ...source,
        skills: [{ ...skills[0], disable_model_invocation: "true" }],
      }),
    );
    const legacy = parsePluginManifest(
      JSON.stringify({
        ...source,
        schema_version: PluginSchemaVersion.V1,
        hooks: undefined,
        skills: [{ ...skills[0], disable_model_invocation: true }],
      }),
    );

    // THEN: Omission normalizes false, true remains true, and v1 rejects the field.
    assert.equal(
      "manifest" in current
        ? current.manifest.skills[0]?.disable_model_invocation
        : undefined,
      false,
    );
    assert.equal(
      "manifest" in current
        ? current.manifest.skills[1]?.disable_model_invocation
        : undefined,
      true,
    );
    assert.deepEqual(invalid, {
      errors: [
        "plugin/plugin.yml/skills/0/disable_model_invocation: must be boolean",
      ],
    });
    assert.deepEqual(legacy, {
      errors: [
        "plugin/plugin.yml/skills/0/disable_model_invocation: must NOT have additional properties",
      ],
    });
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

  it("normalizes omitted hooks and accepts two lifecycle bindings without a required flag", () => {
    // GIVEN: Legacy source omits hooks while new source declares one two-stage hook.
    const current = makeManifest();
    const { hooks: _hooks, ...currentWithoutHooks } = current;
    const legacyWithoutHooks = {
      ...removeV2SkillFields(currentWithoutHooks),
      schema_version: PluginSchemaVersion.V1,
    };
    const adaptive = {
      ...current,
      hooks: [
        {
          id: "adaptive-interaction",
          bindings: [
            { lifecycle: "before-request", handler: "request.mjs" },
            { lifecycle: "before-response", handler: "response.mjs" },
          ],
        },
      ],
    };

    // WHEN: Both manifests cross the same public schema boundary.
    const legacyResult = parsePluginManifest(
      JSON.stringify(legacyWithoutHooks),
    );
    const adaptiveResult = parsePluginManifest(JSON.stringify(adaptive));

    // THEN: Hook-free input stays valid and the hook has only logical bindings.
    assert.equal("manifest" in legacyResult, true);
    assert.deepEqual(
      "manifest" in legacyResult ? legacyResult.manifest.hooks : undefined,
      [],
    );
    assert.equal("manifest" in adaptiveResult, true);
    assert.deepEqual(
      "manifest" in adaptiveResult
        ? adaptiveResult.manifest.hooks[0]?.bindings.map(
            ({ lifecycle, handler }) => ({ lifecycle, handler }),
          )
        : undefined,
      [
        { lifecycle: "before-request", handler: "request.mjs" },
        { lifecycle: "before-response", handler: "response.mjs" },
      ],
    );
    assert.equal(
      "manifest" in adaptiveResult &&
        adaptiveResult.manifest.hooks[0] !== undefined &&
        "required" in adaptiveResult.manifest.hooks[0],
      false,
    );
  });

  it("rejects unsupported schema versions before contract validation", () => {
    // GIVEN: A structurally complete manifest selects a future schema version.
    const source = JSON.stringify({
      ...makeManifest(),
      schema_version: 3,
    });

    // WHEN: The manifest parser dispatches by schema version.
    const result = parsePluginManifest(source);

    // THEN: The version error names every contract this library supports.
    assert.deepEqual(result, {
      errors: [
        "plugin/plugin.yml/schema_version: must be one of the supported versions: 1, 2",
      ],
    });
  });

  it("keeps hook policies internal and rejects a required compatibility flag", () => {
    // GIVEN: A hook attempts to expose policy and required fields in the manifest.
    const invalid = {
      ...makeManifest(),
      hooks: [
        {
          id: "adaptive-interaction",
          required: true,
          policies: ["style.json"],
          bindings: [{ lifecycle: "before-request", handler: "request.mjs" }],
        },
      ],
    };

    // WHEN: The closed schema parses the provider-neutral declaration.
    const result = parsePluginManifest(JSON.stringify(invalid));

    // THEN: Both unsupported public fields are rejected as manifest properties.
    assert.equal("manifest" in result, false);
    assert.ok(
      "errors" in result &&
        result.errors.filter((error) =>
          error.includes("must NOT have additional properties"),
        ).length >= 2,
    );
  });

  it("rejects dot segments in hook handler paths with a schema diagnostic", () => {
    // GIVEN: A v2 hook handler path contains a non-normalized dot segment.
    const source = JSON.stringify({
      ...makeManifest(),
      hooks: [
        {
          id: "simple-logger",
          bindings: [
            { lifecycle: "before-request", handler: "lib/./request.mjs" },
          ],
        },
      ],
    });

    // WHEN: The manifest crosses the public parsing boundary.
    const result = parsePluginManifest(source);

    // THEN: Parsing returns a field-level diagnostic instead of throwing.
    assert.equal("manifest" in result, false);
    assert.ok(
      "errors" in result &&
        result.errors.some(
          (error) =>
            error.includes("hooks/0/bindings/0/handler") &&
            error.includes("must match pattern"),
        ),
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
