import path from "node:path";

import {
  createProviderId,
  ProviderAdapterRegistry,
  type ProviderId,
  ProviderSelectionError,
} from "../providers/index.js";
import {
  CliCommand,
  DEFAULT_PROVIDERS,
  type ParsedCliArguments,
} from "./commands.js";

const COMMANDS = new Set<string>(Object.values(CliCommand));

/**
 * Invalid command-line syntax or provider selection.
 *
 * @internal
 */
export class CliUsageError extends Error {
  /** Stable discriminator for usage failures. */
  override readonly name = "CliUsageError";

  /**
   * Create one usage failure, optionally scoped to a recognized command.
   *
   * @param message - User-facing syntax or selection diagnostic.
   * @param command - Recognized command whose usage should accompany the error.
   */
  constructor(
    message: string,
    readonly command?: CliCommand,
  ) {
    super(message);
  }
}

function isCommand(value: string): value is CliCommand {
  return COMMANDS.has(value);
}

function parseProviderId(value: string, command: CliCommand): ProviderId {
  try {
    return createProviderId(value);
  } catch {
    throw new CliUsageError(
      `Invalid provider identifier ${JSON.stringify(value)}.`,
      command,
    );
  }
}

function parseProviderIds(
  value: string,
  command: CliCommand,
): readonly ProviderId[] {
  return value.split(",").map((provider) => parseProviderId(provider, command));
}

function resolveRequestedProviderIds(
  requested: readonly ProviderId[],
  registry: ProviderAdapterRegistry,
  command: CliCommand,
): readonly ProviderId[] {
  if (requested.length === 0) return DEFAULT_PROVIDERS;
  try {
    return Object.freeze(
      registry.resolve(requested).map((adapter) => adapter.id),
    );
  } catch (error) {
    if (error instanceof ProviderSelectionError) {
      throw new CliUsageError(`${error.message}.`, command);
    }
    throw error;
  }
}

/**
 * Parse one command, repository root, and provider selection.
 *
 * @param argv - Command-line tokens without the executable and script path.
 * @param currentWorkingDirectory - Base directory used to resolve `--root`.
 * @param registry - Registry used to validate requested provider identifiers.
 * @returns Immutable help input or a resolved command scope.
 * @throws {@link CliUsageError} when syntax, identifiers, or selection are invalid.
 * @internal
 */
export function parseCliArguments(
  argv: readonly string[],
  currentWorkingDirectory: string,
  registry = ProviderAdapterRegistry.withBuiltIns(),
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

  if (
    argv.slice(1).some((argument) => argument === "--help" || argument === "-h")
  ) {
    return Object.freeze({ kind: "help", command: commandValue });
  }

  let rootDir = path.resolve(currentWorkingDirectory);
  let rootSeen = false;
  let providerSeen = false;
  const requestedProviders: ProviderId[] = [];
  for (let index = 1; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--root") {
      if (rootSeen)
        throw new CliUsageError(
          "--root may be specified only once.",
          commandValue,
        );
      const rootValue = argv[index + 1];
      if (rootValue === undefined || rootValue === "") {
        throw new CliUsageError("--root requires a path.", commandValue);
      }
      rootDir = path.resolve(currentWorkingDirectory, rootValue);
      rootSeen = true;
      index += 1;
      continue;
    }
    if (argument === "--provider") {
      if (commandValue === CliCommand.Init) {
        throw new CliUsageError(
          "init accepts only --root <path>.",
          commandValue,
        );
      }
      if (providerSeen) {
        throw new CliUsageError(
          "--provider may be specified only once.",
          commandValue,
        );
      }
      const providerValue = argv[index + 1];
      if (providerValue === undefined || providerValue === "") {
        throw new CliUsageError(
          "--provider requires an identifier.",
          commandValue,
        );
      }
      requestedProviders.push(...parseProviderIds(providerValue, commandValue));
      providerSeen = true;
      index += 1;
      continue;
    }
    throw new CliUsageError(
      `Unknown argument ${JSON.stringify(argument)}.`,
      commandValue,
    );
  }

  return Object.freeze({
    kind: "command",
    command: commandValue,
    rootDir,
    providers: resolveRequestedProviderIds(
      requestedProviders,
      registry,
      commandValue,
    ),
  });
}
