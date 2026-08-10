import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  CliExitCode,
  type CompilerOperations,
  runPluginCompilerCli,
} from "../../../../src/cli/index.ts";
import { createValidateResult } from "../../../../src/compiler/index.ts";
import type { Plugin } from "../../../../src/core/index.ts";
import { CODEX } from "../../../../src/providers/index.ts";

const plugin = Object.freeze({
  name: "fixture-skills",
  version: "1.0.0",
  skills: Object.freeze([]),
  categories: Object.freeze([]),
}) as unknown as Plugin;

function operations({
  validate = async () =>
    createValidateResult({
      plugin,
      providers: [CODEX],
      providerSelectionSource: "manifest",
      warnings: [],
    }),
}: {
  readonly validate?: CompilerOperations["validate"];
} = {}): CompilerOperations {
  return {
    init: async () => ({
      createdPaths: [],
      existingPaths: [],
      warnings: [],
    }),
    validate,
    check: async () => {
      throw new Error("Unexpected check call");
    },
    compile: async () => {
      throw new Error("Unexpected compile call");
    },
  };
}

describe("runPluginCompilerCli", () => {
  it.each([
    { argv: ["--help"], expectedUsage: "plugin-compiler [OPTIONS] <COMMAND>" },
    {
      argv: ["init", "--help"],
      expectedUsage: "plugin-compiler init [OPTIONS]",
    },
    {
      argv: ["compile", "-h"],
      expectedUsage: "plugin-compiler compile [OPTIONS]",
    },
  ])(
    "presents $expectedUsage without constructing the compiler",
    async ({ argv, expectedUsage }) => {
      // GIVEN: Compiler construction would fail if help crossed the parsing boundary.
      const stdout: string[] = [];

      // WHEN: The user requests root or command-specific help.
      const exitCode = await runPluginCompilerCli({
        argv,
        currentWorkingDirectory: "/repository",
        createCompiler: () => {
          throw new Error("Help must not construct the compiler");
        },
        output: {
          stdout: (line) => stdout.push(line),
          stderr: () => undefined,
        },
      });

      // THEN: Help succeeds through the output adapter without compiler work.
      assert.equal(exitCode, CliExitCode.Success);
      assert.ok(stdout.join("\n").includes(expectedUsage));
    },
  );

  it.each(["--provider", "--no-providers"])(
    "presents init usage failures for %s with only init options",
    async (providerFlag) => {
      // GIVEN: Init receives an unsupported provider option and compiler construction is forbidden.
      const stderr: string[] = [];

      // WHEN: The invalid request runs through the CLI boundary.
      const exitCode = await runPluginCompilerCli({
        argv:
          providerFlag === "--provider"
            ? ["init", providerFlag, "codex"]
            : ["init", providerFlag],
        currentWorkingDirectory: "/repository",
        createCompiler: () => {
          throw new Error("Usage failures must not construct the compiler");
        },
        output: {
          stdout: () => undefined,
          stderr: (line) => stderr.push(line),
        },
      });

      // THEN: The diagnostic carries focused init help without provider selection.
      assert.equal(exitCode, CliExitCode.Usage);
      assert.match(stderr.join("\n"), /init accepts only --root <path>/u);
      assert.match(
        stderr.join("\n"),
        /Usage: plugin-compiler init \[OPTIONS\]/u,
      );
      assert.doesNotMatch(stderr.join("\n"), /--provider <id>/u);
      assert.doesNotMatch(stderr.join("\n"), /--no-providers/u);
    },
  );

  it("passes an explicit provider selection to the compiler", async () => {
    // GIVEN: A compiler factory records the parsed operation scope.
    let receivedScope: unknown;

    // WHEN: Validation selects only Codex.
    const exitCode = await runPluginCompilerCli({
      argv: ["validate", "--provider", "codex"],
      currentWorkingDirectory: "/repository",
      createCompiler: (scope) => {
        receivedScope = scope;
        return operations();
      },
      output: {
        stdout: () => undefined,
        stderr: () => undefined,
      },
    });

    // THEN: The compiler receives only the selected provider ID.
    assert.equal(exitCode, CliExitCode.Success);
    assert.deepEqual(receivedScope, {
      rootDir: "/repository",
      providers: [CODEX],
    });
  });

  it("passes an explicit empty provider selection to the compiler", async () => {
    // GIVEN: A compiler factory records the parsed operation scope.
    let receivedScope: unknown;

    // WHEN: Validation explicitly selects no provider adapters.
    const exitCode = await runPluginCompilerCli({
      argv: ["validate", "--no-providers"],
      currentWorkingDirectory: "/repository",
      createCompiler: (scope) => {
        receivedScope = scope;
        return operations();
      },
      output: {
        stdout: () => undefined,
        stderr: () => undefined,
      },
    });

    // THEN: The compiler receives an explicit immutable empty override.
    assert.equal(exitCode, CliExitCode.Success);
    assert.deepEqual(receivedScope, {
      rootDir: "/repository",
      providers: [],
    });
    assert.ok(
      typeof receivedScope === "object" &&
        receivedScope !== null &&
        Object.isFrozen((receivedScope as { providers: unknown }).providers),
    );
  });

  it("preserves an omitted provider override for manifest resolution", async () => {
    // GIVEN: A compiler factory records scope and terminal adapters collect output.
    let receivedScope: unknown;
    const stdout: string[] = [];
    const stderr: string[] = [];

    // WHEN: The repository validate command runs through the CLI seam.
    const exitCode = await runPluginCompilerCli({
      argv: ["validate"],
      currentWorkingDirectory: "/repository",
      createCompiler: (scope) => {
        receivedScope = scope;
        return operations();
      },
      output: {
        stdout: (line) => stdout.push(line),
        stderr: (line) => stderr.push(line),
      },
    });

    // THEN: The compiler receives only the root and reports the manifest selection.
    assert.equal(exitCode, CliExitCode.Success);
    assert.deepEqual(receivedScope, {
      rootDir: "/repository",
    });
    assert.match(stdout.join("\n"), /Validated fixture-skills/u);
    assert.match(stdout.join("\n"), /providers: codex/u);
    assert.match(stdout.join("\n"), /provider source: manifest/u);
    assert.deepEqual(stderr, []);
  });

  it("turns compiler failures into a scoped failure report", async () => {
    // GIVEN: Validation rejects the authored source and stderr is observable.
    const stderr: string[] = [];

    // WHEN: The compiler operation throws through the CLI seam.
    const exitCode = await runPluginCompilerCli({
      argv: ["validate", "--root", "fixture"],
      currentWorkingDirectory: "/workspace",
      createCompiler: () =>
        operations({
          validate: async () => {
            throw new Error("manifest is invalid");
          },
        }),
      output: {
        stdout: () => undefined,
        stderr: (line) => stderr.push(line),
      },
    });

    // THEN: The error becomes exit code one and retains the selected repository scope.
    assert.equal(exitCode, CliExitCode.Failure);
    assert.match(stderr.join("\n"), /Scope: \/workspace\/fixture/u);
    assert.match(stderr.join("\n"), /manifest is invalid/u);
  });

  it("deliberately propagates output-adapter failures", async () => {
    // GIVEN: Compilation succeeds but the stdout adapter cannot present its report.
    const sinkFailure = new Error("stdout sink failed");

    // WHEN: The successful result reaches the failing output adapter.
    const execution = runPluginCompilerCli({
      argv: ["validate"],
      currentWorkingDirectory: "/repository",
      createCompiler: () => operations(),
      output: {
        stdout: () => {
          throw sinkFailure;
        },
        stderr: () => undefined,
      },
    });

    // THEN: Presentation failure propagates instead of masquerading as compiler failure.
    await assert.rejects(execution, (error: unknown) => error === sinkFailure);
  });
});
