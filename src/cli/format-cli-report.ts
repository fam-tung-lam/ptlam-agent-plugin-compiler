import { CliCommand, type ExecutedCliCommand } from "./commands.js";
import type { CompilerScope } from "./ports.js";
import { CliExitCode, type CliReport } from "./report.js";

const USAGE_LINES = Object.freeze([
  "Usage: plugin-compiler <validate|check|generate> [--root <path>] [--provider <id>]...",
  "Repeat --provider to select providers. Defaults to: claude, codex.",
]);

function countLabel(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function scopeLine(scope: CompilerScope): string {
  return `Scope: ${scope.rootDir}; providers: ${scope.providers.join(", ")}.`;
}

function warningLines(warnings: readonly string[]): string[] {
  return warnings.length === 0
    ? []
    : ["Warnings:", ...warnings.map((warning) => `- ${warning}`)];
}

interface FormattableDrift {
  readonly path: string;
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

export function formatUsageReport(error?: string): CliReport {
  return createReport({
    exitCode: error === undefined ? CliExitCode.Success : CliExitCode.Usage,
    ...(error === undefined
      ? { stdout: USAGE_LINES }
      : { stderr: [error, ...USAGE_LINES] }),
  });
}

export function formatOperationError(
  error: unknown,
  scope: CompilerScope,
): CliReport {
  const message = error instanceof Error ? error.message : String(error);
  return createReport({
    exitCode: CliExitCode.Failure,
    stderr: [scopeLine(scope), `Command failed: ${message}`],
  });
}

/** Format immutable compiler results without invoking output adapters. */
export function formatCliResult(
  executed: ExecutedCliCommand,
  scope: CompilerScope,
): CliReport {
  const warnings = warningLines(executed.result.warnings);
  switch (executed.command) {
    case CliCommand.Validate:
      return createReport({
        exitCode: CliExitCode.Success,
        stdout: [
          scopeLine(scope),
          `Validated ${executed.result.plugin.name}@${executed.result.plugin.version}: ${countLabel(executed.result.plugin.skills.length, "skill")} in ${countLabel(executed.result.plugin.categories.length, "category", "categories")}.`,
        ],
        stderr: warnings,
      });
    case CliCommand.Check:
      return executed.result.upToDate
        ? createReport({
            exitCode: CliExitCode.Success,
            stdout: [scopeLine(scope), "Output check passed."],
            stderr: warnings,
          })
        : createReport({
            exitCode: CliExitCode.Failure,
            stderr: [
              ...warnings,
              scopeLine(scope),
              `Output check found ${countLabel(executed.result.drift.length, "drift entry", "drift entries")}:`,
              ...driftLines(executed.result.drift),
            ],
          });
    case CliCommand.Generate: {
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
              scopeLine(scope),
              "Generation completed and post-write verification passed.",
              ...writeLines,
            ],
            stderr: warnings,
          })
        : createReport({
            exitCode: CliExitCode.Failure,
            stdout: writeLines,
            stderr: [
              ...warnings,
              scopeLine(scope),
              `Generation completed but verification found ${countLabel(executed.result.drift.length, "drift entry", "drift entries")}:`,
              ...driftLines(executed.result.drift),
            ],
          });
    }
  }
}
