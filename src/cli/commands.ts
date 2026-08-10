import type {
  CheckResult,
  CompileResult,
  ValidateResult,
} from "../compiler/index.js";
import { CLAUDE, CODEX, type ProviderId } from "../providers/index.js";

/**
 * CLI operations accepted by the terminal adapter.
 *
 * @internal
 */
export enum CliCommand {
  /** Validate authored plugin sources. */
  Validate = "validate",
  /** Compare generated state with the desired plan. */
  Check = "check",
  /** Compile and verify generated state. */
  Generate = "generate",
}

/**
 * Built-in providers selected when no `--provider` flag is present.
 *
 * @internal
 */
export const DEFAULT_PROVIDERS: readonly ProviderId[] = Object.freeze([
  CLAUDE,
  CODEX,
]);

/**
 * One completed compiler operation paired with its command.
 *
 * @internal
 */
export type ExecutedCliCommand =
  | {
      /** The operation that produced the result. */
      readonly command: CliCommand.Validate;
      /** Validation result returned by the compiler. */
      readonly result: ValidateResult;
    }
  | {
      /** The operation that produced the result. */
      readonly command: CliCommand.Check;
      /** Generated-state check returned by the compiler. */
      readonly result: CheckResult;
    }
  | {
      /** The operation that produced the result. */
      readonly command: CliCommand.Generate;
      /** Compilation result returned by the compiler. */
      readonly result: CompileResult;
    };

/**
 * Parsed help or command input ready for CLI execution.
 *
 * @internal
 */
export type ParsedCliArguments =
  | {
      /** Selects help rendering without compiler construction. */
      readonly kind: "help";
      /** Command whose focused help was requested; omit for root help. */
      readonly command?: CliCommand;
    }
  | {
      /** Selects compiler command execution. */
      readonly kind: "command";
      /** Requested compiler operation. */
      readonly command: CliCommand;
      /** Absolute repository root. */
      readonly rootDir: string;
      /** Ordered provider identifiers selected for the operation. */
      readonly providers: readonly ProviderId[];
    };
