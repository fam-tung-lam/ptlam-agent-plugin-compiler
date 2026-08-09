import path from "node:path";

import { CliCommand, type ParsedCliArguments } from "./cli-models.js";

const COMMANDS = new Set<string>(Object.values(CliCommand));

export class CliUsageError extends Error {
  override readonly name = "CliUsageError";
}

function isCommand(value: string): value is CliCommand {
  return COMMANDS.has(value);
}

/** Parse one command and an optional repository root without compiler knowledge. */
export function parseCliArguments(
  argv: readonly string[],
  currentWorkingDirectory: string,
): ParsedCliArguments {
  if (argv.length === 1 && (argv[0] === "--help" || argv[0] === "-h")) {
    return Object.freeze({ kind: "help" });
  }

  const commandValue = argv[0];
  if (commandValue === undefined) {
    throw new CliUsageError("A command is required.");
  }
  if (!isCommand(commandValue)) {
    throw new CliUsageError(`Unknown command ${JSON.stringify(commandValue)}.`);
  }

  let rootDir = path.resolve(currentWorkingDirectory);
  let rootSeen = false;
  for (let index = 1; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument !== "--root") {
      throw new CliUsageError(`Unknown argument ${JSON.stringify(argument)}.`);
    }
    if (rootSeen) throw new CliUsageError("--root may be specified only once.");
    const rootValue = argv[index + 1];
    if (rootValue === undefined || rootValue === "") {
      throw new CliUsageError("--root requires a path.");
    }
    rootDir = path.resolve(currentWorkingDirectory, rootValue);
    rootSeen = true;
    index += 1;
  }

  return Object.freeze({
    kind: "command",
    command: commandValue,
    rootDir,
  });
}
