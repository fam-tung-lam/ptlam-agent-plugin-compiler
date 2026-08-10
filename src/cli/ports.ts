import type {
  CheckResult,
  CompileResult,
  InitResult,
  ValidateResult,
} from "../compiler/index.js";
import type { ProviderId } from "../providers/index.js";

/**
 * Repository and optional provider override for one CLI operation.
 *
 * @internal
 */
export interface CompilerScope {
  /** Absolute repository root. */
  readonly rootDir: string;
  /** Explicit provider override; omit to use the authored manifest selection. */
  readonly providers?: readonly ProviderId[];
}

/**
 * Compiler operations required by the CLI adapter.
 *
 * @internal
 */
export interface CompilerOperations {
  /**
   * @returns Authored-source initialization facts.
   * @throws If repository initialization fails.
   */
  init(): Promise<InitResult>;
  /**
   * @returns Authored-source validation.
   * @throws If source reading or validation fails.
   */
  validate(): Promise<ValidateResult>;
  /**
   * @returns Current generated-state comparison.
   * @throws If validation, planning, or generated-state reading fails.
   */
  check(): Promise<CheckResult>;
  /**
   * @returns Write and post-write verification result.
   * @throws If validation, planning, writing, or verification fails.
   */
  compile(): Promise<CompileResult>;
}

/**
 * Construct compiler operations for one CLI scope.
 *
 * @param scope - Resolved repository and optional provider override.
 * @returns Operations bound to that scope.
 * @throws If compiler construction rejects the scope.
 * @internal
 */
export type CreateCompilerOperations = (
  scope: CompilerScope,
) => CompilerOperations;

/**
 * Write one terminal line.
 *
 * @param line - Line content without an implied trailing newline contract.
 * @throws If the output destination rejects the write.
 * @internal
 */
export type WriteOutputLine = (line: string) => void;

/**
 * Line-oriented terminal output adapters.
 *
 * @internal
 */
export interface CliOutputAdapters {
  /** Writes one standard-output line. */
  readonly stdout: WriteOutputLine;
  /** Writes one standard-error line. */
  readonly stderr: WriteOutputLine;
}
