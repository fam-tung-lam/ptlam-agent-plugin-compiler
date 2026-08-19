import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import {
  compareProjectPaths,
  createPluginSnapshot,
  createPluginSource,
  createProjectPath,
  type FilesystemDiagnostic,
  FilesystemDiagnosticOperation,
  FilesystemDiagnosticReason,
  type PluginSnapshot,
  type ProjectPath,
  type SourceEntryInput,
  SourceEntryKind,
  type SourceFileInput,
} from "../../core/index.js";
import {
  assertRealRepository,
  assertSafePath,
} from "../safety/assert-safe-path.js";

const MANIFEST_PATH = createProjectPath("plugin/plugin.yml");
const HOOKS_PATH = createProjectPath("plugin/hooks");
const SKILLS_PATH = createProjectPath("plugin/skills");

function compareDirents(left: Dirent, right: Dirent): number {
  return left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function diagnostic(
  path: ProjectPath,
  operation: FilesystemDiagnosticOperation,
  reason: FilesystemDiagnosticReason,
  message: string,
): FilesystemDiagnostic {
  return { path, operation, reason, message };
}

function diagnosticReason(error: unknown): FilesystemDiagnosticReason {
  if (error instanceof Error && "code" in error) {
    if (error.code === "ENOENT") return FilesystemDiagnosticReason.Missing;
    if (error.code === "EACCES" || error.code === "EPERM")
      return FilesystemDiagnosticReason.Permission;
  }
  if (errorMessage(error).includes("symbolic link"))
    return FilesystemDiagnosticReason.Symlink;
  if (errorMessage(error).includes("expected a regular"))
    return FilesystemDiagnosticReason.UnsupportedKind;
  return FilesystemDiagnosticReason.Io;
}

async function readManifest(
  repositoryRoot: string,
  diagnostics: FilesystemDiagnostic[],
): Promise<SourceFileInput | null> {
  try {
    const inspection = await assertSafePath(
      repositoryRoot,
      MANIFEST_PATH,
      "file",
    );
    if (inspection.stats === null) {
      diagnostics.push(
        diagnostic(
          MANIFEST_PATH,
          FilesystemDiagnosticOperation.Inspect,
          FilesystemDiagnosticReason.Missing,
          `${MANIFEST_PATH}: source file is missing`,
        ),
      );
      return null;
    }
    return {
      kind: SourceEntryKind.File,
      path: MANIFEST_PATH,
      content: await readFile(inspection.absolutePath),
    };
  } catch (error) {
    diagnostics.push(
      diagnostic(
        MANIFEST_PATH,
        FilesystemDiagnosticOperation.Read,
        diagnosticReason(error),
        `${MANIFEST_PATH}: cannot read source (${errorMessage(error)})`,
      ),
    );
    return null;
  }
}

function childProjectPath(
  parent: ProjectPath,
  name: string,
  diagnostics: FilesystemDiagnostic[],
): ProjectPath | null {
  const candidate = `${parent}/${name}`;
  try {
    return createProjectPath(candidate);
  } catch (error) {
    diagnostics.push(
      diagnostic(
        parent,
        FilesystemDiagnosticOperation.Inspect,
        FilesystemDiagnosticReason.UnsupportedKind,
        `${candidate}: invalid logical source path (${errorMessage(error)})`,
      ),
    );
    return null;
  }
}

async function walkSourceDirectory(
  absoluteDirectory: string,
  logicalDirectory: ProjectPath,
  entries: SourceEntryInput[],
  diagnostics: FilesystemDiagnostic[],
): Promise<void> {
  let children: Dirent[];
  try {
    children = await readdir(absoluteDirectory, { withFileTypes: true });
  } catch (error) {
    diagnostics.push(
      diagnostic(
        logicalDirectory,
        FilesystemDiagnosticOperation.Inspect,
        diagnosticReason(error),
        `${logicalDirectory}: cannot inspect source directory (${errorMessage(error)})`,
      ),
    );
    return;
  }

  for (const child of children.sort(compareDirents)) {
    const logicalPath = childProjectPath(
      logicalDirectory,
      child.name,
      diagnostics,
    );
    if (logicalPath === null) continue;
    const absolutePath = path.join(absoluteDirectory, child.name);
    if (child.isSymbolicLink()) {
      diagnostics.push(
        diagnostic(
          logicalPath,
          FilesystemDiagnosticOperation.Inspect,
          FilesystemDiagnosticReason.Symlink,
          `${logicalPath}: symbolic links are not supported in source paths`,
        ),
      );
    } else if (child.isDirectory()) {
      entries.push({ kind: SourceEntryKind.Directory, path: logicalPath });
      await walkSourceDirectory(
        absolutePath,
        logicalPath,
        entries,
        diagnostics,
      );
    } else if (child.isFile()) {
      try {
        entries.push({
          kind: SourceEntryKind.File,
          path: logicalPath,
          content: await readFile(absolutePath),
        });
      } catch (error) {
        diagnostics.push(
          diagnostic(
            logicalPath,
            FilesystemDiagnosticOperation.Read,
            diagnosticReason(error),
            `${logicalPath}: cannot read source (${errorMessage(error)})`,
          ),
        );
      }
    } else {
      diagnostics.push(
        diagnostic(
          logicalPath,
          FilesystemDiagnosticOperation.Inspect,
          FilesystemDiagnosticReason.UnsupportedKind,
          `${logicalPath}: expected a regular file or directory`,
        ),
      );
    }
  }
}

/**
 * Read bounded authored source facts without parsing or business validation.
 *
 * Recoverable manifest, skill-tree, and hook-tree failures are returned as diagnostics.
 *
 * @param rootDir - Repository root containing the manifest, skills, and optional hooks.
 * @returns An immutable source snapshot with ordered filesystem diagnostics.
 * @throws If the repository root is missing, linked, or not a directory.
 * @internal
 */
export async function readPluginSource(
  rootDir: string,
): Promise<PluginSnapshot> {
  const repositoryRoot = await assertRealRepository(rootDir);
  const diagnostics: FilesystemDiagnostic[] = [];
  const manifest = await readManifest(repositoryRoot, diagnostics);
  const hookEntries: SourceEntryInput[] = [];
  const skillEntries: SourceEntryInput[] = [];

  try {
    const inspection = await assertSafePath(
      repositoryRoot,
      HOOKS_PATH,
      "directory",
    );
    if (inspection.stats !== null) {
      await walkSourceDirectory(
        inspection.absolutePath,
        HOOKS_PATH,
        hookEntries,
        diagnostics,
      );
    }
  } catch (error) {
    diagnostics.push(
      diagnostic(
        HOOKS_PATH,
        FilesystemDiagnosticOperation.Inspect,
        diagnosticReason(error),
        `${HOOKS_PATH}: cannot inspect source (${errorMessage(error)})`,
      ),
    );
  }

  try {
    const inspection = await assertSafePath(
      repositoryRoot,
      SKILLS_PATH,
      "directory",
    );
    if (inspection.stats === null) {
      diagnostics.push(
        diagnostic(
          SKILLS_PATH,
          FilesystemDiagnosticOperation.Inspect,
          FilesystemDiagnosticReason.Missing,
          `${SKILLS_PATH}: source directory is missing`,
        ),
      );
    } else {
      await walkSourceDirectory(
        inspection.absolutePath,
        SKILLS_PATH,
        skillEntries,
        diagnostics,
      );
    }
  } catch (error) {
    diagnostics.push(
      diagnostic(
        SKILLS_PATH,
        FilesystemDiagnosticOperation.Inspect,
        diagnosticReason(error),
        `${SKILLS_PATH}: cannot inspect source (${errorMessage(error)})`,
      ),
    );
  }

  diagnostics.sort((left, right) => {
    const pathOrder = compareProjectPaths(left.path, right.path);
    return pathOrder !== 0
      ? pathOrder
      : left.message < right.message
        ? -1
        : left.message > right.message
          ? 1
          : 0;
  });
  return createPluginSnapshot({
    source: createPluginSource({ manifest, hookEntries, skillEntries }),
    diagnostics,
  });
}
