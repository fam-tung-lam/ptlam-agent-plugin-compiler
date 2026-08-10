import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Detect direct CLI execution even when the entry point is reached by symlink. */
export function isDirectExecution(
  moduleUrl: string,
  entryPath: string | undefined = process.argv[1],
): boolean {
  if (entryPath === undefined) return false;

  try {
    return (
      realpathSync(path.resolve(entryPath)) ===
      realpathSync(fileURLToPath(moduleUrl))
    );
  } catch {
    return false;
  }
}
