import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import {
  type ArtifactInput,
  ArtifactKind,
  createGeneratedSnapshot,
  createProjectPath,
  type GeneratedSnapshot,
  OwnershipKind,
  type PlanFragment,
  type ProjectPath,
  type WritePlan,
} from "../../core/index.js";
import { assertNoSymlinkEscape } from "../safety/assert-no-symlink-escape.js";
import { assertRealRepository } from "../safety/assert-safe-path.js";

function compareDirents(left: Dirent, right: Dirent): number {
  return left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
}

async function readExactPath(
  repositoryRoot: string,
  projectPath: ProjectPath,
): Promise<ArtifactInput | null> {
  const inspection = await assertNoSymlinkEscape(repositoryRoot, projectPath);
  if (inspection.stats === null) return null;
  if (inspection.stats.isDirectory()) {
    return { kind: ArtifactKind.Directory, path: projectPath };
  }
  if (!inspection.stats.isFile()) {
    throw new Error(`${projectPath}: generated path has an unsupported kind`);
  }
  return {
    kind: ArtifactKind.File,
    path: projectPath,
    content: await readFile(inspection.absolutePath),
  };
}

async function walkGeneratedTree(
  absoluteDirectory: string,
  logicalDirectory: ProjectPath,
  entries: ArtifactInput[],
): Promise<void> {
  const children = await readdir(absoluteDirectory, { withFileTypes: true });
  for (const child of children.sort(compareDirents)) {
    const logicalPath = createProjectPath(`${logicalDirectory}/${child.name}`);
    const absolutePath = path.join(absoluteDirectory, child.name);
    if (child.isSymbolicLink()) {
      throw new Error(
        `${logicalPath}: generated tree contains a symbolic link`,
      );
    }
    if (child.isDirectory()) {
      entries.push({ kind: ArtifactKind.Directory, path: logicalPath });
      await walkGeneratedTree(absolutePath, logicalPath, entries);
    } else if (child.isFile()) {
      entries.push({
        kind: ArtifactKind.File,
        path: logicalPath,
        content: await readFile(absolutePath),
      });
    } else {
      throw new Error(`${logicalPath}: generated tree has an unsupported kind`);
    }
  }
}

async function readTree(
  repositoryRoot: string,
  root: ProjectPath,
): Promise<ArtifactInput[]> {
  const inspection = await assertNoSymlinkEscape(repositoryRoot, root);
  if (inspection.stats === null) return [];
  if (inspection.stats.isFile()) {
    return [
      {
        kind: ArtifactKind.File,
        path: root,
        content: await readFile(inspection.absolutePath),
      },
    ];
  }
  if (!inspection.stats.isDirectory()) {
    throw new Error(`${root}: generated tree has an unsupported kind`);
  }
  const entries: ArtifactInput[] = [
    { kind: ArtifactKind.Directory, path: root },
  ];
  await walkGeneratedTree(inspection.absolutePath, root, entries);
  return entries;
}

function fragments(plan: WritePlan): PlanFragment[] {
  return [...plan.fragments];
}

/**
 * Read generated entries only from ownership declared by a write plan.
 *
 * @param rootDir - Repository root to inspect without following symbolic links.
 * @param plan - Plan whose complete-tree and exact-file ownership bounds the read.
 * @returns An immutable snapshot of existing owned entries.
 * @throws If the root is invalid, an owned path is unsafe, or an entry has an unsupported kind.
 * @internal
 */
export async function readGeneratedSnapshot(
  rootDir: string,
  plan: WritePlan,
): Promise<GeneratedSnapshot> {
  const repositoryRoot = await assertRealRepository(rootDir);
  const entries: ArtifactInput[] = [];

  for (const fragment of fragments(plan)) {
    if (fragment.ownership.kind === OwnershipKind.CompleteTree) {
      entries.push(
        ...(await readTree(repositoryRoot, fragment.ownership.root)),
      );
    } else {
      for (const projectPath of fragment.ownership.paths) {
        const entry = await readExactPath(repositoryRoot, projectPath);
        if (entry !== null) entries.push(entry);
      }
    }
  }
  return createGeneratedSnapshot({ entries });
}
