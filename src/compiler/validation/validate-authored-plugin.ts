import {
  createPlugin,
  type Plugin,
  type PluginSource,
} from "../../core/index.js";
import {
  parsePluginManifest,
  SOURCE_MANIFEST_PATH,
} from "./parse-plugin-manifest.js";
import { PluginValidationError } from "./plugin-validation-error.js";
import { validateHookSources } from "./validate-hook-sources.js";
import { validateSkillGraph } from "./validate-skill-graph.js";
import { validateSkillSources } from "./validate-skill-sources.js";

/** Successful authored-source validation output. */
export interface ValidateAuthoredPluginResult {
  /** Immutable domain plugin with loaded skill and hook sources and resources. */
  readonly plugin: Plugin;
  /** Non-fatal graph diagnostics. */
  readonly warnings: readonly string[];
}

/**
 * Validates a filesystem-independent snapshot of all authored plugin facts.
 *
 * @param source - Immutable manifest, skill-tree, and hook-tree facts.
 * @returns The immutable domain plugin and non-fatal graph warnings.
 * @throws {PluginValidationError} If the manifest path, manifest data, skill graph, or authored skill sources are invalid.
 */
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
  const hooks = validateHookSources(source, manifest.hooks);
  const sources = validateSkillSources(source, manifest.skills);
  const errors = [...graph.errors, ...hooks.errors, ...sources.errors];
  if (errors.length > 0) throw new PluginValidationError(errors);

  const plugin = createPlugin({
    ...manifest,
    categories: manifest.categories,
    hooks: hooks.hooks,
    skills: sources.skills,
  });
  return Object.freeze({
    plugin,
    warnings: Object.freeze([...graph.warnings]),
  });
}
