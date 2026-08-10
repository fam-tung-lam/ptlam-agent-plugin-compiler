import { mkdir, writeFile } from "node:fs/promises";

import { createProjectPath, type ProjectPath } from "../../core/index.js";
import {
  assertRealRepository,
  assertSafePath,
} from "../safety/assert-safe-path.js";

const PLUGIN_DIRECTORY = createProjectPath("plugin");
const SKILLS_DIRECTORY = createProjectPath("plugin/skills");
const MANIFEST_PATH = createProjectPath("plugin/plugin.yml");

/**
 * Filesystem facts produced while creating the authored plugin source.
 *
 * @internal
 */
export interface PluginSourceInitialization {
  /** Paths created by this invocation. */
  readonly createdPaths: readonly ProjectPath[];
  /** Paths that already existed and were left unchanged. */
  readonly existingPaths: readonly ProjectPath[];
}

async function ensureDirectory(
  repositoryRoot: string,
  projectPath: ProjectPath,
): Promise<boolean> {
  const inspection = await assertSafePath(
    repositoryRoot,
    projectPath,
    "directory",
  );
  if (inspection.stats !== null) return false;
  await mkdir(inspection.absolutePath);
  return true;
}

async function ensureFile(
  repositoryRoot: string,
  projectPath: ProjectPath,
): Promise<boolean> {
  const inspection = await assertSafePath(repositoryRoot, projectPath, "file");
  if (inspection.stats !== null) return false;
  await writeFile(inspection.absolutePath, "", { flag: "wx" });
  return true;
}

/**
 * Create the minimal authored plugin layout without replacing existing entries.
 *
 * @param rootDir - Repository root that will contain the authored plugin source.
 * @returns Immutable created and pre-existing path facts.
 * @throws If the repository or an existing path is unsafe or has the wrong kind.
 * @internal
 */
export async function initializePluginSource(
  rootDir: string,
): Promise<PluginSourceInitialization> {
  const repositoryRoot = await assertRealRepository(rootDir);
  const createdPaths: ProjectPath[] = [];
  const existingPaths: ProjectPath[] = [];

  for (const directory of [PLUGIN_DIRECTORY, SKILLS_DIRECTORY]) {
    ((await ensureDirectory(repositoryRoot, directory))
      ? createdPaths
      : existingPaths
    ).push(directory);
  }

  ((await ensureFile(repositoryRoot, MANIFEST_PATH))
    ? createdPaths
    : existingPaths
  ).push(MANIFEST_PATH);

  return Object.freeze({
    createdPaths: Object.freeze(createdPaths),
    existingPaths: Object.freeze(existingPaths),
  });
}
