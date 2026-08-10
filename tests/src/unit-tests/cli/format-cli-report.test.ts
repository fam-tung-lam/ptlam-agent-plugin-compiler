import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  CliCommand,
  CliExitCode,
  formatCliResult,
  formatOperationError,
  formatUsageReport,
} from "../../../../src/cli/index.ts";
import {
  createCheckResult,
  createCompileResult,
  createInitResult,
  createValidateResult,
} from "../../../../src/compiler/index.ts";
import {
  createProjectPath,
  DriftReason,
  type Plugin,
} from "../../../../src/core/index.ts";
import { CLAUDE, CODEX } from "../../../../src/providers/index.ts";

const plugin = Object.freeze({
  name: "fixture-skills",
  version: "1.2.3",
  skills: Object.freeze([{}, {}]),
  categories: Object.freeze([{}]),
}) as unknown as Plugin;
const manifestScope = Object.freeze({ rootDir: "/repository" });
const overrideScope = Object.freeze({
  rootDir: "/repository",
  providers: Object.freeze([CODEX]),
});

describe("formatCliResult", () => {
  it("formats created and unchanged initialization paths without providers", () => {
    // GIVEN: Initialization creates two paths and preserves one existing path.
    const result = createInitResult({
      createdPaths: [
        createProjectPath("plugin/skills"),
        createProjectPath("plugin/plugin.yml"),
      ],
      existingPaths: [createProjectPath("plugin")],
      warnings: [],
    });

    // WHEN: The init result is formatted for the terminal.
    const report = formatCliResult(
      { command: CliCommand.Init, result },
      manifestScope,
    );

    // THEN: Output reports filesystem facts without irrelevant providers.
    assert.equal(report.exitCode, CliExitCode.Success);
    assert.deepEqual(report.stdout, [
      "Scope: /repository.",
      "Plugin source initialized.",
      "- plugin/skills: created",
      "- plugin/plugin.yml: created",
      "- plugin: unchanged",
    ]);
    assert.deepEqual(report.stderr, []);
  });

  it("formats validation scope, counts, and warnings", () => {
    // GIVEN: Validation succeeds with one warning for both repository providers.
    const result = createValidateResult({
      plugin,
      providers: [CLAUDE, CODEX],
      providerSelectionSource: "manifest",
      warnings: ["legacy dependency"],
    });

    // WHEN: The validate result is formatted independently from terminal output.
    const report = formatCliResult(
      { command: CliCommand.Validate, result },
      manifestScope,
    );

    // THEN: Scope and result go to stdout while warnings remain on stderr.
    assert.equal(report.exitCode, CliExitCode.Success);
    assert.deepEqual(report.stdout, [
      "Scope: /repository; providers: claude, codex; provider source: manifest.",
      "Validated fixture-skills@1.2.3: 2 skills in 1 category.",
    ]);
    assert.deepEqual(report.stderr, ["Warnings:", "- legacy dependency"]);
    assert.equal(Object.isFrozen(report.stdout), true);
  });

  it("formats check drift as a failing deterministic report", () => {
    // GIVEN: Check observes one stale provider artifact.
    const result = createCheckResult({
      plugin,
      providers: [CODEX],
      providerSelectionSource: "override",
      warnings: [],
      drift: [
        {
          path: createProjectPath(".codex-plugin/plugin.json"),
          reason: DriftReason.ContentDiffers,
        },
      ],
    });

    // WHEN: The stale check is formatted.
    const report = formatCliResult(
      { command: CliCommand.Check, result },
      overrideScope,
    );

    // THEN: Drift uses failure exit semantics and an explicit owned path.
    assert.equal(report.exitCode, CliExitCode.Failure);
    assert.deepEqual(report.stdout, []);
    assert.deepEqual(report.stderr, [
      "Scope: /repository; providers: codex; provider source: override.",
      "Output check found 1 drift entry:",
      "- .codex-plugin/plugin.json: content-differs",
    ]);
  });

  it("formats verified generation with changed and unchanged paths", () => {
    // GIVEN: Generation changes the shared tree and leaves one provider current.
    const result = createCompileResult({
      plugin,
      providers: [],
      providerSelectionSource: "override",
      warnings: [],
      writeResult: {
        changedPaths: [createProjectPath("skills")],
        unchangedPaths: [createProjectPath(".claude-plugin/plugin.json")],
      },
      drift: [],
    });

    // WHEN: The verified generation result is formatted.
    const report = formatCliResult(
      { command: CliCommand.Generate, result },
      overrideScope,
    );

    // THEN: Success communicates post-write verification and factual writes.
    assert.equal(report.exitCode, CliExitCode.Success);
    assert.deepEqual(report.stdout, [
      "Scope: /repository; providers: none; provider source: override.",
      "Generation completed and post-write verification passed.",
      "- skills: changed",
      "- .claude-plugin/plugin.json: unchanged",
    ]);
  });

  it("formats root help as a command overview", () => {
    // GIVEN: The user requests help without selecting a command.

    // WHEN: Root help is formatted.
    const help = formatUsageReport();

    // THEN: The report presents the product, usage, commands, and root options.
    assert.equal(help.exitCode, CliExitCode.Success);
    assert.deepEqual(help.stdout, [
      "A deterministic compiler for PTLam-compatible agent plugin projects.",
      "",
      "Usage: plugin-compiler [OPTIONS] <COMMAND>",
      "",
      "Commands:",
      "  init      Create missing authored plugin source paths",
      "  validate  Validate the authored plugin manifest, skills, and graph",
      "  check     Check compiler-managed output against the authored sources",
      "  generate  Generate and verify all compiler-managed output",
      "",
      "Options:",
      "  -h, --help  Display help for this command",
      "",
      "Provider selection for validate, check, and generate:",
      "  --provider <id>[,<id>...]",
      "  --no-providers",
      "  Possible values: claude, codex, copilot, gemini, kimi",
      "  Omit both options to use plugin/plugin.yml providers.",
      "  --provider replaces the manifest selection; --no-providers selects none.",
      "",
      "Use `plugin-compiler <command> --help` for more information on a command.",
    ]);
    assert.deepEqual(help.stderr, []);
  });

  it.each([
    {
      command: CliCommand.Init,
      introduction:
        "Create missing authored plugin source paths without replacing existing content.",
      supportsProviders: false,
    },
    {
      command: CliCommand.Validate,
      introduction:
        "Validate the authored plugin manifest, skills, and dependency graph.",
      supportsProviders: true,
    },
    {
      command: CliCommand.Check,
      introduction:
        "Check compiler-managed output against the authored plugin sources.",
      supportsProviders: true,
    },
    {
      command: CliCommand.Generate,
      introduction: "Generate and verify all compiler-managed output files.",
      supportsProviders: true,
    },
  ])(
    "formats focused $command help with command options",
    ({ command, introduction, supportsProviders }) => {
      // GIVEN: The user requests help for one recognized compiler command.

      // WHEN: Command-specific help is formatted.
      const help = formatUsageReport({ command });

      // THEN: The report contains only that command's usage and supported options.
      assert.equal(help.exitCode, CliExitCode.Success);
      assert.deepEqual(help.stdout, [
        introduction,
        "",
        `Usage: plugin-compiler ${command} [OPTIONS]`,
        "",
        "Options:",
        "      --root <path>              Plugin repository root",
        "                                 [default: current working directory]",
        ...(supportsProviders
          ? [
              "      --provider <id>[,<id>...]  Select providers as a comma-separated list",
              "                                 [possible values: claude, codex, copilot, gemini, kimi]",
              "                                 [replaces plugin/plugin.yml providers]",
              "      --no-providers             Select no providers; shared skills/ only",
              "                                 [default: plugin/plugin.yml providers]",
            ]
          : []),
        "  -h, --help                     Display help for this command",
      ]);
      assert.doesNotMatch(help.stdout.join("\n"), /Commands:/u);
      assert.deepEqual(help.stderr, []);
    },
  );

  it("formats a command usage failure with focused help on stderr", () => {
    // GIVEN: A recognized check command contains an invalid argument.

    // WHEN: Its usage failure is formatted.
    const invalid = formatUsageReport({
      command: CliCommand.Check,
      error: 'Unknown argument "--future".',
    });

    // THEN: The diagnostic and check usage fail on stderr without the root command list.
    assert.equal(invalid.exitCode, CliExitCode.Usage);
    assert.equal(invalid.stdout.length, 0);
    assert.match(invalid.stderr.join("\n"), /Unknown argument "--future"/u);
    assert.match(
      invalid.stderr.join("\n"),
      /Usage: plugin-compiler check \[OPTIONS\]/u,
    );
    assert.doesNotMatch(invalid.stderr.join("\n"), /Commands:/u);
  });

  it.each([
    {
      scope: manifestScope,
      expected: "requested provider source: manifest",
    },
    {
      scope: overrideScope,
      expected: "requested providers: codex; provider source: override",
    },
    {
      scope: Object.freeze({ rootDir: "/repository", providers: [] }),
      expected: "requested providers: none; provider source: override",
    },
  ])(
    "formats pre-result failure scope honestly: $expected",
    ({ scope, expected }) => {
      // GIVEN: A compiler fails before it can return an effective selection.

      // WHEN: The operation error is formatted from only the requested scope.
      const report = formatOperationError(
        new Error("manifest is invalid"),
        scope,
      );

      // THEN: The report names the requested source without claiming an effective selection.
      assert.equal(report.exitCode, CliExitCode.Failure);
      assert.match(report.stderr.join("\n"), new RegExp(expected, "u"));
      assert.doesNotMatch(report.stderr.join("\n"), /providers: claude/u);
    },
  );
});
