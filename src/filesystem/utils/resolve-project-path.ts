import path from "node:path";

import type { ProjectPath } from "../../core/index.js";

/**
 * Resolve a logical project path while rechecking repository containment.
 *
 * @param repositoryRoot - Absolute repository directory.
 * @param projectPath - Validated repository-relative path.
 * @returns The absolute path inside the repository.
 * @throws If resolution escapes the repository root.
 * @internal
 */
export function resolveProjectPath(
  repositoryRoot: string,
  projectPath: ProjectPath,
): string {
  const absolutePath = path.resolve(repositoryRoot, ...projectPath.split("/"));
  const relativePath = path.relative(repositoryRoot, absolutePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`${projectPath}: path escapes the repository root`);
  }
  return absolutePath;
}
