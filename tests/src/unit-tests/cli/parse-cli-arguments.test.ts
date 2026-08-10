import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  CliCommand,
  CliUsageError,
  parseCliArguments,
} from "../../../../src/cli/index.ts";
import {
  CLAUDE,
  CODEX,
  COPILOT,
  GEMINI,
  KIMI,
} from "../../../../src/providers/index.ts";

const PROVIDER_COMMANDS = Object.freeze([
  CliCommand.Validate,
  CliCommand.Check,
  CliCommand.Compile,
]);

describe("parseCliArguments", () => {
  it.each(PROVIDER_COMMANDS)(
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

  it.each(PROVIDER_COMMANDS)(
    "parses an explicit empty provider override for %s",
    (command) => {
      // GIVEN: One provider-aware command explicitly disables provider adapters.
      const argv = [command, "--no-providers"];

      // WHEN: The parser resolves the explicit empty selection.
      const parsed = parseCliArguments(argv, "/workspace/repository");

      // THEN: The command carries an immutable empty provider override.
      assert.deepEqual(parsed, {
        kind: "command",
        command,
        rootDir: "/workspace/repository",
        providers: [],
      });
      assert.ok(parsed.kind === "command");
      assert.equal(Object.isFrozen(parsed.providers), true);
    },
  );

  it.each(PROVIDER_COMMANDS)(
    "accepts every built-in provider for %s",
    (command) => {
      // GIVEN: One provider-aware command selects all public provider IDs.
      const argv = [command, "--provider", "kimi,gemini,copilot,codex,claude"];

      // WHEN: The parser resolves the comma-separated provider selection.
      const parsed = parseCliArguments(argv, "/workspace/repository");

      // THEN: All adapters are returned in stable registry order.
      assert.ok(parsed.kind === "command");
      assert.deepEqual(parsed.providers, [
        CLAUDE,
        CODEX,
        COPILOT,
        GEMINI,
        KIMI,
      ]);
    },
  );

  it.each(PROVIDER_COMMANDS)(
    "rejects repeated provider flags for %s",
    (command) => {
      // GIVEN: One supported command specifies the provider option twice.
      const argv = [command, "--provider", "claude", "--provider", "codex"];

      // WHEN: The strict parser evaluates the repeated option.
      const parsing = () => parseCliArguments(argv, "/workspace/repository");

      // THEN: The command requires one comma-separated provider option.
      assert.throws(parsing, (error: unknown) => {
        assert.ok(error instanceof CliUsageError);
        assert.match(error.message, /--provider may be specified only once/u);
        return true;
      });
    },
  );

  it.each(Object.values(CliCommand))(
    "parses %s with the current repository as its default root",
    (command) => {
      // GIVEN: One supported command and a known current repository directory.
      const cwd = "/workspace/repository";

      // WHEN: Arguments are parsed without an explicit root option.
      const parsed = parseCliArguments([command], cwd);

      // THEN: The command uses the root without inventing a provider override.
      assert.deepEqual(parsed, {
        kind: "command",
        command,
        rootDir: cwd,
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
    });
  });

  it("resolves an explicit repository root for init without provider options", () => {
    // GIVEN: Init targets a neighboring plugin repository.
    const argv = ["init", "--root", "../plugin"];

    // WHEN: The shared root option is parsed for initialization.
    const parsed = parseCliArguments(argv, "/workspace/current");

    // THEN: Init receives only the normalized target.
    assert.deepEqual(parsed, {
      kind: "command",
      command: CliCommand.Init,
      rootDir: "/workspace/plugin",
    });
  });

  it.each([
    { argv: [], expected: "A command is required" },
    { argv: ["legacy"], expected: "Unknown command" },
    { argv: ["generate"], expected: "Unknown command" },
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
      argv: ["check", "--provider", "codex,codex"],
      expected: "duplicate provider",
    },
    {
      argv: ["check", "--provider", "codex,"],
      expected: "Invalid provider identifier",
    },
    {
      argv: ["check", "--provider", "codex", "--no-providers"],
      expected: "mutually exclusive",
    },
    {
      argv: ["check", "--no-providers", "--provider", "codex"],
      expected: "mutually exclusive",
    },
    {
      argv: ["check", "--no-providers", "--no-providers"],
      expected: "only once",
    },
    { argv: ["compile", "--root"], expected: "requires a path" },
    {
      argv: ["check", "--root", "one", "--root", "two"],
      expected: "only once",
    },
    { argv: ["init", "--provider", "codex"], expected: "only --root" },
    { argv: ["init", "--no-providers"], expected: "only --root" },
    { argv: ["init", "--adopt"], expected: "Unknown argument" },
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

  it.each([
    { argv: ["--help"], expected: { kind: "help" } },
    { argv: ["-h"], expected: { kind: "help" } },
    ...Object.values(CliCommand).flatMap((command) => [
      {
        argv: [command, "--help"],
        expected: { kind: "help", command },
      },
      { argv: [command, "-h"], expected: { kind: "help", command } },
    ]),
  ])(
    "parses focused help without constructing a command: $argv",
    ({ argv, expected }) => {
      // GIVEN: The user requests root or command-specific CLI help.

      // WHEN: Help arguments are parsed.
      const parsed = parseCliArguments(argv, "/workspace");

      // THEN: The result identifies only the requested help scope.
      assert.deepEqual(parsed, expected);
    },
  );
});
