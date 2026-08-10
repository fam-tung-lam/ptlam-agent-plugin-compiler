import os from "node:os";
import path from "node:path";

/** Resolve an absolute path while supporting the shell-independent `~` form. */
export function resolveUserPath(candidate: string): string {
  const expanded =
    candidate === "~"
      ? os.homedir()
      : candidate.startsWith("~/")
        ? path.join(os.homedir(), candidate.slice(2))
        : candidate;

  return path.resolve(expanded);
}
