import { rm } from "node:fs/promises";

import {
  compareProjectPaths,
  OutputEntryKind,
  type OutputFile,
  OutputOwnershipKind,
  type OutputPlan,
  type OutputStateEntry,
  type PlannedArtifact,
  type ProjectPath,
} from "../../core/index.js";
import { createWriteResult, type WriteResult } from "../models/write-result.js";
import { readOutputState } from "../readers/read-output-state.js";
import {
  assertRealRepository,
  assertSafePath,
} from "../safety/assert-safe-path.js";
import { atomicWrite } from "./atomic-write.js";
import {
  installStagedTree,
  stageOutputTree,
} from "./skills-tree-transaction.js";

interface ExactTarget {
  readonly path: ProjectPath;
  readonly artifact: OutputFile;
}

interface TreeTarget {
  readonly root: ProjectPath;
  readonly artifacts: readonly PlannedArtifact[];
}

function isInsideTree(root: ProjectPath, path: ProjectPath): boolean {
  return path === root || path.startsWith(`${root}/`);
}

function collectTargets(plan: OutputPlan): {
  readonly exact: ExactTarget[];
  readonly trees: TreeTarget[];
} {
  const exact: ExactTarget[] = [];
  const trees: TreeTarget[] = [];
  const owned = new Set<ProjectPath>();

  for (const fragment of plan.fragments) {
    if (fragment.ownership.kind === OutputOwnershipKind.ExactFiles) {
      const ownedPaths = fragment.ownership.paths;
      for (const path of ownedPaths) {
        if (owned.has(path))
          throw new Error(`${path}: duplicate output ownership`);
        owned.add(path);
        const matches = fragment.artifacts.filter(
          (artifact) => artifact.path === path,
        );
        const artifact = matches[0];
        if (
          matches.length !== 1 ||
          artifact === undefined ||
          artifact.kind !== OutputEntryKind.File
        ) {
          throw new Error(
            `${path}: exact ownership requires one file artifact`,
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
      if (owned.has(root))
        throw new Error(`${root}: duplicate output ownership`);
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
  entries: readonly OutputStateEntry[],
  path: ProjectPath,
): OutputStateEntry | undefined {
  return entries.find((entry) => entry.path === path);
}

function fileIsCurrent(
  entries: readonly OutputStateEntry[],
  target: ExactTarget,
): boolean {
  const current = entryAt(entries, target.path);
  return (
    current?.kind === OutputEntryKind.File &&
    current.content.equals(target.artifact.content)
  );
}

function treeIsCurrent(
  entries: readonly OutputStateEntry[],
  target: TreeTarget,
): boolean {
  const actual = entries.filter((entry) =>
    isInsideTree(target.root, entry.path),
  );
  if (actual.length !== target.artifacts.length) return false;
  return target.artifacts.every((expected) => {
    const current = entryAt(actual, expected.path);
    if (current?.kind !== expected.kind) return false;
    if (expected.kind === OutputEntryKind.Directory) return true;
    return (
      current.kind === OutputEntryKind.File &&
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

/** Write one validated plan while preserving exact provider and whole-tree ownership. */
export async function writeOutputPlan(
  rootDir: string,
  plan: OutputPlan,
): Promise<WriteResult> {
  const repositoryRoot = await assertRealRepository(rootDir);
  const { exact, trees } = collectTargets(plan);
  await preflightTargets(repositoryRoot, exact, trees);
  const current = await readOutputState(repositoryRoot, plan);
  const changedExact = exact.filter(
    (target) => !fileIsCurrent(current.entries, target),
  );
  const changedTrees = trees.filter(
    (target) => !treeIsCurrent(current.entries, target),
  );
  const stagedTrees = new Map<ProjectPath, string>();

  try {
    for (const target of changedTrees) {
      stagedTrees.set(
        target.root,
        await stageOutputTree(repositoryRoot, target.root, target.artifacts),
      );
    }
    for (const target of changedExact) {
      await atomicWrite(repositoryRoot, target.path, target.artifact.content);
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
