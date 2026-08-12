import {
  AVAILABLE_PROVIDERS,
  CliCommand,
  type ExecutedCliCommand,
} from "./commands.js";
import type { CompilerScope } from "./ports.js";
import { CliExitCode, type CliReport } from "./report.js";

const COMMAND_HELP: Readonly<
  Record<
    CliCommand,
    {
      readonly summary: string;
      readonly introduction: string;
    }
  >
> = Object.freeze({
  [CliCommand.Init]: {
    summary: "Create missing authored plugin source paths",
    introduction:
      "Create missing authored plugin source paths without replacing existing content.",
  },
  [CliCommand.Validate]: {
    summary: "Validate the authored plugin manifest, skills, and graph",
    introduction:
      "Validate the authored plugin manifest, skills, and dependency graph.",
  },
  [CliCommand.Check]: {
    summary: "Check compiler-managed output against the authored sources",
    introduction:
      "Check compiler-managed output against the authored plugin sources.",
  },
  [CliCommand.Compile]: {
    summary: "Compile and verify all compiler-managed output",
    introduction: "Compile and verify all compiler-managed output files.",
  },
});

function rootHelpLines(): readonly string[] {
  return Object.freeze([
    "A deterministic compiler for PTLam-compatible agent plugin projects.",
    "",
    "Usage: plugin-compiler [OPTIONS] <COMMAND>",
    "",
    "Commands:",
    ...Object.values(CliCommand).map(
      (command) => `  ${command.padEnd(8)}  ${COMMAND_HELP[command].summary}`,
    ),
    "",
    "Options:",
    "  -h, --help  Display help for this command",
    "",
    "Provider selection for validate, check, and compile:",
    "  --provider <id>[,<id>...]",
    "  --no-providers",
    `  Possible values: ${AVAILABLE_PROVIDERS.join(", ")}`,
    "  Omit both options to use plugin/plugin.yml providers.",
    "  --provider replaces the manifest selection; --no-providers selects none.",
    "",
    "Use `plugin-compiler <command> --help` for more information on a command.",
  ]);
}

function commandHelpLines(command: CliCommand): readonly string[] {
  const availableProviders = AVAILABLE_PROVIDERS.join(", ");
  return Object.freeze([
    COMMAND_HELP[command].introduction,
    "",
    `Usage: plugin-compiler ${command} [OPTIONS]`,
    "",
    "Options:",
    "      --root <path>              Plugin repository root",
    "                                 [default: current working directory]",
    ...(command === CliCommand.Init
      ? []
      : [
          "      --provider <id>[,<id>...]  Select providers as a comma-separated list",
          `                                 [possible values: ${availableProviders}]`,
          "                                 [replaces plugin/plugin.yml providers]",
          "      --no-providers             Select no providers; shared skills/ only",
          "                                 [default: plugin/plugin.yml providers]",
        ]),
    "  -h, --help                     Display help for this command",
  ]);
}

function helpLines(command?: CliCommand): readonly string[] {
  return command === undefined ? rootHelpLines() : commandHelpLines(command);
}

function countLabel(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function providerNames(providers: readonly string[]): string {
  return providers.length === 0 ? "none" : providers.join(", ");
}

function resultScopeLine(
  scope: CompilerScope,
  result: {
    readonly providers: readonly string[];
    readonly providerSelectionSource: "manifest" | "override";
  },
): string {
  return `Scope: ${scope.rootDir}; providers: ${providerNames(result.providers)}; provider source: ${result.providerSelectionSource}.`;
}

function requestedScopeLine(scope: CompilerScope): string {
  return scope.providers === undefined
    ? `Scope: ${scope.rootDir}; requested provider source: manifest.`
    : `Scope: ${scope.rootDir}; requested providers: ${providerNames(scope.providers)}; provider source: override.`;
}

function rootLine(scope: CompilerScope): string {
  return `Scope: ${scope.rootDir}.`;
}

function warningLines(warnings: readonly string[]): string[] {
  return warnings.length === 0
    ? []
    : ["Warnings:", ...warnings.map((warning) => `- ${warning}`)];
}

function hookDiagnosticLines(
  diagnostics: readonly {
    readonly provider: string;
    readonly hook: string;
    readonly status: string;
    readonly reason?: string;
  }[],
): string[] {
  return diagnostics.length === 0
    ? []
    : [
        "Hooks:",
        ...diagnostics.map(
          (diagnostic) =>
            `- ${diagnostic.provider}/${diagnostic.hook}: ${diagnostic.status}${diagnostic.reason === undefined ? "" : ` (${diagnostic.reason})`}`,
        ),
      ];
}

interface FormattableDrift {
  /** Repository-relative drift path. */
  readonly path: string;
  /** Stable drift reason rendered for terminal users. */
  readonly reason: string;
}

function driftLines(drift: readonly FormattableDrift[]): string[] {
  return drift.map((entry) => `- ${entry.path}: ${entry.reason}`);
}

function createReport({
  exitCode,
  stdout = [],
  stderr = [],
}: {
  readonly exitCode: CliExitCode;
  readonly stdout?: readonly string[];
  readonly stderr?: readonly string[];
}): CliReport {
  return Object.freeze({
    exitCode,
    stdout: Object.freeze([...stdout]),
    stderr: Object.freeze([...stderr]),
  });
}

/**
 * Format help or a usage error.
 *
 * @param options - Optional focused command and usage error text.
 * @returns An immutable terminal report.
 * @internal
 */
export function formatUsageReport({
  command,
  error,
}: {
  readonly command?: CliCommand;
  readonly error?: string;
} = {}): CliReport {
  const usage = helpLines(command);
  return createReport({
    exitCode: error === undefined ? CliExitCode.Success : CliExitCode.Usage,
    ...(error === undefined
      ? { stdout: usage }
      : { stderr: [error, "", ...usage] }),
  });
}

/**
 * Format a compiler failure for one resolved scope.
 *
 * @param error - Value thrown by compiler construction or execution.
 * @param scope - Repository and provider scope of the failed operation.
 * @returns An immutable failure report.
 * @internal
 */
export function formatOperationError(
  error: unknown,
  scope: CompilerScope,
): CliReport {
  const message = error instanceof Error ? error.message : String(error);
  return createReport({
    exitCode: CliExitCode.Failure,
    stderr: [requestedScopeLine(scope), `Command failed: ${message}`],
  });
}

/**
 * Format one immutable compiler result without invoking output adapters.
 *
 * @param executed - Completed operation and its result.
 * @param scope - Repository and provider scope of the operation.
 * @returns An immutable success or drift report.
 * @internal
 */
export function formatCliResult(
  executed: ExecutedCliCommand,
  scope: CompilerScope,
): CliReport {
  const warnings = warningLines(executed.result.warnings);
  switch (executed.command) {
    case CliCommand.Init:
      return createReport({
        exitCode: CliExitCode.Success,
        stdout: [
          rootLine(scope),
          executed.result.createdPaths.length === 0
            ? "Plugin source is already initialized."
            : "Plugin source initialized.",
          ...executed.result.createdPaths.map((path) => `- ${path}: created`),
          ...executed.result.existingPaths.map(
            (path) => `- ${path}: unchanged`,
          ),
        ],
        stderr: warnings,
      });
    case CliCommand.Validate:
      return createReport({
        exitCode: CliExitCode.Success,
        stdout: [
          resultScopeLine(scope, executed.result),
          `Validated ${executed.result.plugin.name}@${executed.result.plugin.version}: ${countLabel(executed.result.plugin.skills.length, "skill")} in ${countLabel(executed.result.plugin.categories.length, "category", "categories")}.`,
          ...hookDiagnosticLines(executed.result.hookDiagnostics),
        ],
        stderr: warnings,
      });
    case CliCommand.Check:
      return executed.result.upToDate
        ? createReport({
            exitCode: CliExitCode.Success,
            stdout: [
              resultScopeLine(scope, executed.result),
              "Output check passed.",
              ...hookDiagnosticLines(executed.result.hookDiagnostics),
            ],
            stderr: warnings,
          })
        : createReport({
            exitCode: CliExitCode.Failure,
            stderr: [
              ...warnings,
              ...hookDiagnosticLines(executed.result.hookDiagnostics),
              resultScopeLine(scope, executed.result),
              `Output check found ${countLabel(executed.result.drift.length, "drift entry", "drift entries")}:`,
              ...driftLines(executed.result.drift),
            ],
          });
    case CliCommand.Compile: {
      const writeLines = [
        ...executed.result.writeResult.changedPaths.map(
          (outputPath) => `- ${outputPath}: changed`,
        ),
        ...executed.result.writeResult.unchangedPaths.map(
          (outputPath) => `- ${outputPath}: unchanged`,
        ),
      ];
      return executed.result.verified
        ? createReport({
            exitCode: CliExitCode.Success,
            stdout: [
              resultScopeLine(scope, executed.result),
              "Compilation completed and post-write verification passed.",
              ...hookDiagnosticLines(executed.result.hookDiagnostics),
              ...writeLines,
            ],
            stderr: warnings,
          })
        : createReport({
            exitCode: CliExitCode.Failure,
            stdout: [...writeLines],
            stderr: [
              ...warnings,
              ...hookDiagnosticLines(executed.result.hookDiagnostics),
              resultScopeLine(scope, executed.result),
              `Compilation completed but verification found ${countLabel(executed.result.drift.length, "drift entry", "drift entries")}:`,
              ...driftLines(executed.result.drift),
            ],
          });
    }
  }
}
