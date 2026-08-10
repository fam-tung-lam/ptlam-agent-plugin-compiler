import type {
  CheckResult,
  CompileResult,
  ValidateResult,
} from "../compiler/index.js";
import type { ProviderId } from "../providers/index.js";

export interface CompilerScope {
  readonly rootDir: string;
  readonly providers: readonly ProviderId[];
}

export interface CompilerOperations {
  validate(): Promise<ValidateResult>;
  check(): Promise<CheckResult>;
  compile(): Promise<CompileResult>;
}

export type CreateCompilerOperations = (
  scope: CompilerScope,
) => CompilerOperations;

export type WriteOutputLine = (line: string) => void;

export interface CliOutputAdapters {
  readonly stdout: WriteOutputLine;
  readonly stderr: WriteOutputLine;
}
