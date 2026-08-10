#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { AgentPluginCompiler } from "../compiler/index.js";
import type { CliOutputAdapters } from "./ports.js";
import { runPluginCompilerCli } from "./run-plugin-compiler-cli.js";

const consoleOutput: CliOutputAdapters = Object.freeze({
  stdout: (line: string) => console.log(line),
  stderr: (line: string) => console.error(line),
});

/** Compose the terminal adapter with the real compiler facade. */
export function runPluginCompilerProcess(
  argv: readonly string[],
  {
    currentWorkingDirectory = process.cwd(),
    output = consoleOutput,
  }: {
    readonly currentWorkingDirectory?: string;
    readonly output?: CliOutputAdapters;
  } = {},
): Promise<number> {
  return runPluginCompilerCli({
    argv,
    currentWorkingDirectory,
    createCompiler: (scope) => new AgentPluginCompiler(scope),
    output,
  });
}

const directExecution =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (directExecution) {
  process.exitCode = await runPluginCompilerProcess(process.argv.slice(2));
}
