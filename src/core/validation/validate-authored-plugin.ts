import {
  createValidatedPlugin,
  type ValidatedPlugin,
} from "../models/plugin.js";
import type { PluginSource } from "../models/plugin-source.js";
import {
  parsePluginManifest,
  SOURCE_MANIFEST_PATH,
} from "./parse-plugin-manifest.js";
import { PluginValidationError } from "./plugin-validation-error.js";
import { validateSkillGraph } from "./validate-skill-graph.js";
import { validateSkillSources } from "./validate-skill-sources.js";

export interface ValidateAuthoredPluginResult {
  readonly plugin: ValidatedPlugin;
  readonly warnings: readonly string[];
}

/** Parse and validate one immutable set of authored-source facts. */
export function validateAuthoredPlugin(
  source: PluginSource,
): ValidateAuthoredPluginResult {
  if (source.manifest === null) {
    throw new PluginValidationError([
      `${SOURCE_MANIFEST_PATH}: plugin manifest is missing`,
    ]);
  }
  if (String(source.manifest.path) !== SOURCE_MANIFEST_PATH) {
    throw new PluginValidationError([
      `${String(source.manifest.path)}: expected canonical manifest path ${SOURCE_MANIFEST_PATH}`,
    ]);
  }

  const manifestResult = parsePluginManifest(
    source.manifest.content.toString("utf8"),
  );
  if (!("manifest" in manifestResult)) {
    throw new PluginValidationError(manifestResult.errors);
  }

  const manifest = manifestResult.manifest;
  const graph = validateSkillGraph(manifest.categories, manifest.skills);
  const sources = validateSkillSources(source, manifest.skills);
  const errors = [...graph.errors, ...sources.errors];
  if (errors.length > 0) throw new PluginValidationError(errors);

  const plugin = createValidatedPlugin({
    ...manifest,
    categories: manifest.categories,
    skills: sources.skills,
  });
  return Object.freeze({
    plugin,
    warnings: Object.freeze([...graph.warnings]),
  });
}
