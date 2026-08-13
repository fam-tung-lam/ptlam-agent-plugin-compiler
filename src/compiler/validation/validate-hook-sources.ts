import {
  createProjectPath,
  type HookInput,
  type HookManifest,
  type HookResourceInput,
  type PluginSource,
  SourceEntryKind,
  type SourceFile,
  type UniversalHookEvent,
} from "../../core/index.js";
import { SOURCE_MANIFEST_PATH } from "./parse-plugin-manifest.js";

const SOURCE_HOOKS_PATH = "plugin/hooks";

/** Loaded hook registrations, shared resources, and authored-layout diagnostics. */
export interface HookSourceValidationResult {
  /** Immutable normalized event-to-handler registrations. */
  readonly hooks: readonly HookInput[];
  /** Immutable handler modules and internal resources below `plugin/hooks/`. */
  readonly resources: readonly HookResourceInput[];
  /** Fatal hook declaration, layout, and resource diagnostics. */
  readonly errors: readonly string[];
}

function readSourceBytes(source: SourceFile): Buffer {
  return source.content;
}

function flattenHookManifest(manifest: HookManifest): readonly HookInput[] {
  return Object.freeze(
    Object.entries(manifest).flatMap(([event, handlers]) =>
      handlers.map((handler) =>
        Object.freeze({
          event: event as UniversalHookEvent,
          handler: handler.handler,
        }),
      ),
    ),
  );
}

/**
 * Match event-keyed hook declarations to the shared authored hook tree.
 *
 * @param source - Immutable authored manifest, skill, and hook facts.
 * @param manifestHooks - Parsed event-keyed hook declarations.
 * @returns Immutable registrations, resources, and accumulated diagnostics.
 */
export function validateHookSources(
  source: PluginSource,
  manifestHooks: HookManifest,
): HookSourceValidationResult {
  const errors: string[] = [];
  const seenPaths = new Set<string>();
  const files = new Map<string, Buffer>();
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

  for (const entry of entries) {
    if (entry.kind !== SourceEntryKind.File) continue;
    const entryPath = String(entry.path);
    const relativePath = entryPath.slice(`${SOURCE_HOOKS_PATH}/`.length);
    if (relativePath.split("/").includes(".DS_Store")) {
      errors.push(`${entryPath}: unsupported service file`);
    } else {
      files.set(relativePath, readSourceBytes(entry));
    }
  }

  const hooks = flattenHookManifest(manifestHooks);
  if (hooks.length === 0 && entries.length > 0) {
    errors.push(
      `${SOURCE_HOOKS_PATH}: hook sources require at least one declaration in ${SOURCE_MANIFEST_PATH}#hooks`,
    );
  }
  const handlerIndexes = new Map<UniversalHookEvent, number>();
  for (const hook of hooks) {
    const handlerIndex = handlerIndexes.get(hook.event) ?? 0;
    handlerIndexes.set(hook.event, handlerIndex + 1);
    const field = `${SOURCE_MANIFEST_PATH}#/hooks/${hook.event}/${handlerIndex}/handler`;
    if (!String(hook.handler).endsWith(".mjs")) {
      errors.push(`${field}: hook handlers must be .mjs modules`);
    }
    if (!files.has(String(hook.handler))) {
      errors.push(`${field}: expected ${SOURCE_HOOKS_PATH}/${hook.handler}`);
    }
  }

  return {
    hooks,
    resources: Object.freeze(
      [...files].map(([relativePath, content]) =>
        Object.freeze({
          path: createProjectPath(relativePath),
          content,
        }),
      ),
    ),
    errors: Object.freeze(errors),
  };
}
