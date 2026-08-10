import {
  createDriftEntry,
  createWriteResult,
  type DriftEntry,
  type Plugin,
  type WriteResult,
  type WriteResultInput,
} from "../core/index.js";

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
  /** Non-fatal validation diagnostics. */
  readonly warnings: readonly string[];
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
    warnings: Object.freeze([...input.warnings]),
    writeResult: createWriteResult(input.writeResult),
    verified: drift.length === 0,
    drift,
  });
}
