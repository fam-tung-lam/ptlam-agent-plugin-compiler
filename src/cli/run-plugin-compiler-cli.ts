import {
  CliCommand,
  type CliOutputAdapters,
  type CliReport,
  type CompilerOperations,
  type CompilerScope,
  type CreateCompilerOperations,
  DEFAULT_PROVIDERS,
  type ExecutedCliCommand,
  type ParsedCliArguments,
} from "./cli-models.js";
import {
  formatCliResult,
  formatOperationError,
  formatUsageReport,
} from "./format-cli-report.js";
import { CliUsageError, parseCliArguments } from "./parse-cli-arguments.js";

async function executeCommand(
  command: CliCommand,
  compiler: CompilerOperations,
): Promise<ExecutedCliCommand> {
  switch (command) {
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
 * Run one CLI command. Compiler failures become reports; output-adapter
 * failures deliberately propagate to the embedding process.
 */
export async function runPluginCompilerCli({
  argv,
  currentWorkingDirectory,
  createCompiler,
  output,
}: {
  readonly argv: readonly string[];
  readonly currentWorkingDirectory: string;
  readonly createCompiler: CreateCompilerOperations;
  readonly output: CliOutputAdapters;
}): Promise<number> {
  let parsed: ParsedCliArguments;
  try {
    parsed = parseCliArguments(argv, currentWorkingDirectory);
  } catch (error) {
    const report = formatUsageReport(
      error instanceof CliUsageError ? error.message : String(error),
    );
    presentReport(report, output);
    return report.exitCode;
  }

  if (parsed.kind === "help") {
    const report = formatUsageReport();
    presentReport(report, output);
    return report.exitCode;
  }

  const scope: CompilerScope = Object.freeze({
    rootDir: parsed.rootDir,
    providers: DEFAULT_PROVIDERS,
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
