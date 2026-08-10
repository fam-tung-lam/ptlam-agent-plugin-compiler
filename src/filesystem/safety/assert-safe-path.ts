import { lstat } from "node:fs/promises";
import path from "node:path";

import type { ProjectPath } from "../../core/index.js";
import {
  assertNoSymlinkEscape,
  type SafePathInspection,
} from "./assert-no-symlink-escape.js";

/**
 * Terminal filesystem kind required by a safe-path inspection.
 *
 * @internal
 */
export type ExpectedPathKind = "directory" | "file";

/**
 * Resolve and validate a real repository root before traversal.
 *
 * @param rootDir - Repository root supplied by a caller.
 * @returns The absolute real directory path.
 * @throws If the path is missing, linked, not a directory, or cannot be inspected.
 * @internal
 */
export async function assertRealRepository(rootDir: string): Promise<string> {
  const repositoryRoot = path.resolve(rootDir);
  const stats = await lstat(repositoryRoot);
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new Error("Repository root must be a real directory, not a link");
  }
  return repositoryRoot;
}

/**
 * Validate a repository-relative path and its existing terminal kind.
 *
 * @param repositoryRoot - Absolute real repository directory.
 * @param projectPath - Validated repository-relative path to inspect.
 * @param expectedKind - Required kind when the terminal entry exists.
 * @returns Safe inspection data; absent owned paths retain `null` metadata.
 * @throws If a segment is unsafe, inspection fails, or the terminal kind differs.
 * @internal
 */
export async function assertSafePath(
  repositoryRoot: string,
  projectPath: ProjectPath,
  expectedKind: ExpectedPathKind,
): Promise<SafePathInspection> {
  const inspection = await assertNoSymlinkEscape(repositoryRoot, projectPath);
  if (inspection.stats === null) return inspection;
  const valid =
    expectedKind === "file"
      ? inspection.stats.isFile()
      : inspection.stats.isDirectory();
  if (!valid) {
    throw new Error(`${projectPath}: expected a regular ${expectedKind}`);
  }
  return inspection;
}
