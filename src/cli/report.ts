export enum CliExitCode {
  Success = 0,
  Failure = 1,
  Usage = 2,
}

export interface CliReport {
  readonly exitCode: CliExitCode;
  readonly stdout: readonly string[];
  readonly stderr: readonly string[];
}
