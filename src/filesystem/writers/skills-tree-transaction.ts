import { randomUUID } from "node:crypto";
import type { Dirent } from "node:fs";
import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import {
  type Artifact,
  ArtifactKind,
  compareProjectPaths,
  type ProjectPath,
} from "../../core/index.js";
import { assertSafePath } from "../safety/assert-safe-path.js";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function relativeArtifactPath(
  root: ProjectPath,
  artifact: ProjectPath,
): string {
  if (artifact === root) return "";
  const prefix = `${root}/`;
  if (!artifact.startsWith(prefix)) {
    throw new Error(`${artifact}: output is outside owned tree ${root}`);
  }
  return artifact.slice(prefix.length);
}

function compareDirents(left: Dirent, right: Dirent): number {
  return left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
}

async function snapshotStagedTree(
  directory: string,
  root: ProjectPath,
): Promise<Artifact[]> {
  const artifacts: Artifact[] = [
    Object.freeze({ kind: ArtifactKind.Directory, path: root }),
  ];
  async function visit(absoluteDirectory: string, relativeDirectory: string) {
    const children = await readdir(absoluteDirectory, { withFileTypes: true });
    for (const child of children.sort(compareDirents)) {
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${child.name}`
        : child.name;
      const projectPath = `${root}/${relativePath}` as ProjectPath;
      const absolutePath = path.join(absoluteDirectory, child.name);
      if (child.isDirectory()) {
        artifacts.push(
          Object.freeze({ kind: ArtifactKind.Directory, path: projectPath }),
        );
        await visit(absolutePath, relativePath);
      } else if (child.isFile()) {
        const bytes = await readFile(absolutePath);
        artifacts.push(
          Object.freeze({
            kind: ArtifactKind.File,
            path: projectPath,
            get content(): Buffer {
              return Buffer.from(bytes);
            },
          }),
        );
      } else {
        throw new Error(
          `${projectPath}: staged output has an unsupported kind`,
        );
      }
    }
  }
  await visit(directory, "");
  return artifacts.sort((left, right) =>
    compareProjectPaths(left.path, right.path),
  );
}

function artifactsMatch(
  expected: readonly Artifact[],
  actual: readonly Artifact[],
): boolean {
  if (expected.length !== actual.length) return false;
  return expected.every((entry, index) => {
    const candidate = actual[index];
    if (
      candidate === undefined ||
      entry.path !== candidate.path ||
      entry.kind !== candidate.kind
    ) {
      return false;
    }
    return entry.kind === ArtifactKind.Directory
      ? true
      : candidate.kind === ArtifactKind.File &&
          entry.content.equals(candidate.content);
  });
}

/**
 * Build and byte-verify a complete replacement tree before installation.
 *
 * @param repositoryRoot - Absolute real repository directory.
 * @param root - Owned complete-tree root.
 * @param artifacts - Complete desired artifact set below the root.
 * @returns The absolute temporary directory containing the verified tree.
 * @throws If artifacts escape the root, verification differs, or staging fails.
 * @internal
 */
export async function stageGeneratedTree(
  repositoryRoot: string,
  root: ProjectPath,
  artifacts: readonly Artifact[],
): Promise<string> {
  const stagedPath = path.join(
    repositoryRoot,
    `.plugin-compiler-${path.basename(root)}-${randomUUID()}.tmp`,
  );
  try {
    await mkdir(stagedPath, { recursive: false });
    for (const artifact of artifacts) {
      const relativePath = relativeArtifactPath(root, artifact.path);
      if (relativePath === "") continue;
      const stagedArtifactPath = path.join(
        stagedPath,
        ...relativePath.split("/"),
      );
      if (artifact.kind === ArtifactKind.Directory) {
        await mkdir(stagedArtifactPath, { recursive: true });
      } else {
        await mkdir(path.dirname(stagedArtifactPath), { recursive: true });
        await writeFile(stagedArtifactPath, artifact.content, { flag: "wx" });
      }
    }
    const expected = [...artifacts].sort((left, right) =>
      compareProjectPaths(left.path, right.path),
    );
    const actual = await snapshotStagedTree(stagedPath, root);
    if (!artifactsMatch(expected, actual)) {
      throw new Error(`${root}: staged bytes differ from the write plan`);
    }
    return stagedPath;
  } catch (error) {
    await rm(stagedPath, { force: true, recursive: true });
    throw error;
  }
}

/**
 * Install one staged tree and restore its predecessor on swap failure.
 *
 * @param repositoryRoot - Absolute real repository directory.
 * @param root - Owned complete-tree root to replace.
 * @param stagedPath - Absolute verified staging directory.
 * @returns When installation and backup cleanup complete.
 * @throws If the target is unsafe, installation fails, recovery is incomplete, or backup cleanup fails.
 * @internal
 */
export async function installStagedTree(
  repositoryRoot: string,
  root: ProjectPath,
  stagedPath: string,
): Promise<void> {
  const target = await assertSafePath(repositoryRoot, root, "directory");
  const backupPath = path.join(
    repositoryRoot,
    `.plugin-compiler-${path.basename(root)}-${randomUUID()}.bak`,
  );
  let targetMoved = false;

  try {
    if (target.stats !== null) {
      await rename(target.absolutePath, backupPath);
      targetMoved = true;
    }
    await mkdir(path.dirname(target.absolutePath), { recursive: true });
    await rename(stagedPath, target.absolutePath);
  } catch (installError) {
    const recoveryErrors: unknown[] = [];
    await rm(stagedPath, { force: true, recursive: true }).catch((error) =>
      recoveryErrors.push(error),
    );
    if (targetMoved) {
      await rename(backupPath, target.absolutePath).catch((error) =>
        recoveryErrors.push(error),
      );
    }
    if (recoveryErrors.length > 0) {
      throw new AggregateError(
        [installError, ...recoveryErrors],
        `Failed to install ${root} and fully restore the prior managed tree`,
        { cause: installError },
      );
    }
    throw installError;
  }

  if (targetMoved) {
    try {
      await rm(backupPath, { force: true, recursive: true });
    } catch (error) {
      throw new Error(
        `Installed ${root} but failed to remove preserved backup ${path.basename(backupPath)}: ${errorMessage(error)}`,
        { cause: error },
      );
    }
  }
}
