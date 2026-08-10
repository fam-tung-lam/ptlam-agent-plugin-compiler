import assert from "node:assert/strict";

import { describe, it } from "vitest";

import { parsePluginManifest } from "../../../../../src/compiler/validation/index.ts";
import pluginManifestSchema from "../../../../../src/schemas/v1/plugin-manifest.schema.json" with {
  type: "json",
};
import { makeManifest } from "../test-fixtures/plugin-fixture.ts";

describe("parsePluginManifest", () => {
  it("uses the versioned JSON schema as the manifest contract", () => {
    assert.equal(
      pluginManifestSchema.$id,
      "https://raw.githubusercontent.com/fam-tung-lam/ptlam-agent-plugin-compiler/main/src/schemas/v1/plugin-manifest.schema.json",
    );

    const manifest = makeManifest();
    const result = parsePluginManifest(JSON.stringify(manifest));

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
      "manifest" in result && Object.isFrozen(result.manifest.skills[0]),
      true,
    );
  });

  it("preserves invalid-manifest diagnostics", () => {
    const source = JSON.stringify({
      ...makeManifest(),
      unexpected: "value",
    });

    assert.deepEqual(parsePluginManifest(source), {
      errors: [
        "plugin/plugin.yml#/unexpected: must NOT have additional properties",
      ],
    });
  });
});
