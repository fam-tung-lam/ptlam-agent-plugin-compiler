import type {
  CheckResult,
  CompileResult,
  ValidateResult,
} from "../compiler/index.js";
import { CLAUDE, CODEX, type ProviderId } from "../providers/index.js";

export enum CliCommand {
  Validate = "validate",
  Check = "check",
  Generate = "generate",
}

export const DEFAULT_PROVIDERS: readonly ProviderId[] = Object.freeze([
  CLAUDE,
  CODEX,
]);

export type ExecutedCliCommand =
  | {
      readonly command: CliCommand.Validate;
      readonly result: ValidateResult;
    }
  | {
      readonly command: CliCommand.Check;
      readonly result: CheckResult;
    }
  | {
      readonly command: CliCommand.Generate;
      readonly result: CompileResult;
    };

export type ParsedCliArguments =
  | { readonly kind: "help" }
  | {
      readonly kind: "command";
      readonly command: CliCommand;
      readonly rootDir: string;
      readonly providers: readonly ProviderId[];
    };
