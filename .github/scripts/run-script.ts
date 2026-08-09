import { spawn } from "node:child_process";
import { appendFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface CommandResult {
  readonly exitCode: number;
  readonly stderr: string;
  readonly stdout: string;
}

export interface CommandRunner {
  run(
    command: string,
    arguments_: readonly string[],
    options?: { readonly cwd?: string },
  ): Promise<CommandResult>;
}

export const systemCommandRunner: CommandRunner = {
  run(command, arguments_, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, [...arguments_], {
        cwd: options.cwd,
        env: process.env,
        shell: process.platform === "win32" && command.endsWith(".cmd"),
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
      let stdout = "";
      let stderr = "";
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk: string) => {
        stderr += chunk;
      });
      child.once("error", reject);
      child.once("close", (exitCode) => {
        resolve({ exitCode: exitCode ?? 1, stderr, stdout });
      });
    });
  },
};

export function requireEnvironment(
  environment: NodeJS.ProcessEnv,
  name: string,
): string {
  const value = environment[name];
  if (value === undefined || value.length === 0) {
    throw new Error(`Required environment variable ${name} is missing.`);
  }
  return value;
}

export function requireSuccess(
  result: CommandResult,
  operation: string,
): CommandResult {
  if (result.exitCode !== 0) {
    throw new Error(
      `${operation} failed with exit code ${result.exitCode}.\n${result.stdout}${result.stderr}`,
    );
  }
  return result;
}

export async function appendGitHubOutput(
  outputPath: string,
  values: Readonly<Record<string, string | boolean>>,
): Promise<void> {
  const content = Object.entries(values)
    .map(([name, value]) => `${name}=${String(value)}\n`)
    .join("");
  await appendFile(outputPath, content, "utf8");
}

export async function appendGitHubSummary(
  summaryPath: string,
  markdown: string,
): Promise<void> {
  await appendFile(summaryPath, markdown, "utf8");
}

export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function isMainModule(moduleUrl: string, argv = process.argv): boolean {
  const scriptPath = argv[1];
  return (
    scriptPath !== undefined &&
    path.resolve(scriptPath) === path.resolve(fileURLToPath(moduleUrl))
  );
}

export function runScript(moduleUrl: string, main: () => Promise<void>): void {
  if (!isMainModule(moduleUrl)) return;
  void main().catch((error: unknown) => {
    const message = error instanceof Error ? error.stack : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
