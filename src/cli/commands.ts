import type {
  CheckResult,
  CompileResult,
  InitResult,
  ValidateResult,
} from "../compiler/index.js";
import {
  CLAUDE,
  CODEX,
  COPILOT,
  GEMINI,
  KIMI,
  type ProviderId,
} from "../providers/index.js";

/**
 * CLI operations accepted by the terminal adapter.
 *
 * @internal
 */
export enum CliCommand {
  /** Create the minimal authored plugin source layout. */
  Init = "init",
  /** Validate authored plugin sources. */
  Validate = "validate",
  /** Compare generated state with the desired plan. */
  Check = "check",
  /** Compile and verify generated state. */
  Generate = "generate",
}

/** Built-in provider IDs accepted by the CLI. @internal */
export const AVAILABLE_PROVIDERS: readonly ProviderId[] = Object.freeze([
  CLAUDE,
  CODEX,
  COPILOT,
  GEMINI,
  KIMI,
]);

/**
 * One completed compiler operation paired with its command.
 *
 * @internal
 */
export type ExecutedCliCommand =
  | {
      /** The operation that produced the result. */
      readonly command: CliCommand.Init;
      /** Initialization result returned by the compiler. */
      readonly result: InitResult;
    }
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
      /** Explicit provider override; omit to use the authored manifest. */
      readonly providers?: readonly ProviderId[];
    };
