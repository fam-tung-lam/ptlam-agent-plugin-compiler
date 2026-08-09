import { lstat } from "node:fs/promises";
import path from "node:path";

import type { ProjectPath } from "../../core/index.js";
import {
  assertNoSymlinkEscape,
  type SafePathInspection,
} from "./assert-no-symlink-escape.js";

export type ExpectedPathKind = "directory" | "file";

/** Reject a linked or non-directory repository root before any traversal. */
export async function assertRealRepository(rootDir: string): Promise<string> {
  const repositoryRoot = path.resolve(rootDir);
  const stats = await lstat(repositoryRoot);
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new Error("Repository root must be a real directory, not a link");
  }
  return repositoryRoot;
}

/** Assert the existing terminal kind while allowing an owned path to be absent. */
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
