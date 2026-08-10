import { randomUUID } from "node:crypto";
import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ProjectPath } from "../../core/index.js";
import { assertSafePath } from "../safety/assert-safe-path.js";

/**
 * Replace one standalone owned file through an exclusive temporary sibling.
 *
 * @param repositoryRoot - Absolute real repository directory.
 * @param projectPath - Owned repository-relative file path.
 * @param content - Complete replacement bytes.
 * @returns When the temporary file has been renamed into place.
 * @throws If the target is unsafe or any filesystem operation fails.
 * @internal
 */
export async function atomicWrite(
  repositoryRoot: string,
  projectPath: ProjectPath,
  content: Uint8Array,
): Promise<void> {
  const inspection = await assertSafePath(repositoryRoot, projectPath, "file");
  await mkdir(path.dirname(inspection.absolutePath), { recursive: true });
  const temporaryPath = path.join(
    path.dirname(inspection.absolutePath),
    `.${path.basename(inspection.absolutePath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  try {
    await writeFile(temporaryPath, content, { flag: "wx" });
    await rename(temporaryPath, inspection.absolutePath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}
