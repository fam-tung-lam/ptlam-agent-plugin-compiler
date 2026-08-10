import { rm } from "node:fs/promises";

import {
  type Artifact,
  ArtifactKind,
  compareProjectPaths,
  createWriteResult,
  type FileArtifact,
  OwnershipKind,
  type ProjectPath,
  type WritePlan,
  type WriteResult,
} from "../../core/index.js";
import { readGeneratedSnapshot } from "../readers/read-generated-snapshot.js";
import {
  assertRealRepository,
  assertSafePath,
} from "../safety/assert-safe-path.js";
import { atomicWrite } from "./atomic-write.js";
import {
  installStagedTree,
  stageGeneratedTree,
} from "./skills-tree-transaction.js";

interface ExactTarget {
  /** Owned standalone file path. */
  readonly path: ProjectPath;
  /** Desired file artifact, or undefined when the path must be absent. */
  readonly artifact: FileArtifact | undefined;
}

interface TreeTarget {
  /** Owned complete-tree root. */
  readonly root: ProjectPath;
  /** Complete desired artifact set below the root. */
  readonly artifacts: readonly Artifact[];
}

function isInsideTree(root: ProjectPath, path: ProjectPath): boolean {
  return path === root || path.startsWith(`${root}/`);
}

function collectTargets(plan: WritePlan): {
  readonly exact: ExactTarget[];
  readonly trees: TreeTarget[];
} {
  const exact: ExactTarget[] = [];
  const trees: TreeTarget[] = [];
  const owned = new Set<ProjectPath>();

  for (const fragment of plan.fragments) {
    if (fragment.ownership.kind === OwnershipKind.ExactFiles) {
      const ownedPaths = fragment.ownership.paths;
      for (const path of ownedPaths) {
        if (owned.has(path)) throw new Error(`${path}: duplicate ownership`);
        owned.add(path);
        const matches = fragment.artifacts.filter(
          (artifact) => artifact.path === path,
        );
        const artifact = matches[0];
        if (
          matches.length > 1 ||
          (artifact !== undefined && artifact.kind !== ArtifactKind.File)
        ) {
          throw new Error(
            `${path}: exact ownership permits at most one file artifact`,
          );
        }
        exact.push({ path, artifact });
      }
      if (
        fragment.artifacts.some(
          (artifact) => !ownedPaths.includes(artifact.path),
        )
      ) {
        throw new Error(
          `${fragment.ownerId}: fragment emits outside exact ownership`,
        );
      }
    } else {
      const root = fragment.ownership.root;
      if (owned.has(root)) throw new Error(`${root}: duplicate ownership`);
      owned.add(root);
      if (
        fragment.artifacts.some(
          (artifact) => !isInsideTree(root, artifact.path),
        )
      ) {
        throw new Error(
          `${fragment.ownerId}: fragment emits outside tree ${root}`,
        );
      }
      trees.push({ root, artifacts: fragment.artifacts });
    }
  }
  exact.sort((left, right) => compareProjectPaths(left.path, right.path));
  trees.sort((left, right) => compareProjectPaths(left.root, right.root));
  return { exact, trees };
}

function entryAt(
  entries: readonly Artifact[],
  path: ProjectPath,
): Artifact | undefined {
  return entries.find((entry) => entry.path === path);
}

function exactTargetIsCurrent(
  entries: readonly Artifact[],
  target: ExactTarget,
): boolean {
  const current = entryAt(entries, target.path);
  if (target.artifact === undefined) return current === undefined;
  return (
    current?.kind === ArtifactKind.File &&
    current.content.equals(target.artifact.content)
  );
}

function treeIsCurrent(
  entries: readonly Artifact[],
  target: TreeTarget,
): boolean {
  const actual = entries.filter((entry) =>
    isInsideTree(target.root, entry.path),
  );
  if (actual.length !== target.artifacts.length) return false;
  return target.artifacts.every((expected) => {
    const current = entryAt(actual, expected.path);
    if (current?.kind !== expected.kind) return false;
    if (expected.kind === ArtifactKind.Directory) return true;
    return (
      current.kind === ArtifactKind.File &&
      current.content.equals(expected.content)
    );
  });
}

async function preflightTargets(
  repositoryRoot: string,
  exact: readonly ExactTarget[],
  trees: readonly TreeTarget[],
): Promise<void> {
  for (const target of exact) {
    await assertSafePath(repositoryRoot, target.path, "file");
  }
  for (const target of trees) {
    await assertSafePath(repositoryRoot, target.root, "directory");
  }
}

async function applyExactTarget(
  repositoryRoot: string,
  target: ExactTarget,
): Promise<void> {
  if (target.artifact !== undefined) {
    await atomicWrite(repositoryRoot, target.path, target.artifact.content);
    return;
  }

  const inspection = await assertSafePath(repositoryRoot, target.path, "file");
  if (inspection.stats !== null) {
    await rm(inspection.absolutePath, { force: true });
  }
}

/**
 * Apply one write plan while preserving exact-file and complete-tree ownership.
 *
 * @param rootDir - Repository root to update without following symbolic links.
 * @param plan - Validated desired state and ownership declarations.
 * @returns Immutable changed and unchanged ownership roots.
 * @throws If ownership is inconsistent, a path is unsafe, or a filesystem operation fails.
 * @internal
 */
export async function writePlan(
  rootDir: string,
  plan: WritePlan,
): Promise<WriteResult> {
  const repositoryRoot = await assertRealRepository(rootDir);
  const { exact, trees } = collectTargets(plan);
  await preflightTargets(repositoryRoot, exact, trees);
  const current = await readGeneratedSnapshot(repositoryRoot, plan);
  const changedExact = exact.filter(
    (target) => !exactTargetIsCurrent(current.entries, target),
  );
  const changedTrees = trees.filter(
    (target) => !treeIsCurrent(current.entries, target),
  );
  const stagedTrees = new Map<ProjectPath, string>();

  try {
    for (const target of changedTrees) {
      stagedTrees.set(
        target.root,
        await stageGeneratedTree(repositoryRoot, target.root, target.artifacts),
      );
    }
    for (const target of changedExact) {
      await applyExactTarget(repositoryRoot, target);
    }
    for (const target of changedTrees) {
      const stagedPath = stagedTrees.get(target.root);
      if (stagedPath === undefined)
        throw new Error(`${target.root}: staged tree is missing`);
      await installStagedTree(repositoryRoot, target.root, stagedPath);
      stagedTrees.delete(target.root);
    }
  } catch (error) {
    await Promise.all(
      [...stagedTrees.values()].map((stagedPath) =>
        rm(stagedPath, { force: true, recursive: true }),
      ),
    );
    throw error;
  }

  const changedPaths = [
    ...changedExact.map((target) => target.path),
    ...changedTrees.map((target) => target.root),
  ].sort(compareProjectPaths);
  const allPaths = [
    ...exact.map((target) => target.path),
    ...trees.map((target) => target.root),
  ].sort(compareProjectPaths);
  return createWriteResult({
    changedPaths,
    unchangedPaths: allPaths.filter((path) => !changedPaths.includes(path)),
  });
}
