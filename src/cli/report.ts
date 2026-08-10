/**
 * Stable CLI process exit codes.
 *
 * @internal
 */
export enum CliExitCode {
  /** The requested operation completed successfully. */
  Success = 0,
  /** Compiler execution or generated-state verification failed. */
  Failure = 1,
  /** Command-line input was invalid. */
  Usage = 2,
}

/**
 * Immutable line-oriented output and exit status.
 *
 * @internal
 */
export interface CliReport {
  /** Process exit code for the report. */
  readonly exitCode: CliExitCode;
  /** Lines written to standard output in order. */
  readonly stdout: readonly string[];
  /** Lines written to standard error in order. */
  readonly stderr: readonly string[];
}
