import path from "node:path";

import type { ProjectPath } from "../../core/index.js";

/** Resolve a validated logical path and defensively recheck repository containment. */
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
