import { parseArgs } from "node:util";

import { isDirectExecution } from "../utils/is-direct-execution.ts";
import { createHtmlScaffold } from "./create-html-scaffold.ts";

const USAGE =
  "Usage: node --experimental-strip-types scaffold-html.ts <output.html> " +
  '[--title "How the system works"] [--force]';

export interface ScaffoldHtmlCLIOptions {
  readonly stdout?: (message: string) => void;
  readonly stderr?: (message: string) => void;
}

/** Execute the scaffold command without terminating the hosting process. */
export async function runScaffoldHtmlCommand(
  args: readonly string[],
  options: ScaffoldHtmlCLIOptions = {},
): Promise<number> {
  const stdout = options.stdout ?? console.log;
  const stderr = options.stderr ?? console.error;

  try {
    const parsed = parseArgs({
      args: [...args],
      allowPositionals: true,
      options: {
        force: { type: "boolean", short: "f", default: false },
        help: { type: "boolean", short: "h", default: false },
        title: { type: "string", short: "t" },
      },
      strict: true,
    });

    if (parsed.values.help === true) {
      stdout(USAGE);
      return 0;
    }
    if (parsed.positionals.length !== 1) {
      throw new Error(USAGE);
    }

    const outputPath = parsed.positionals[0];
    if (!outputPath) throw new Error(USAGE);
    const result = await createHtmlScaffold({
      outputPath,
      overwrite: parsed.values.force,
      ...(parsed.values.title === undefined
        ? {}
        : { title: parsed.values.title }),
    });
    stdout(result.outputPath);
    return 0;
  } catch (error: unknown) {
    stderr(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

if (isDirectExecution(import.meta.url)) {
  process.exitCode = await runScaffoldHtmlCommand(process.argv.slice(2));
}
