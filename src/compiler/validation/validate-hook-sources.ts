import {
  createProjectPath,
  type HookInput,
  type HookManifest,
  type PluginSource,
  type SourceEntry,
  SourceEntryKind,
  type SourceFile,
} from "../../core/index.js";
import { SOURCE_MANIFEST_PATH } from "./parse-plugin-manifest.js";

const SOURCE_HOOKS_PATH = "plugin/hooks";

/** Loaded logical hook inputs and fatal authored-layout diagnostics. */
export interface HookSourceValidationResult {
  /** Immutable hook inputs with every handler and internal resource attached. */
  readonly hooks: readonly HookInput[];
  /** Fatal hook identity, binding, layout, and resource diagnostics. */
  readonly errors: readonly string[];
}

function readSourceBytes(source: SourceFile): Buffer {
  return source.content;
}

function discoveredHookIds(
  entries: readonly SourceEntry[],
  errors: string[],
): Set<string> {
  const ids = new Set<string>();
  for (const entry of entries) {
    const entryPath = String(entry.path);
    const relativePath = entryPath.slice(`${SOURCE_HOOKS_PATH}/`.length);
    if (relativePath.includes("/")) continue;
    if (entry.kind === SourceEntryKind.Directory) {
      ids.add(relativePath);
    } else {
      errors.push(
        `${entryPath}: only hook directories are allowed directly in ${SOURCE_HOOKS_PATH}/`,
      );
    }
  }
  return ids;
}

function validateHookBindings(
  hook: HookManifest,
  hookIndex: number,
  files: ReadonlyMap<string, Buffer>,
  errors: string[],
): void {
  const seenLifecycles = new Set<string>();
  for (const [bindingIndex, binding] of hook.bindings.entries()) {
    const field = `${SOURCE_MANIFEST_PATH}#/hooks/${hookIndex}/bindings/${bindingIndex}`;
    if (seenLifecycles.has(binding.lifecycle)) {
      errors.push(
        `${field}/lifecycle: duplicate lifecycle ${JSON.stringify(binding.lifecycle)} in hook ${JSON.stringify(hook.id)}`,
      );
    }
    seenLifecycles.add(binding.lifecycle);
    if (!String(binding.handler).endsWith(".mjs")) {
      errors.push(`${field}/handler: hook handlers must be .mjs modules`);
    }
    if (!files.has(String(binding.handler))) {
      errors.push(
        `${field}/handler: expected ${SOURCE_HOOKS_PATH}/${hook.id}/${binding.handler}`,
      );
    }
  }
}

/**
 * Match hook declarations to authored handler directories without filesystem I/O.
 *
 * @param source - Immutable authored manifest, skill, and hook facts.
 * @param manifestHooks - Parsed logical hooks to attach to source resources.
 * @returns Immutable hook construction inputs and accumulated diagnostics.
 */
export function validateHookSources(
  source: PluginSource,
  manifestHooks: readonly HookManifest[],
): HookSourceValidationResult {
  const errors: string[] = [];
  const seenPaths = new Set<string>();
  const entries = source.hookEntries.filter((entry) => {
    const entryPath = String(entry.path);
    if (seenPaths.has(entryPath)) {
      errors.push(`${entryPath}: duplicate logical source entry`);
      return false;
    }
    seenPaths.add(entryPath);
    if (
      entryPath === SOURCE_HOOKS_PATH &&
      entry.kind === SourceEntryKind.Directory
    ) {
      return false;
    }
    if (!entryPath.startsWith(`${SOURCE_HOOKS_PATH}/`)) {
      errors.push(
        `${entryPath}: hook source entry is outside ${SOURCE_HOOKS_PATH}/`,
      );
      return false;
    }
    return true;
  });

  const hookCounts = new Map<string, number>();
  for (const hook of manifestHooks) {
    hookCounts.set(hook.id, (hookCounts.get(hook.id) ?? 0) + 1);
  }
  manifestHooks.forEach((hook, index) => {
    if ((hookCounts.get(hook.id) ?? 0) > 1) {
      errors.push(
        `${SOURCE_MANIFEST_PATH}#/hooks/${index}/id: duplicate hook id ${JSON.stringify(hook.id)}`,
      );
    }
  });

  const discovered = discoveredHookIds(entries, errors);
  const declared = new Set(manifestHooks.map((hook) => String(hook.id)));
  for (const id of discovered) {
    if (!declared.has(id)) {
      errors.push(
        `${SOURCE_HOOKS_PATH}/${id}: source hook is not listed in ${SOURCE_MANIFEST_PATH}`,
      );
    }
  }
  for (const id of declared) {
    if (!discovered.has(id)) {
      errors.push(
        `${SOURCE_MANIFEST_PATH}#hooks: expected ${SOURCE_HOOKS_PATH}/${id}/`,
      );
    }
  }

  const hooks: HookInput[] = [];
  for (const [index, hook] of manifestHooks.entries()) {
    const sourcePath = `${SOURCE_HOOKS_PATH}/${hook.id}`;
    const prefix = `${sourcePath}/`;
    const files = new Map<string, Buffer>();
    for (const entry of entries) {
      const entryPath = String(entry.path);
      if (!entryPath.startsWith(prefix) || entry.kind !== SourceEntryKind.File)
        continue;
      const relativePath = entryPath.slice(prefix.length);
      if (relativePath.split("/").includes(".DS_Store")) {
        errors.push(`${entryPath}: unsupported service file`);
      } else {
        files.set(relativePath, readSourceBytes(entry));
      }
    }
    validateHookBindings(hook, index, files, errors);
    hooks.push({
      ...hook,
      source_path: createProjectPath(sourcePath),
      resources: Object.freeze(
        [...files].map(([relativePath, content]) => ({
          path: createProjectPath(relativePath),
          content,
        })),
      ),
    });
  }

  return {
    hooks: Object.freeze(hooks),
    errors: Object.freeze(errors),
  };
}
