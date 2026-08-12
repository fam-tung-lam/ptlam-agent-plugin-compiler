import type { HookId, ProjectPath } from "../identifiers.js";

/** Provider-neutral lifecycle stages currently supported by the compiler. */
export enum HookLifecycle {
  /** Runs after a user submits a request and before the agent processes it. */
  BeforeRequest = "before-request",
  /** Runs after the agent drafts its final response and before returning it. */
  BeforeResponse = "before-response",
}

/** One lifecycle-to-handler mapping declared by a logical hook. */
export interface HookBinding {
  /** Provider-neutral lifecycle stage. */
  readonly lifecycle: HookLifecycle;
  /** Path to an ES module relative to `plugin/hooks/<hook-id>/`. */
  readonly handler: ProjectPath;
}

/** One logical authored hook before source files are attached. */
export interface HookManifest {
  /** Stable logical hook identifier. */
  readonly id: HookId;
  /** Lifecycle stages owned by separate handler modules. */
  readonly bindings: readonly HookBinding[];
}

/** Mutable-input form of one authored hook resource. */
export interface HookResourceInput {
  /** Path relative to the hook's authored source directory. */
  readonly path: ProjectPath;
  /** Resource bytes copied into the immutable hook model. */
  readonly content: Uint8Array;
}

/** Immutable authored hook resource. */
export interface HookResource {
  /** Path relative to the hook's authored source directory. */
  readonly path: ProjectPath;
  /** A fresh copy of resource bytes on every read. */
  readonly content: Buffer;
}

/** Mutable-input form of a validated logical hook and loaded resources. */
export interface HookInput extends Omit<HookManifest, "bindings"> {
  /** Lifecycle bindings to copy into the immutable model. */
  readonly bindings: Iterable<HookBinding>;
  /** Canonical authored source directory. */
  readonly source_path: ProjectPath;
  /** Every authored handler and internal runtime resource. */
  readonly resources: Iterable<HookResourceInput>;
}

/** Validated logical hook with loaded handler and resource bytes. */
export interface Hook extends HookManifest {
  /** Canonical authored source directory. */
  readonly source_path: ProjectPath;
  /** Every authored handler and internal runtime resource. */
  readonly resources: readonly HookResource[];
}

function createHookResource(input: HookResourceInput): HookResource {
  const bytes = Buffer.from(input.content);
  return Object.freeze({
    path: input.path,
    get content(): Buffer {
      return Buffer.from(bytes);
    },
  });
}

/**
 * Create one deeply immutable logical hook.
 *
 * @param input - Validated declaration and authored resource bytes.
 * @returns An immutable hook whose resource bytes cannot be mutated by aliases.
 */
export function createHook(input: HookInput): Hook {
  return Object.freeze({
    ...input,
    bindings: Object.freeze(
      [...input.bindings].map((binding) => Object.freeze({ ...binding })),
    ),
    resources: Object.freeze([...input.resources].map(createHookResource)),
  });
}
