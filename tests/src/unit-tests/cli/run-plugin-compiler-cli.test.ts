import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  CliExitCode,
  type CompilerOperations,
  runPluginCompilerCli,
} from "../../../../src/cli/index.ts";
import { createValidateResult } from "../../../../src/compiler/index.ts";
import type { ValidatedPlugin } from "../../../../src/core/index.ts";
import { Provider } from "../../../../src/providers/index.ts";

const plugin = Object.freeze({
  name: "fixture-skills",
  version: "1.0.0",
  skills: Object.freeze([]),
  categories: Object.freeze([]),
}) as unknown as ValidatedPlugin;

function operations({
  validate = async () => createValidateResult({ plugin, warnings: [] }),
}: {
  readonly validate?: CompilerOperations["validate"];
} = {}): CompilerOperations {
  return {
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
  it("creates validate operations with both repository providers", async () => {
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

    // THEN: The compiler receives the root and both providers before success is presented.
    assert.equal(exitCode, CliExitCode.Success);
    assert.deepEqual(receivedScope, {
      rootDir: "/repository",
      providers: [Provider.Claude, Provider.Codex],
    });
    assert.match(stdout.join("\n"), /Validated fixture-skills/u);
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
