import assert from "node:assert/strict";

import { describe, it } from "vitest";

import { parsePluginManifest } from "../../../../../src/compiler/validation/index.ts";
import { INITIAL_PLUGIN_MANIFEST } from "../../../../../src/filesystem/templates/initial-plugin-source.ts";

describe("INITIAL_PLUGIN_MANIFEST", () => {
  it("starts with shared skills only and no authored marketplace metadata", () => {
    // GIVEN: The complete manifest source emitted by plugin initialization.
    const source = INITIAL_PLUGIN_MANIFEST;

    // WHEN: The template is parsed through the current schema-v2 contract.
    const result = parsePluginManifest(source);

    // THEN: The template is valid, selects no providers, and has no marketplace input.
    assert.ok("manifest" in result, result.errors.join("\n"));
    assert.deepEqual(result.manifest.providers, []);
    assert.doesNotMatch(source, /^marketplace:/mu);
    assert.match(source, /# disable_model_invocation: true/u);
    assert.equal(
      result.manifest.skills.every(
        (skill) => skill.disable_model_invocation === false,
      ),
      true,
    );
  });
});
