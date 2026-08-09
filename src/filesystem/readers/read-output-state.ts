import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import {
  createOutputState,
  createProjectPath,
  OutputEntryKind,
  type OutputFragment,
  OutputOwnershipKind,
  type OutputPlan,
  type OutputState,
  type OutputStateEntryInput,
  type ProjectPath,
} from "../../core/index.js";
import {
  assertRealRepository,
  assertSafePath,
} from "../safety/assert-safe-path.js";

function compareDirents(left: Dirent, right: Dirent): number {
  return left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
}

async function readExactFile(
  repositoryRoot: string,
  projectPath: ProjectPath,
): Promise<OutputStateEntryInput | null> {
  const inspection = await assertSafePath(repositoryRoot, projectPath, "file");
  return inspection.stats === null
    ? null
    : {
        kind: OutputEntryKind.File,
        path: projectPath,
        content: await readFile(inspection.absolutePath),
      };
}

async function walkOutputTree(
  absoluteDirectory: string,
  logicalDirectory: ProjectPath,
  entries: OutputStateEntryInput[],
): Promise<void> {
  const children = await readdir(absoluteDirectory, { withFileTypes: true });
  for (const child of children.sort(compareDirents)) {
    const logicalPath = createProjectPath(`${logicalDirectory}/${child.name}`);
    const absolutePath = path.join(absoluteDirectory, child.name);
    if (child.isSymbolicLink()) {
      throw new Error(
        `${logicalPath}: managed output contains a symbolic link`,
      );
    }
    if (child.isDirectory()) {
      entries.push({ kind: OutputEntryKind.Directory, path: logicalPath });
      await walkOutputTree(absolutePath, logicalPath, entries);
    } else if (child.isFile()) {
      entries.push({
        kind: OutputEntryKind.File,
        path: logicalPath,
        content: await readFile(absolutePath),
      });
    } else {
      throw new Error(`${logicalPath}: managed output has an unsupported kind`);
    }
  }
}

async function readTree(
  repositoryRoot: string,
  root: ProjectPath,
): Promise<OutputStateEntryInput[]> {
  const inspection = await assertSafePath(repositoryRoot, root, "directory");
  if (inspection.stats === null) return [];
  const entries: OutputStateEntryInput[] = [
    { kind: OutputEntryKind.Directory, path: root },
  ];
  await walkOutputTree(inspection.absolutePath, root, entries);
  return entries;
}

function ownerships(plan: OutputPlan): OutputFragment[] {
  return [...plan.fragments];
}

/** Read only complete-tree and exact-file ownership declared by one plan. */
export async function readOutputState(
  rootDir: string,
  plan: OutputPlan,
): Promise<OutputState> {
  const repositoryRoot = await assertRealRepository(rootDir);
  const entries: OutputStateEntryInput[] = [];

  for (const fragment of ownerships(plan)) {
    if (fragment.ownership.kind === OutputOwnershipKind.CompleteTree) {
      entries.push(
        ...(await readTree(repositoryRoot, fragment.ownership.root)),
      );
    } else {
      for (const projectPath of fragment.ownership.paths) {
        const entry = await readExactFile(repositoryRoot, projectPath);
        if (entry !== null) entries.push(entry);
      }
    }
  }
  return createOutputState({ entries });
}
