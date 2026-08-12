import {
  createDriftEntry,
  createWriteResult,
  type DriftEntry,
  type HookId,
  type Plugin,
  type ProjectPath,
  type ProviderId,
  type WriteResult,
  type WriteResultInput,
} from "../core/index.js";

/** Whether one logical hook was emitted or skipped for a selected provider. */
export enum HookDiagnosticStatus {
  /** Provider-native configuration and shared handler resources are planned. */
  Generated = "generated",
  /** Hook output is intentionally absent for this provider. */
  Skipped = "skipped",
}

/** Stable reason why a logical hook was skipped. */
export enum HookDiagnosticReason {
  /** The provider adapter does not support lifecycle hooks as one capability. */
  ProviderDoesNotSupportHooks = "provider-does-not-support-hooks",
}

/** Structured compatibility result for one selected provider and logical hook. */
export type HookDiagnostic =
  | {
      /** Selected target provider. */
      readonly provider: ProviderId;
      /** Logical authored hook identifier. */
      readonly hook: HookId;
      /** Successful generation status. */
      readonly status: HookDiagnosticStatus.Generated;
    }
  | {
      /** Selected target provider. */
      readonly provider: ProviderId;
      /** Logical authored hook identifier. */
      readonly hook: HookId;
      /** Non-fatal skip status. */
      readonly status: HookDiagnosticStatus.Skipped;
      /** Machine-readable compatibility reason. */
      readonly reason: HookDiagnosticReason;
    };

/** Where one compiler operation obtained its effective provider selection. */
export type ProviderSelectionSource = "manifest" | "override";

/**
 * Result of initializing the minimal authored plugin layout.
 */
export interface InitResult {
  /** Paths created by this invocation. */
  readonly createdPaths: readonly ProjectPath[];
  /** Paths that already existed and were left unchanged. */
  readonly existingPaths: readonly ProjectPath[];
  /** Non-fatal initialization diagnostics. */
  readonly warnings: readonly string[];
}

/**
 * Result of validating authored plugin sources.
 *
 * @example
 * ```ts
 * const { plugin, warnings } = await compiler.validate();
 * ```
 */
export interface ValidateResult {
  /** Immutable domain plugin produced from the authored sources. */
  readonly plugin: Plugin;
  /** Effective provider IDs in stable registry order. */
  readonly providers: readonly ProviderId[];
  /** Whether providers came from the manifest or an explicit override. */
  readonly providerSelectionSource: ProviderSelectionSource;
  /** Provider-by-hook compatibility and generation decisions. */
  readonly hookDiagnostics: readonly HookDiagnostic[];
  /** Non-fatal validation diagnostics. */
  readonly warnings: readonly string[];
}

/**
 * Result of comparing generated files with the selected write plan.
 *
 * @example
 * ```ts
 * const result = await compiler.check();
 * if (!result.upToDate) console.log(result.drift);
 * ```
 */
export interface CheckResult extends ValidateResult {
  /** Whether every managed path matches the selected write plan. */
  readonly upToDate: boolean;
  /** Immutable mismatches between the plan and generated filesystem state. */
  readonly drift: readonly DriftEntry[];
}

/**
 * Result of writing and then verifying generated files.
 *
 * @example
 * ```ts
 * const result = await compiler.compile();
 * if (!result.verified) console.error(result.drift);
 * ```
 */
export interface CompileResult extends ValidateResult {
  /** Managed roots and files that changed or were already current. */
  readonly writeResult: WriteResult;
  /** Whether the post-write snapshot matches the write plan. */
  readonly verified: boolean;
  /** Immutable post-write mismatches; empty when `verified` is true. */
  readonly drift: readonly DriftEntry[];
}

/**
 * Input used internally to construct an immutable validation result.
 *
 * @internal
 */
export interface ValidateResultInput {
  /** Validated domain plugin. */
  readonly plugin: Plugin;
  /** Effective provider IDs in stable registry order. */
  readonly providers: readonly ProviderId[];
  /** Source of the effective provider selection. */
  readonly providerSelectionSource: ProviderSelectionSource;
  /** Provider-by-hook compatibility and generation decisions. */
  readonly hookDiagnostics?: readonly HookDiagnostic[];
  /** Non-fatal validation diagnostics. */
  readonly warnings: readonly string[];
}

/**
 * Input used internally to construct an immutable initialization result.
 *
 * @internal
 */
export interface InitResultInput {
  /** Paths created by this invocation. */
  readonly createdPaths: readonly ProjectPath[];
  /** Paths that already existed and were left unchanged. */
  readonly existingPaths: readonly ProjectPath[];
  /** Non-fatal initialization diagnostics. */
  readonly warnings: readonly string[];
}

/**
 * Snapshot authored-source initialization facts.
 *
 * @param input - Created paths, existing paths, and warnings to snapshot.
 * @returns An immutable initialization result.
 * @internal
 */
export function createInitResult(input: InitResultInput): InitResult {
  return Object.freeze({
    createdPaths: Object.freeze([...input.createdPaths]),
    existingPaths: Object.freeze([...input.existingPaths]),
    warnings: Object.freeze([...input.warnings]),
  });
}

/**
 * Input used internally to construct an immutable check result.
 *
 * @internal
 */
export interface CheckResultInput extends ValidateResultInput {
  /** Precomputed differences between the plan and current state. */
  readonly drift: readonly DriftEntry[];
}

/**
 * Input used internally to construct an immutable compile result.
 *
 * @internal
 */
export interface CompileResultInput extends ValidateResultInput {
  /** Factual paths reported by the filesystem writer. */
  readonly writeResult: WriteResultInput;
  /** Precomputed post-write differences. */
  readonly drift: readonly DriftEntry[];
}

/**
 * Snapshot validation output for the package result boundary.
 *
 * @param input - Validated plugin and warnings to snapshot.
 * @returns An immutable validation result.
 * @internal
 */
export function createValidateResult(
  input: ValidateResultInput,
): ValidateResult {
  return Object.freeze({
    plugin: input.plugin,
    providers: Object.freeze([...input.providers]),
    providerSelectionSource: input.providerSelectionSource,
    hookDiagnostics: freezeHookDiagnostics(input.hookDiagnostics ?? []),
    warnings: Object.freeze([...input.warnings]),
  });
}

/**
 * Derive `upToDate` while snapshotting check output.
 *
 * @param input - Validated plugin, warnings, and drift to snapshot.
 * @returns An immutable check result.
 * @internal
 */
export function createCheckResult(input: CheckResultInput): CheckResult {
  const drift = Object.freeze(input.drift.map(createDriftEntry));
  return Object.freeze({
    plugin: input.plugin,
    providers: Object.freeze([...input.providers]),
    providerSelectionSource: input.providerSelectionSource,
    hookDiagnostics: freezeHookDiagnostics(input.hookDiagnostics ?? []),
    warnings: Object.freeze([...input.warnings]),
    upToDate: drift.length === 0,
    drift,
  });
}

/**
 * Derive `verified` while snapshotting compile output.
 *
 * @param input - Validated plugin, write facts, warnings, and drift to snapshot.
 * @returns An immutable compile result.
 * @internal
 */
export function createCompileResult(input: CompileResultInput): CompileResult {
  const drift = Object.freeze(input.drift.map(createDriftEntry));
  return Object.freeze({
    plugin: input.plugin,
    providers: Object.freeze([...input.providers]),
    providerSelectionSource: input.providerSelectionSource,
    hookDiagnostics: freezeHookDiagnostics(input.hookDiagnostics ?? []),
    warnings: Object.freeze([...input.warnings]),
    writeResult: createWriteResult(input.writeResult),
    verified: drift.length === 0,
    drift,
  });
}

function freezeHookDiagnostics(
  diagnostics: readonly HookDiagnostic[],
): readonly HookDiagnostic[] {
  return Object.freeze(
    diagnostics.map((diagnostic) => Object.freeze({ ...diagnostic })),
  );
}
