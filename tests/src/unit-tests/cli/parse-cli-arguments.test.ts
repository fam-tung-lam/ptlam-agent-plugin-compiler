import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  CliCommand,
  CliUsageError,
  parseCliArguments,
} from "../../../../src/cli/index.ts";
import { CLAUDE, CODEX } from "../../../../src/providers/index.ts";

describe("parseCliArguments", () => {
  it.each(Object.values(CliCommand))(
    "parses comma-separated providers for %s in stable registry order",
    (command) => {
      // GIVEN: One supported command selects both built-ins in reverse order.
      const argv = [command, "--provider", "codex,claude"];

      // WHEN: The provider-aware parser resolves the comma-separated selection.
      const parsed = parseCliArguments(argv, "/workspace/repository");

      // THEN: The command carries immutable provider IDs in registry order.
      assert.deepEqual(parsed, {
        kind: "command",
        command,
        rootDir: "/workspace/repository",
        providers: [CLAUDE, CODEX],
      });
      assert.ok(parsed.kind === "command");
      assert.equal(Object.isFrozen(parsed.providers), true);
    },
  );

  it("parses repeated provider flags in stable registry order", () => {
    // GIVEN: A command selects both built-ins in reverse order.
    const argv = ["generate", "--provider", "codex", "--provider", "claude"];

    // WHEN: The provider-aware parser resolves the selection.
    const parsed = parseCliArguments(argv, "/workspace/repository");

    // THEN: The command carries immutable provider IDs in registry order.
    assert.deepEqual(parsed, {
      kind: "command",
      command: CliCommand.Generate,
      rootDir: "/workspace/repository",
      providers: [CLAUDE, CODEX],
    });
    assert.ok(parsed.kind === "command");
    assert.equal(Object.isFrozen(parsed.providers), true);
  });

  it.each(Object.values(CliCommand))(
    "parses %s with the current repository as its default root",
    (command) => {
      // GIVEN: One supported command and a known current repository directory.
      const cwd = "/workspace/repository";

      // WHEN: Arguments are parsed without an explicit root option.
      const parsed = parseCliArguments([command], cwd);

      // THEN: The command uses the resolved current repository root.
      assert.deepEqual(parsed, {
        kind: "command",
        command,
        rootDir: cwd,
        providers: [CLAUDE, CODEX],
      });
      assert.equal(Object.isFrozen(parsed), true);
    },
  );

  it("resolves one explicit repository root relative to the current directory", () => {
    // GIVEN: A validate command selects a neighboring repository.
    const argv = ["validate", "--root", "../fixture"];

    // WHEN: The argument parser resolves the root.
    const parsed = parseCliArguments(argv, "/workspace/current");

    // THEN: The result contains one normalized absolute repository root.
    assert.deepEqual(parsed, {
      kind: "command",
      command: CliCommand.Validate,
      rootDir: "/workspace/fixture",
      providers: [CLAUDE, CODEX],
    });
  });

  it.each([
    { argv: [], expected: "A command is required" },
    { argv: ["legacy"], expected: "Unknown command" },
    { argv: ["check", "--provider"], expected: "requires an identifier" },
    {
      argv: ["check", "--provider", "Claude!"],
      expected: "Invalid provider identifier",
    },
    {
      argv: ["check", "--provider", "future"],
      expected: "unknown provider",
    },
    {
      argv: ["check", "--provider", "codex", "--provider", "codex"],
      expected: "duplicate provider",
    },
    {
      argv: ["check", "--provider", "codex,codex"],
      expected: "duplicate provider",
    },
    {
      argv: ["check", "--provider", "codex,"],
      expected: "Invalid provider identifier",
    },
    { argv: ["generate", "--root"], expected: "requires a path" },
    {
      argv: ["check", "--root", "one", "--root", "two"],
      expected: "only once",
    },
  ])("rejects invalid arguments: $expected", ({ argv, expected }) => {
    // GIVEN: A malformed or unsupported command line.

    // WHEN: The strict parser evaluates the arguments.
    const parsing = () => parseCliArguments(argv, "/workspace");

    // THEN: A usage-specific error explains the invalid shape.
    assert.throws(parsing, (error: unknown) => {
      assert.ok(error instanceof CliUsageError);
      assert.ok(error.message.includes(expected));
      return true;
    });
  });

  it("recognizes standalone help without constructing a command", () => {
    // GIVEN: The user requests CLI help.

    // WHEN: Help arguments are parsed.
    const parsed = parseCliArguments(["--help"], "/workspace");

    // THEN: The result carries no compiler operation.
    assert.deepEqual(parsed, { kind: "help" });
  });
});
