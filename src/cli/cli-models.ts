import type {
  CheckResult,
  GenerateResult,
  ValidateResult,
} from "../compiler/index.js";

export enum CliCommand {
  Validate = "validate",
  Check = "check",
  Generate = "generate",
}

export enum CliExitCode {
  Success = 0,
  Failure = 1,
  Usage = 2,
}

export const DEFAULT_PROVIDER_IDS = Object.freeze(["claude", "codex"]);

export interface CompilerScope {
  readonly rootDir: string;
  readonly providerIds: readonly string[];
}

export interface CompilerOperations {
  validate(): Promise<ValidateResult>;
  check(): Promise<CheckResult>;
  generate(): Promise<GenerateResult>;
}

export type CreateCompilerOperations = (
  scope: CompilerScope,
) => CompilerOperations;

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
      readonly result: GenerateResult;
    };

export type ParsedCliArguments =
  | { readonly kind: "help" }
  | {
      readonly kind: "command";
      readonly command: CliCommand;
      readonly rootDir: string;
    };

export interface CliReport {
  readonly exitCode: CliExitCode;
  readonly stdout: readonly string[];
  readonly stderr: readonly string[];
}

export type WriteOutputLine = (line: string) => void;

export interface CliOutputAdapters {
  readonly stdout: WriteOutputLine;
  readonly stderr: WriteOutputLine;
}
