import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  CliCommand,
  CliExitCode,
  formatCliResult,
  formatUsageReport,
} from "../../../../src/cli/index.ts";
import {
  createCheckResult,
  createGenerateResult,
  createValidateResult,
} from "../../../../src/compiler/index.ts";
import {
  createProjectPath,
  OutputDifferenceReason,
  type ValidatedPlugin,
} from "../../../../src/core/index.ts";

const plugin = Object.freeze({
  name: "fixture-skills",
  version: "1.2.3",
  skills: Object.freeze([{}, {}]),
  categories: Object.freeze([{}]),
}) as unknown as ValidatedPlugin;
const scope = Object.freeze({
  rootDir: "/repository",
  providerIds: Object.freeze(["claude", "codex"]),
});

describe("formatCliResult", () => {
  it("formats validation scope, counts, and warnings", () => {
    // GIVEN: Validation succeeds with one warning for both repository providers.
    const result = createValidateResult({
      plugin,
      warnings: ["legacy dependency"],
    });

    // WHEN: The validate result is formatted independently from terminal output.
    const report = formatCliResult(
      { command: CliCommand.Validate, result },
      scope,
    );

    // THEN: Scope and result go to stdout while warnings remain on stderr.
    assert.equal(report.exitCode, CliExitCode.Success);
    assert.deepEqual(report.stdout, [
      "Scope: /repository; providers: claude, codex.",
      "Validated fixture-skills@1.2.3: 2 skills in 1 category.",
    ]);
    assert.deepEqual(report.stderr, ["Warnings:", "- legacy dependency"]);
    assert.equal(Object.isFrozen(report.stdout), true);
  });

  it("formats check drift as a failing deterministic report", () => {
    // GIVEN: Check observes one stale provider artifact.
    const result = createCheckResult({
      plugin,
      warnings: [],
      differences: [
        {
          path: createProjectPath(".codex-plugin/plugin.json"),
          reason: OutputDifferenceReason.ContentDiffers,
        },
      ],
    });

    // WHEN: The stale check is formatted.
    const report = formatCliResult(
      { command: CliCommand.Check, result },
      scope,
    );

    // THEN: Drift uses failure exit semantics and an explicit owned path.
    assert.equal(report.exitCode, CliExitCode.Failure);
    assert.deepEqual(report.stdout, []);
    assert.deepEqual(report.stderr, [
      "Scope: /repository; providers: claude, codex.",
      "Output check found 1 difference:",
      "- .codex-plugin/plugin.json: content-differs",
    ]);
  });

  it("formats verified generation with changed and unchanged paths", () => {
    // GIVEN: Generation changes the shared tree and leaves one provider current.
    const result = createGenerateResult({
      plugin,
      warnings: [],
      writeResult: {
        changedPaths: [createProjectPath("skills")],
        unchangedPaths: [createProjectPath(".claude-plugin/plugin.json")],
      },
      differences: [],
    });

    // WHEN: The verified generation result is formatted.
    const report = formatCliResult(
      { command: CliCommand.Generate, result },
      scope,
    );

    // THEN: Success communicates post-write verification and factual writes.
    assert.equal(report.exitCode, CliExitCode.Success);
    assert.deepEqual(report.stdout, [
      "Scope: /repository; providers: claude, codex.",
      "Generation completed and post-write verification passed.",
      "- skills: changed",
      "- .claude-plugin/plugin.json: unchanged",
    ]);
  });

  it("formats help and usage failures on separate terminal streams", () => {
    // GIVEN: One explicit help request and one invalid argument diagnostic.

    // WHEN: Both usage reports are formatted.
    const help = formatUsageReport();
    const invalid = formatUsageReport('Unknown command "legacy".');

    // THEN: Help succeeds on stdout while misuse fails with exit code two on stderr.
    assert.equal(help.exitCode, CliExitCode.Success);
    assert.match(help.stdout.join("\n"), /validate\|check\|generate/u);
    assert.equal(invalid.exitCode, CliExitCode.Usage);
    assert.match(invalid.stderr.join("\n"), /Unknown command/u);
  });
});
