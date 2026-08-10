import {
  CliCommand,
  type ExecutedCliCommand,
  type ParsedCliArguments,
} from "./commands.js";
import {
  formatCliResult,
  formatOperationError,
  formatUsageReport,
} from "./format-cli-report.js";
import { CliUsageError, parseCliArguments } from "./parse-cli-arguments.js";
import type {
  CliOutputAdapters,
  CompilerOperations,
  CompilerScope,
  CreateCompilerOperations,
} from "./ports.js";
import type { CliReport } from "./report.js";

async function executeCommand(
  command: CliCommand,
  compiler: CompilerOperations,
): Promise<ExecutedCliCommand> {
  switch (command) {
    case CliCommand.Init:
      return { command, result: await compiler.init() };
    case CliCommand.Validate:
      return { command, result: await compiler.validate() };
    case CliCommand.Check:
      return { command, result: await compiler.check() };
    case CliCommand.Generate:
      return { command, result: await compiler.compile() };
  }
}

function presentReport(report: CliReport, output: CliOutputAdapters): void {
  for (const line of report.stdout) output.stdout(line);
  for (const line of report.stderr) output.stderr(line);
}

/**
 * Run one CLI request through injected compiler and output adapters.
 *
 * Compiler failures become reports so only output-adapter failures propagate.
 *
 * @param input - CLI request and its environment adapters.
 * @returns The exit code after the complete report is presented.
 * @throws If an output adapter fails.
 * @internal
 */
export async function runPluginCompilerCli({
  argv,
  currentWorkingDirectory,
  createCompiler,
  output,
}: {
  /** Command tokens without executable and script path. */
  readonly argv: readonly string[];
  /** Base directory for resolving `--root`. */
  readonly currentWorkingDirectory: string;
  /** Compiler factory for the resolved scope. */
  readonly createCompiler: CreateCompilerOperations;
  /** Line-oriented stdout and stderr adapters. */
  readonly output: CliOutputAdapters;
}): Promise<number> {
  let parsed: ParsedCliArguments;
  try {
    parsed = parseCliArguments(argv, currentWorkingDirectory);
  } catch (error) {
    const report =
      error instanceof CliUsageError
        ? formatUsageReport({
            ...(error.command === undefined ? {} : { command: error.command }),
            error: error.message,
          })
        : formatUsageReport({ error: String(error) });
    presentReport(report, output);
    return report.exitCode;
  }

  if (parsed.kind === "help") {
    const report = formatUsageReport(
      parsed.command === undefined ? {} : { command: parsed.command },
    );
    presentReport(report, output);
    return report.exitCode;
  }

  const scope: CompilerScope = Object.freeze({
    rootDir: parsed.rootDir,
    ...(parsed.providers === undefined ? {} : { providers: parsed.providers }),
  });
  let report: CliReport;
  try {
    const compiler = createCompiler(scope);
    const executed = await executeCommand(parsed.command, compiler);
    report = formatCliResult(executed, scope);
  } catch (error) {
    report = formatOperationError(error, scope);
  }
  presentReport(report, output);
  return report.exitCode;
}
