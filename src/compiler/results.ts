import {
  createDriftEntry,
  createWriteResult,
  type DriftEntry,
  type Plugin,
  type WriteResult,
  type WriteResultInput,
} from "../core/index.js";

export interface ValidateResult {
  readonly plugin: Plugin;
  readonly warnings: readonly string[];
}

export interface CheckResult extends ValidateResult {
  readonly upToDate: boolean;
  readonly drift: readonly DriftEntry[];
}

export interface CompileResult extends ValidateResult {
  readonly writeResult: WriteResult;
  readonly verified: boolean;
  readonly drift: readonly DriftEntry[];
}

/** @internal */
export interface ValidateResultInput {
  readonly plugin: Plugin;
  readonly warnings: readonly string[];
}

/** @internal */
export interface CheckResultInput extends ValidateResultInput {
  readonly drift: readonly DriftEntry[];
}

/** @internal */
export interface CompileResultInput extends ValidateResultInput {
  readonly writeResult: WriteResultInput;
  readonly drift: readonly DriftEntry[];
}

/** @internal */
export function createValidateResult(
  input: ValidateResultInput,
): ValidateResult {
  return Object.freeze({
    plugin: input.plugin,
    warnings: Object.freeze([...input.warnings]),
  });
}

/** @internal */
export function createCheckResult(input: CheckResultInput): CheckResult {
  const drift = Object.freeze(input.drift.map(createDriftEntry));
  return Object.freeze({
    plugin: input.plugin,
    warnings: Object.freeze([...input.warnings]),
    upToDate: drift.length === 0,
    drift,
  });
}

/** @internal */
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
