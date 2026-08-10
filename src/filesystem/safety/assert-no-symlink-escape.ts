import type { Stats } from "node:fs";
import { lstat } from "node:fs/promises";
import path from "node:path";

import type { ProjectPath } from "../../core/index.js";
import { resolveProjectPath } from "../utils/resolve-project-path.js";

/**
 * Result of inspecting a repository-relative path without following links.
 *
 * @internal
 */
export interface SafePathInspection {
  /** Absolute location corresponding to the requested logical path. */
  readonly absolutePath: string;
  /** Terminal entry metadata, or `null` when any path segment is absent. */
  readonly stats: Stats | null;
}

function isMissing(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

/**
 * Inspect every existing path segment without following symbolic links.
 *
 * @param repositoryRoot - Absolute real repository directory.
 * @param projectPath - Validated repository-relative path to inspect.
 * @returns The resolved location and terminal metadata when it exists.
 * @throws If an existing segment is linked, an intermediate segment is not a directory, or inspection fails.
 * @internal
 */
export async function assertNoSymlinkEscape(
  repositoryRoot: string,
  projectPath: ProjectPath,
): Promise<SafePathInspection> {
  const absolutePath = resolveProjectPath(repositoryRoot, projectPath);
  const segments = projectPath.split("/");
  let currentPath = repositoryRoot;

  for (const [index, segment] of segments.entries()) {
    currentPath = path.join(currentPath, segment);
    let stats: Stats;
    try {
      stats = await lstat(currentPath);
    } catch (error) {
      if (isMissing(error)) return { absolutePath, stats: null };
      throw error;
    }

    const checkedPath = segments.slice(0, index + 1).join("/");
    if (stats.isSymbolicLink()) {
      throw new Error(
        `${projectPath}: path contains symbolic link ${checkedPath}`,
      );
    }
    if (index < segments.length - 1 && !stats.isDirectory()) {
      throw new Error(
        `${checkedPath}: expected a directory in the project path`,
      );
    }
    if (index === segments.length - 1) return { absolutePath, stats };
  }

  return { absolutePath, stats: null };
}
