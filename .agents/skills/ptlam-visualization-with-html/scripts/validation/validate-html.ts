import { readFile, stat } from "node:fs/promises";
import { parseArgs } from "node:util";

import { isDirectExecution } from "../utils/is-direct-execution.ts";
import { resolveUserPath } from "../utils/resolve-user-path.ts";
import { validateHtmlDocument } from "./validate-html-document.ts";

const USAGE =
  "Usage: node --experimental-strip-types validate-html.ts <artifact.html>";

export interface ValidateHtmlCLIOptions {
  readonly stdout?: (message: string) => void;
  readonly stderr?: (message: string) => void;
}

/** Execute the validation command without terminating the hosting process. */
export async function runValidateHtmlCommand(
  args: readonly string[],
  options: ValidateHtmlCLIOptions = {},
): Promise<number> {
  const stdout = options.stdout ?? console.log;
  const stderr = options.stderr ?? console.error;

  try {
    const parsed = parseArgs({
      args: [...args],
      allowPositionals: true,
      options: {
        help: { type: "boolean", short: "h", default: false },
      },
      strict: true,
    });

    if (parsed.values.help === true) {
      stdout(USAGE);
      return 0;
    }
    if (parsed.positionals.length !== 1) throw new Error(USAGE);

    const candidate = parsed.positionals[0];
    if (!candidate) throw new Error(USAGE);
    const htmlPath = resolveUserPath(candidate);
    if (!(await isFile(htmlPath))) {
      throw new Error(`file not found: ${htmlPath}`);
    }

    const source = await readFile(htmlPath, "utf8");
    const result = validateHtmlDocument(source);
    for (const warning of result.warnings) stderr(`WARNING: ${warning}`);
    if (result.errors.length > 0) {
      for (const error of result.errors) stderr(`ERROR: ${error}`);
      return 1;
    }

    stdout(`VALID: ${htmlPath}`);
    return 0;
  } catch (error: unknown) {
    stderr(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

async function isFile(candidate: string): Promise<boolean> {
  try {
    return (await stat(candidate)).isFile();
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error.code === "ENOENT" || error.code === "ENOTDIR")
    ) {
      return false;
    }
    throw error;
  }
}

if (isDirectExecution(import.meta.url)) {
  process.exitCode = await runValidateHtmlCommand(process.argv.slice(2));
}
